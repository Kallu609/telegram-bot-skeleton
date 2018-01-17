import axios from 'axios';
import * as interval from 'interval-promise';
import * as TelegramBot from 'node-telegram-bot-api';
import { config } from '../config';
import { buildApiUrl, isNumber } from '../helpers/api';
import { data, ICryptos, INotification, writeData } from '../helpers/database';
import { ICommand, IMsg } from '../helpers/interface';
import { errorHandling, parseArgs } from '../helpers/message';

/* Notify command functionality */
export default function(bot) : ICommand {
  return {
    regexp: /\/notify[ ]?(.*)$/,
    name: 'notify',
    help: 'Notifies you when cryptocurrency\'s rate is over / under set value',
    usage: '/notify <crypto> <comparator><amount> <currency>\n' +
           '/notify clear\n' +
           '/notify',

    handler: ({msg, matches}) => {
      const args = parseArgs(matches);
      let message = `Command query not supported.\nRefer to */help* if needed`;

      // Example: /notify
      if(args.length === 0) {
        message = '*Currently notifying when:*\n';

        const chatNotifications = getNotifications(msg.chat.id);
        
        if(chatNotifications.length > 0) {
          chatNotifications.forEach((n) => {
            message += `${n.crypto} ${n.comparator}${n.rate} ${n.currency}\n`
          });
        } else {
          message += 'Never\n\nRefer to */help* if needed';
        }

        return bot.sendMessage(msg.chat.id, message, config.messageOptions);
      // Example: /notify clear
      } else if(args.length === 1) {
        if(args[0] === 'clear') {
          // clear
          return bot.sendMessage(msg.chat.id, 'Cleared your notifications!', config.messageOptions);
        }
      // Example /notify btc >15000 eur
      } else if(args.length === 3) {
        // add notification
        return addNotification(bot, msg, matches)
        .then((response) => {
          showNotification(bot, response);
        });
      }

      return bot.sendMessage(msg.chat.id, `Command query not supported.\nConsult */help* if needed`, config.messageOptions);
    }
  }
}

function addNotification(bot : TelegramBot, msg : IMsg, matches : any[]) : Promise<any> {
  const args = parseArgs(matches);

  const crypto = args[0].toUpperCase();
  const comparator = args[1][0];
  const rate : number = parseFloat(parseFloat(args[1].slice(1)).toFixed(2)); // Slice removes < or > if there's any, todo: FIX THIS
  const currency = args[2].toUpperCase();

  // Add new notification if values are valid
  if (
    ['>', '<'].includes(comparator) &&
    data.cryptoCurrencies.includes(crypto) &&
    data.allCurrencies.includes(currency) &&
    isNumber(rate)
  ) {
    const notification : INotification = {
      chatId: msg.chat.id,
      userId: msg.from.id,
      crypto,
      comparator,
      rate,
      currency
    };

    data.notifications.push(notification);
  }
  
  bot.sendMessage(msg.chat.id, 'Added new notification!', config.messageOptions);

  return checkNotifications();
}

// Get notifications by chat id
function getNotifications(chatId : number) : INotification[] {
  const notifications = data.notifications;
  const neededNotifications : INotification[] = [];

  notifications.forEach((notification : INotification, index, object) => {
    if(notification.chatId === chatId) {
      neededNotifications.push(notification);
    }
  });

  return neededNotifications;
}

/*
 * Notifier functionality
 */
export function startNotifier(bot : TelegramBot) : Promise<any> {
  return interval(
    async () => {
      await checkNotifications().then((response) => {
          showNotification(bot, response);
      });

      await writeData();
    },
    10000,
    { stopOnError: false }
  );
}

// Print notifications from notifier
function showNotification(bot : TelegramBot, notificationData : ICheckNotification[]) : void {
  notificationData.forEach((n) => {
    const overOrUnder = (n.notification.comparator === '>') ? 'over' : 'under';
  
    return bot.sendMessage(
      n.notification.chatId,
      `*1 ${n.notification.crypto}* is now ${overOrUnder} *${n.notification.rate} ${n.notification.currency}*\n\n` +
      `*1 ${n.notification.crypto}:* \`${n.currentRate} ${n.notification.currency}\``,
      config.messageOptions
    );
  });
}

interface ICheckNotification {
  notification: INotification;
  currentRate: number;
}

function checkNotifications() : Promise<any> {
  return getRequiredCurrencies().then(response => {
    // Notifications we need to be notifying
    const neededNotifications : ICheckNotification[] = [];

    // Iterate through all notifications to know what we need
    data.notifications.forEach((notification : INotification, index, object) => {
      const currentRate : number = response.data[notification.crypto][notification.currency].toFixed(2);
      
      if(
        (notification.comparator === '>' && currentRate > notification.rate) ||
        (notification.comparator === '<' && currentRate < notification.rate)
      ) {
        neededNotifications.push({ notification, currentRate });
        object.splice(index, 1);
      }
    });
    
    // Return ICheckNotifications[] for then
    return neededNotifications;
  }).catch(error => {
    errorHandling(error);
  });
}

// Creates the API call
function getRequiredCurrencies() : Promise<any> {
  const notifications = data.notifications;

  // Check existing notifications to check what values we need from the API
  let cryptoCurrenciesToFetch : string[] = [];
  let currenciesToFetch : string[] = [];

  ({cryptoCurrenciesToFetch, currenciesToFetch} = getExistingCurrencies(notifications));

  return axios.get(buildApiUrl(cryptoCurrenciesToFetch, currenciesToFetch));
}

interface IExistingCurrencies {
  cryptoCurrenciesToFetch: string[];
  currenciesToFetch: string[];
}

function getExistingCurrencies(notifications : INotification[]) : IExistingCurrencies {
  const cryptoCurrenciesToFetch : string[] = [];
  const currenciesToFetch : string[] = [];

  for(const notification of notifications) {
    if (!cryptoCurrenciesToFetch.includes(notification.crypto)) {
      cryptoCurrenciesToFetch.push(notification.crypto);
    }
    if (!currenciesToFetch.includes(notification.currency)) {
      currenciesToFetch.push(notification.currency);
    }
  }

  return { cryptoCurrenciesToFetch, currenciesToFetch };
}