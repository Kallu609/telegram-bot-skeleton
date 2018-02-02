import axios from 'axios';
import * as fs from 'fs';
import * as interval from 'interval-promise';
import * as TelegramBot from 'node-telegram-bot-api';
import { promisify } from 'util';
import { config } from '../config';
import * as apiHelper from '../helpers/api';
import { ICommand, IMsg } from '../helpers/interface';
import { errorHandling, parseArgs } from '../helpers/message';

const notifyConfig = {
  /*
   * Database location
   */
  datafile : './data/notifications.json',
}

/* Notify command functionality */
export default function(bot) : ICommand {
  return {
    regexp: /\/notify[ ]?(.*)$/,
    name: 'notify',
    help: 'Notifies you when cryptocurrency\'s rate is over / under set value',
    usage: '/notify <crypto> <comparator><amount> <currency>\n' +
           '/notify',

    handler: async ({msg, matches}) => {
      const args = parseArgs(matches);
      let message = `Command query not supported.\nRefer to */help* if needed`;

      if(args.length === 0) {
        message = '*Currently notifying when:*\n';

        const data = await getData();
        const chatNotifications = data.notifications[msg.chat.id];
        
        if(chatNotifications) {
          message += chatNotifications.map(n => {
            return n.crypto + ' ' + n.comparator + n.rate + ' ' + n.currency;
          }).join('\n');
        } else {
          message += 'Never\n\nRefer to */help* if needed';
        }
      } else if(args.length === 3) {
        // 1             | 2          | 3              | 4
        // 2 - 5 letters | comparator | 1 - 10 numbers | 2 - 5 letters
        const regex = /^(\w{2,5})([><])(\d{1,10})(\w{2,5})$/gi.exec(args.join(''));

        if(regex) {
          const cryptos = await apiHelper.getCryptos();

          const userId = msg.from.id;
          const crypto = regex[1].toUpperCase();
          const comparator = regex[2];
          const rate = Number(regex[3]);
          const currency = regex[4].toUpperCase();

          if(!cryptos.cryptoCurrencies.includes(crypto)) {
            message = 'Your crypto is not currently supported.';
          } else if(!cryptos.fiatCurrencies.includes(currency)) {
            message = 'Your currency is not currently supported.';
          } else {
            const notification : INotification = { userId, crypto, comparator, rate, currency, };
  
            addNotification(msg.chat.id, notification);
  
            message = `Notification added for **${crypto}**`;
          }
        }
      }

      return bot.sendMessage(msg.chat.id, message, config.messageOptions);
    }
  }
}

interface INotification {
  userId : number;
  crypto : string;
  comparator : string;
  rate : number;
  currency : string;
}

interface INotifyData {
  cryptoCurrencies : string[];
  fiatCurrencies : string[];
  notifications : {
    [key: string]: INotification[];
  };
}

async function getData() : Promise<INotifyData> {
  const readFile = promisify(fs.readFile);
  
  try {
    const data = await readFile(notifyConfig.datafile, 'utf8');
    return JSON.parse(data);
  } catch {
    return {
      cryptoCurrencies : [],
      fiatCurrencies : [],
      notifications : {},
    };
  }
}

async function addNotification(chatId : number, notification? : INotification, notifications? : INotification[]) : Promise<void> {
  const newData : INotifyData = await getData();

  if(newData.hasOwnProperty(chatId)) {
    newData.notifications[chatId].push(notification);
  } else {
    newData.notifications[chatId] = [notification];
  }

  if(!newData.cryptoCurrencies.includes(notification.crypto)) {
    newData.cryptoCurrencies.push(notification.crypto);
  }
  if(!newData.fiatCurrencies.includes(notification.currency)) {
    newData.fiatCurrencies.push(notification.currency);
  }

  fs.writeFile(notifyConfig.datafile, JSON.stringify(newData), err => {
    if(err) {
      errorHandling(err);
    }
  });
}

async function updateNotifications(chatId : string, notifications : INotification[]) {
  const newData : INotifyData = await getData();

  newData.notifications[chatId] = notifications;

  fs.writeFile(notifyConfig.datafile, JSON.stringify(newData), err => {
    if(err) {
      errorHandling(err);
    }
  });
}

async function notify(bot : TelegramBot) {
  const data = await getData();
  const getCryptoValues = await axios.get(apiHelper.buildApiUrl(data.cryptoCurrencies, data.fiatCurrencies));

  for(const chatId of Object.keys(data.notifications)) {
    let hasChanged = false;

    const newData = data.notifications[chatId].filter((notification) => {
      const currentRate : number = getCryptoValues.data[notification.crypto][notification.currency];

      if(
        (notification.comparator === '>' && currentRate > notification.rate) ||
        (notification.comparator === '<' && currentRate < notification.rate)
      ) {
        hasChanged = true;

        bot.sendMessage(
          chatId,

          `*1 ${notification.crypto}* is now ${notification.comparator} *${notification.rate} ${notification.currency}*\n\n` + 
          `*1 ${notification.crypto}:* \`${currentRate} ${notification.currency}\``,

          config.messageOptions,
        );
        return false;
      }
      return true;
    });

    if(hasChanged) {
      updateNotifications(chatId, newData);
    }
  }
}

export function startNotifier(bot : TelegramBot) : Promise<any> {
  return interval(
    async () => {
      await notify(bot)
    },
    10000,
    { stopOnError: false }
  );
}