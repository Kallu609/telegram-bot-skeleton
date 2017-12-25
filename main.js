const keys = require('./config');
const bb = require('bot-brother');
const axios = require('axios');
const interval = require('interval-promise')

// Create bot object
bot = bb({
    key: keys.telegram,
    sessionManager: bb.sessionManager.memory(),
    polling: { interval: 0, timeout: 1 }
});

// List of supported currencies throughout the app
let supportedCurrencies = ['USD', 'EUR', 'GBP'];
let supportedAll; // cryptoList.concat(supportedCurrencies);

// This is for /crypto command
let cryptosToShow = ['BTC', 'ETH', 'BCH'];
let currenciesToShow = ['EUR', 'USD'];

// Build API url
let apiUrls = {
    price: 'https://min-api.cryptocompare.com/data/pricemulti',
    coinlist: 'https://min-api.cryptocompare.com/data/all/coinlist'
}

// List of cryptos, this is fetched by getCryptoList() on start up
let cryptoList;
getCryptoList();

// Default message options
const messageOptions = {parse_mode: 'Markdown', disable_notification: true, reply_markup: {}};

// Check notifications every 3 seconds
// TODO: Change to greater interval, load notifications from file?
let notifications = {};

interval(async () => {
    await checkNotifications()
}, 1000 * 3)

/*
* Builds API url
* Supports arrays and strings as parameters
*/
function buildApiUrl(fromCurrency, toCurrency) {
    fromCurrency = (Array.isArray(fromCurrency)) ? fromCurrency.join(',') : fromCurrency;
    toCurrency   = (Array.isArray(toCurrency))   ? toCurrency.join(',')   : toCurrency;
    
    return `${apiUrls.price}?fsyms=${fromCurrency}&tsyms=${toCurrency}`;
}

/*
* Returns all available cryptos from CryptoCompare API
*/
function getCryptoList() {
    axios.get(apiUrls.coinlist)
    .then(function (response) {
        cryptoList = Object.keys(response.data.Data);
        supportedAll = cryptoList.concat(supportedCurrencies);
    })
    .catch(function (error) {
        console.log(error);
    });
}

/*
* Returns help text
**/
function getHelpText(command) {
    if (command == 'help') {
        return  '*Commands*' + 
                '```\n/help [command]\n' + 
                '/crypto\n' +
                '/notify```';
    }

    if (command === 'crypto') {
        return  '*Usage:*\n' +
                '/crypto <amount> <from> to <to>\n' +
                '/crypto'
    }

    if (command === 'notify') {
        return  '*Usage:*\n' + 
                '/notify <crypto> <comparator><amount> <currency>\n' +
                '/notify clear\n' + 
                '/notify\n\n' +
                '*Example:* /notify btc >150 eur\n\n' +
                getNotifications();
    }

    return false;
}

/*
* Check if variable is int or float
*/
function isNumber(num) {
    return !isNaN(num);
}

/*
* Simple debug command
*/
bot.command('debug')
.invoke(function (ctx) {
    console.log(Object.keys(cryptoList));
});

// Show help
bot.command('help')
.invoke(function (ctx) {
    const args = ctx.command.args;

    if (args.length === 0) {
        ctx.sendMessage(getHelpText('help'), messageOptions);
    }
    if (args.length == 1) {
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
bot.command('crypto')
.invoke(function (ctx) {
    const args = ctx.command.args;
    
    // No arguments
    if (args.length === 0) {
        axios.get(buildApiUrl(cryptosToShow, currenciesToShow))
        .then(function (response) {
            const data = response.data;
            let result = '';

            cryptosToShow.forEach(crypto => {
                currenciesToShow.forEach(currency => {
                    result += `*1 ${ crypto }* to *${ currency }*: \`${ data[crypto][currency].toFixed(2) }\`\n`
                });

                result += '\n';
            });

            result.slice(0, -2);

            ctx.sendMessage(result, messageOptions);
        })
        .catch(function (error) {
            console.log(error);
        });
    }

    // Example: /crypto btc
    if (args.length === 1) {
        const crypto = args[0].toUpperCase();

        if (cryptoList.includes(crypto)) {
            axios.get(buildApiUrl(crypto, currenciesToShow))
            .then(function (response) {
                const data = response.data;
                let result = '';
                
                currenciesToShow.forEach(currency => {
                    result += `*1 ${ crypto }* to *${ currency }*: \`${ data[crypto][currency].toFixed(2) }\`\n`
                });

                result.slice(0, -1);
                
                ctx.sendMessage(result, messageOptions);
            })
            .catch(function (error) {
                console.log(error);
            });
        }
    }

    // Example: 1 btc to eur
    if (args.length === 4) {
        if (isNumber(args[0]) && supportedAll.includes(args[1].toUpperCase()) &&
            args[2] === 'to'  && supportedAll.includes(args[3].toUpperCase())) {

            const fromAmount = args[0];
            const fromCurrency = args[1].toUpperCase();
            const toCurrency = args[3].toUpperCase();

            axios.get(buildApiUrl(fromCurrency, toCurrency))
            .then(function (response) {
                const data = response.data;

                let result = `*${fromAmount} ${fromCurrency}* to *${toCurrency}*: ` +
                            `\`${ (fromAmount * data[fromCurrency][toCurrency]).toFixed(2) }\``;

                ctx.sendMessage(result, messageOptions);
            })
            .catch(function (error) {
                console.log(error);
            });

        } else {
            ctx.sendMessage(getHelpText('crypto'), messageOptions);
        }
    }
});

/*
* Notify command
*/
bot.command('notify')
.invoke(function (ctx) {
    const args = ctx.command.args;
    const chatId = ctx.message.chat.id;

    // Show list of current notifications
    if (args.length == 0) {
        ctx.sendMessage(getNotifications(chatId), messageOptions);
        
    } else if (args.length == 1) {
        if (args[0] == 'clear') {
            notifications = [];
            ctx.sendMessage('Cleared notifying list!', messageOptions);
        } else {
            ctx.sendMessage(getHelpText('notify'), messageOptions);
        }

    // Example: /notify btc >15000 eur
    } else if(args.length == 3) {
        const crypto = args[0].toUpperCase();
        const comparator = args[1][0];
        const rate = args[1].slice(1); // Slice removes < or > if there's any
        const currency = args[2].toUpperCase();

        // Add new notification if values are valid
        if( ['>', '<'].includes(comparator) &&
            cryptoList.includes(crypto) &&
            supportedCurrencies.includes(currency) &&
            isNumber(rate)) {
            
            let notification = [];

            notification.crypto     = crypto;
            notification.comparator = comparator;
            notification.rate       = parseFloat(rate);
            notification.currency   = currency;
            notification.ctx        = ctx;

            // Create chat 'group' if it doesn't exist
            if (notifications[chatId] === undefined) {
                notifications[chatId] = [];
            }

            notifications[chatId].push(notification);

            ctx.sendMessage('Added new notification!\n\n' +
                            getNotifications(chatId), messageOptions);
        } else {
            ctx.sendMessage(getHelpText('notify'), messageOptions);
        }

    } else {
        ctx.sendMessage(getHelpText('notify'), messageOptions);
    }
});

/*
* Check notifications
*/
function checkNotifications() {
    if (Object.keys(notifications).length > 0) {

        // Get list of cryptos and currencies that need to be fetched from API
        let cryptosToFetch = [];
        let currenciesToFetch = [];
        
        for (let chatId in notifications) {
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
        .then(function (response) {
            const data = response.data;

            // Loop through each chat
            for (let chatId in notifications) {

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
                    }
                    
                    else if (notification.comparator === '<') {
                        if (notification.rate > currentRate) {
                            // Show notification and remove it
                            showNotification(notification, currentRate);
                            object.splice(index, 1);
                        }
                    }
                });
            }
        })
        .catch(function (error) {
            console.log(error);
        });
    }
    return Promise.resolve();
}

/*
* Send notification message
*/
function showNotification(notification, currentRate) {
    const overOrUnder = (notification.comparator === '>') ? 'over' : 'under';

    notification.ctx.sendMessage(
        `*1 ${notification.crypto}* is now ${overOrUnder} *${notification.rate} ${notification.currency}*\n\n` + 
        `*1 ${notification.crypto}:* ${currentRate} ${notification.currency}`,
        messageOptions
    );
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
        notifications[chatId].forEach(notification => {

            currentlyNotifying +=   notification.crypto + ' ' +
                                    notification.comparator + notification.rate + ' ' +
                                    notification.currency + '\n';

        });

        // Remove trailing \n
        currentlyNotifying.slice(0, -1); 
    }

    return currentlyNotifying;
}
