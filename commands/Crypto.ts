import axios from 'axios';
import { config } from '../config';
import * as apiHelper from '../helpers/api';
import { ICommand } from '../helpers/interface';
import * as messageHelper from '../helpers/message';
import Help from './Help';

const cryptoConfig = {
  /*
  * Crypto currencies to show as defaults
  */
  cryptosToShow : ['BTC', 'ETH', 'BCH'],
  /*
  * Fiat currencies to show as defaults
  */
  currenciesToShow : ['USD', 'EUR'],
};

export default function(bot) : ICommand {
  return {
    regexp: /\/crypto[ ]?(.*)$/,
    name: 'crypto',
    help: 'Displays various crypto currencies\' exchange rate',
    usage: ['/crypto', '/crypto <currency>', '/crypto <amount> <from> to <to>'].join('\n'),

    handler: async ({msg, matches}) => {
      const data = await apiHelper.getCryptos();

      if(data.cryptoCurrencies.length === 0) {
        messageHelper.errorHandling(`Cryptocurrencies aren't fetched! Please visit your apiHelper file`);
        return;
      }

      const args = messageHelper.parseArgs(matches);

      // Example: /c
      let cryptos : string[] = cryptoConfig.cryptosToShow;
      let toShow : string[] = cryptoConfig.currenciesToShow;
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

        if (!apiHelper.isNumber(args[0])) {
          message = this.usage;
        } else {
          value = args[0];
        }

        const allCurrencies = [...data.cryptoCurrencies, ...data.fiatCurrencies];
        if (!allCurrencies.includes(firstArg) || !allCurrencies.includes(lastArg)) {
          message = `Crypto(s) not found or supported.\nConsult */help* if needed`;
        }

        cryptos = [firstArg];
        toShow = [lastArg];
      }

      if(message === '') {
        axios.get(apiHelper.buildApiUrl(cryptos, toShow)).then((response) => {
          bot.sendMessage(msg.chat.id, parseData(response, value), config.messageOptions);
        });
      } else {
        bot.sendMessage(msg.chat.id, message, config.messageOptions);
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
