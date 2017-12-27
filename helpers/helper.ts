import axios from 'axios';
import { config } from '../config';
import { data, Data, Cryptos } from './database';

/*
 * Builds API url
 * Supports arrays and strings as parameters
 */
export function buildApiUrl (fromCurrency : string[] | string, toCurrency : string[] | string) : string {
  const fromString : string = [].concat(fromCurrency).join(',');
  const toString : string = [].concat(toCurrency).join(',');

  return `${config.apiUrl_price}?fsyms=${fromString}&tsyms=${toString}`;
}

/*
 * Returns all available cryptos from API
 */

export function fetchCrypto(extraCurrencies : string[] = config.supportedCurrencies) : Promise<any> {
  return getCryptoList(extraCurrencies).then((currencies : Cryptos) => {
    Array.prototype.push.apply(data.cryptoCurrencies, currencies.cryptoCurrencies);
    Array.prototype.push.apply(data.allCurrencies, currencies.allCurrencies);
  }).catch((error) => {
    console.log(error);
  });
}

function getCryptoList (database : string[], currencies : string[] = config.supportedCurrencies, apiUrl : string = config.apiUrl_coinlist) : Promise<any> {
  return axios.get(apiUrl)
  .then((response) => {
    if(!response.data.hasOwnProperty('Data')) {
      throw 'Data not acquired';
    }

    return new Promise((resolve, reject) => {
      const listOfCryptos : Data['cryptoCurrencies'] = Object.keys(response.data.Data);

      resolve({
        cryptoCurrencies : Object.keys(response.data.Data),
        allCurrencies : listOfCryptos.concat(currencies),
      });
    });
  })
  .catch((error) => {
    console.log(error);
    
    return Promise.resolve();
    // TODO: Try again in a while
  });
}

/*
 * * Handlers for database
 * 
 * These change the original array, not just copy it!
 *
 * Array.prototype.push.apply(data.notifications, Notification[])
 * data.notifications.push(Notification) 
 * data.notifications.remove('chatId', number)
 
 * Array.prototype.push.apply(data.allcurrencies, string[])
 * data.allcurrencies.push(string)
 * data.allcurrencies.remove(string)
 * 
 */
declare global {
  interface Array<T> {
    remove(key : any, value? : any) : number;
  }
}
Array.prototype.remove = function (key : any, value : any = undefined) : number {
  const i : number =
    (value === undefined)
    ? this.findIndex(chr => chr === key)
    : this.findIndex(obj => obj[key] === value);

  if (i >= 0) { this.splice(i, 1); }

  return this.length;
};