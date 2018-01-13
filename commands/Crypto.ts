import axios from 'axios';
import { config } from '../config';
import { buildApiUrl, isNumber } from '../helpers/api';
import { data } from '../helpers/database';
import { ICommand } from '../helpers/interface';
import * as messageHelper from '../helpers/message';

import Help from './Help';

const cryptosToShow = ['BTC', 'ETH', 'BCH'];
const currenciesToShow = ['USD', 'EUR'];

export default function(bot) : ICommand {
  return {
    regexp: /\/crypto[ ]?(.*)$/,
    help: 'Displays various crypto currencies\' exchange rate',
    usage: ['/crypto', '/crypto <currency>', '/crypto <amount> <from> to <to>'].join('\n'),

    handler: ({msg, matches}) => {
      // If cryptocurrencies aren't fetched
      if(data.cryptoCurrencies.length === 0 || data.allCurrencies.length === 0) {
        messageHelper.errorHandling(`Cryptocurrencies aren't fetched! Please visit your apiHelper file`);
        return;
      }

      const args = messageHelper.parseArgs(matches);

      // Example: /c
      let cryptos : string[] = cryptosToShow;
      let toShow : string[] = currenciesToShow;
      let value : string = '1';
      let message : string = '';

      // Example: /c BTC
      if (args.length === 1) {
        const crypto : string = args[0].toUpperCase();

        if (data.cryptoCurrencies.includes(crypto)) {
          cryptos = [crypto];
        } else {
          message = 'Crypto not found or supported';
        }
      } else if (args.length >= 3) {
      // Example: /c 1 btc (to) eur
        const firstArg : string = args[1].toUpperCase();
        const lastArg : string = args[args.length - 1].toUpperCase();

        if (!isNumber(args[0])) {
          message = this.usage;
        } else {
          value = args[0];
        }

        if (!data.allCurrencies.includes(lastArg) || !data.allCurrencies.includes(lastArg)) {
          message = `Crypto(s) not found or supported.\nConsult */help* if needed`;
        }

        cryptos = [firstArg];
        toShow = [lastArg];
      }

      // If no errors
      if(message === '') {
        axios.get(buildApiUrl(cryptos, toShow)).then((response) => {
          bot.sendMessage(msg.chat.id, parseData(response, value), config.messageOptions);
        });
      }
    }
  }
}

function parseData(response, value : string = '1') : string {
  // Data not acquired
  if (!response) {
    return;
  }
  
  return Object.keys(response.data).map(x => {
    return Object.keys(response.data[x]).map(i => {
      const finalValue : number = parseFloat(value) * parseFloat(response.data[x][i]);

      return `*${value} ${x}* to *${i}*: \`${finalValue.toFixed(2)}\``;
    }).join('\n');
  }).join('\n\n');
}
