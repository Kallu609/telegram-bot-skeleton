const keys = require('./config');
const bb = require('bot-brother');
const axios = require('axios');
const interval = require('interval-promise');

// Create bot object
const bot = bb({
  key: keys.telegram,
  sessionManager: bb.sessionManager.memory(),
  polling: { interval: 0, timeout: 1 },
});

// List of supported currencies throughout the app
const supportedCurrencies = ['USD', 'EUR', 'GBP'];
let supportedAll; // cryptoList.concat(supportedCurrencies);

// This is for /crypto command
const cryptosToShow = ['BTC', 'ETH', 'BCH'];
const currenciesToShow = ['EUR', 'USD'];

// Build API url
const apiUrls = {
  price: 'https://min-api.cryptocompare.com/data/pricemulti',
  coinlist: 'https://min-api.cryptocompare.com/data/all/coinlist',
};

// List of cryptos, this is fetched by getCryptoList() on start up
let cryptoList;
getCryptoList();

// Default message options
const messageOptions = { parse_mode: 'Markdown', disable_notification: true, reply_markup: {} };

// Build notification array
let notifications = {};

/*
* Builds API url
* Supports arrays and strings as parameters
*/
function buildApiUrl(fromCurrency, toCurrency) {
  const from = (Array.isArray(fromCurrency)) ? fromCurrency.join(',') : fromCurrency;
  const to = (Array.isArray(toCurrency)) ? toCurrency.join(',') : toCurrency;
  return `${apiUrls.price}?fsyms=${from}&tsyms=${to}`;
}

/*
* Returns a string containing all current notifications
*/
function getNotifications(chatId) {
  let currentlyNotifying = '*Currently notifying when:*\n';

  // No notifications for current chat
  if (notifications[chatId] === undefined) {
    currentlyNotifying += 'Never';

    // Chat has notifications
  } else if (notifications[chatId].length > 0) {
    notifications[chatId].forEach((notification) => {
      currentlyNotifying += `${notification.crypto} ${
        notification.comparator}${notification.rate} ${
        notification.currency}\n`;
    });

    // Remove trailing \n
    currentlyNotifying.slice(0, -1);
  }

  return currentlyNotifying;
}

/*
* Check notifications
*/
function checkNotifications() {
  if (Object.keys(notifications).length > 0) {
    // Get list of cryptos and currencies that need to be fetched from API
    const cryptosToFetch = [];
    const currenciesToFetch = [];

    for (const chatId in notifications) {
      notifications[chatId].forEach((notification, index, object) => {
        if (!cryptosToFetch.includes(notification.crypto)) {
          cryptosToFetch.push(notification.crypto);
        }
        if (!currenciesToFetch.includes(notification.currency)) {
          currenciesToFetch.push(notification.currency);
        }
      });
    }

    return axios.get(buildApiUrl(cryptosToFetch, currenciesToFetch))
      .then((response) => {
        const { data } = response;

        // Loop through each chat
        for (const chatId in notifications) {
          // Loop through each notification
          notifications[chatId].forEach((notification, index, object) => {
            // Get current rate of crypto
            const currentRate = data[notification.crypto][notification.currency].toFixed(2);

            // Check if current rate is over / under the notification rate
            if (notification.comparator === '>') {
              if (notification.rate < currentRate) {
                // Show notification and remove it
                showNotification(notification, currentRate);
                object.splice(index, 1);
              }
            } else if (notification.comparator === '<') {
              if (notification.rate > currentRate) {
                // Show notification and remove it
                showNotification(notification, currentRate);
                object.splice(index, 1);
              }
            }
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  return Promise.resolve();
}

// Check notifications every 3 seconds
// TODO: Change to greater interval, load notifications from file?
interval(async () => {
  await checkNotifications();
}, 1000 * 3);

/*
* Returns all available cryptos from CryptoCompare API
*/
function getCryptoList() {
  axios.get(apiUrls.coinlist)
    .then((response) => {
      cryptoList = Object.keys(response.data.Data);
      supportedAll = cryptoList.concat(supportedCurrencies);
    })
    .catch((error) => {
      console.log(error);
    });
}

/*
* Returns help text
* */
function getHelpText(command) {
  if (command === 'crypto') {
    return '*Usage:*\n' +
                '/crypto <amount> <from> to <to>\n' +
                '/crypto';
  }

  if (command === 'notify') {
    return `${'*Usage:*\n' +
                '/notify <crypto> <comparator><amount> <currency>\n' +
                '/notify clear\n' +
                '/notify\n\n' +
                '*Example:* /notify btc >150 eur\n\n'}${
      getNotifications()}`;
  }

  return '*Commands*' +
    '```\n/help [command]\n' +
    '/crypto\n' +
    '/notify```';
}

/*
* Check if variable is int or float
*/
function isNumber(num) {
  return !Number.isNaN(num);
}

/*
* Simple debug command
*/
bot.command('debug')
  .invoke(() => {
    console.log(Object.keys(cryptoList));
  });

// Show help
bot.command('help')
  .invoke((ctx) => {
    const { args } = ctx.command;

    if (args.length === 0) {
      ctx.sendMessage(getHelpText('help'), messageOptions);
    }
    if (args.length === 1) {
      const text = getHelpText(args[0]);

      if (text) {
        ctx.sendMessage(text, messageOptions);
      } else {
        ctx.sendMessage('`Command not found`', messageOptions);
      }
    }
  });

/*
* Crypto command
*/
bot.command('crypto').invoke((ctx) => {
  ctx.go('c');
});

bot.command('c')
  .use('before', (ctx) => {
    const { args } = ctx.command;
    ctx.crypto = null;
    ctx.error = [];

    // Example: /c
    let cryptos = cryptosToShow;
    let toShow = currenciesToShow;

    // Example: /c btc
    if (args.length === 1) {
      const crypto = args[0].toUpperCase();

      if (cryptoList.includes(crypto)) {
        cryptos = crypto;
      } else {
        // Throw error
        ctx.error.push('Crypto not found or supported');
      }
    } else if (args.length >= 3) { // Example: /c 1 btc (to) eur
      cryptos = args[1].toUpperCase();
      toShow = args[args.length - 1].toUpperCase();

      if (!isNumber(args[0])) {
        ctx.error.push('First argument isn\'t a number');
      }
      if (!supportedAll.includes(cryptos) || !supportedAll.includes(toShow)) {
        ctx.error.push('Crypto(s) not found or supported');
      }
    }

    if (ctx.error.length === 0) { // If no errors
      return axios.get(buildApiUrl(cryptos, toShow))
        .then((response) => {
          ctx.crypto = response.data;
        })
        .catch((error) => {
          console.log(error);
        });
    }
    return Promise.resolve();
  })
  .invoke((ctx) => {
    // Error handling
    if (ctx.error.length > 0) {
      ctx.sendMessage(ctx.error.join('! '), messageOptions);
      console.log(ctx.error);

      ctx.error = []; // Empty the error log
      return;
    }

    // Data not acquired
    if (ctx.crypto === null) {
      return;
    }

    const { args } = ctx.command;
    let result = '';

    // Example: /c
    if (args.length === 0) {
      cryptosToShow.forEach((crypto) => {
        currenciesToShow.forEach((currency) => {
          result += `*1 ${crypto}* to *${currency}*: \`${ctx.crypto[crypto][currency].toFixed(2)}\`\n`;
        });
      });
    } else if (args.length === 1) { // Example: /c btc
      const crypto = args[0].toUpperCase();

      currenciesToShow.forEach((currency) => {
        result += `*1 ${crypto}* to *${currency}*: \`${ctx.crypto[crypto][currency].toFixed(2)}\`\n`;
      });
    } else if (args.length >= 3) {
      const fromAmount = args[0];
      const fromCurrency = args[1].toUpperCase();
      const toCurrency = args[3].toUpperCase();

      result = `*${fromAmount} ${fromCurrency}* to *${toCurrency}*: ` +
                      `\`${(fromAmount * ctx.crypto[fromCurrency][toCurrency]).toFixed(2)}\``;
    }

    ctx.sendMessage(result, messageOptions);
  });

/*
* Notify command
*/
bot.command('notify')
  .invoke((ctx) => {
    const { args } = ctx.command;
    const chatId = ctx.message.chat.id;

    // Show list of current notifications
    if (args.length === 0) {
      ctx.sendMessage(getNotifications(chatId), messageOptions);
    } else if (args.length === 1) {
      if (args[0] === 'clear') {
        notifications = [];
        ctx.sendMessage('Cleared notifying list!', messageOptions);
      } else {
        ctx.sendMessage(getHelpText('notify'), messageOptions);
      }

    // Example: /notify btc >15000 eur
    } else if (args.length === 3) {
      const crypto = args[0].toUpperCase();
      const comparator = args[1][0];
      const rate = args[1].slice(1); // Slice removes < or > if there's any
      const currency = args[2].toUpperCase();

      // Add new notification if values are valid
      if (['>', '<'].includes(comparator) &&
            cryptoList.includes(crypto) &&
            supportedCurrencies.includes(currency) &&
            isNumber(rate)) {
        const notification = [];

        notification.crypto = crypto;
        notification.comparator = comparator;
        notification.rate = parseFloat(rate);
        notification.currency = currency;
        notification.ctx = ctx;

        // Create chat 'group' if it doesn't exist
        if (notifications[chatId] === undefined) {
          notifications[chatId] = [];
        }

        notifications[chatId].push(notification);

        ctx.sendMessage(`Added new notification!\n\n${
          getNotifications(chatId)}`, messageOptions);
      } else {
        ctx.sendMessage(getHelpText('notify'), messageOptions);
      }
    } else {
      ctx.sendMessage(getHelpText('notify'), messageOptions);
    }
  });
