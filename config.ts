import { IConfig } from './helpers/interfaces';
/*
 * For commands,
 * refer to commandList.ts
 */

export const config : IConfig = {
/*
 * Telegram bot token
 *  Can be acquired from BotFather
 */
  telegramToken : '',

/*
 * Api URL:s
 *  Changing these values might require reworking the code
 */
  apiUrl_price : 'https://min-api.cryptocompare.com/data/pricemulti',
  apiUrl_coinlist : 'https://min-api.cryptocompare.com/data/all/coinlist',

/*
 * Message options
 *  https://core.telegram.org/bots/api#sendmessage
 */
  messageOptions : {
    'parse_mode': 'Markdown',
  },

/*
 * Supported Fiat-currencies
 */
  supportedCurrencies : ['USD', 'EUR', 'GBP'],
};