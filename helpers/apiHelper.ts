import axios from 'axios';
import { config } from '../config';
import { data, ICryptos, IData } from './database';

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
  return getCryptoList(extraCurrencies).then((currencies : ICryptos) => {
    Array.prototype.push.apply(data.cryptoCurrencies, currencies.cryptoCurrencies);
    Array.prototype.push.apply(data.allCurrencies, currencies.allCurrencies);

    return Promise.resolve('Currencies are now in database');
  }).catch((error) => {
    console.log(error);
  });
}

function getCryptoList (database : string[], currencies : string[] = config.supportedCurrencies, apiUrl : string = config.apiUrl_coinlist) : Promise<any> {
  return axios.get(apiUrl)
  .then((response) => {
    if(!response.data.hasOwnProperty('Data')) {
      throw new Error('Data not acquired');
    }

    return new Promise((resolve, reject) => {
      const listOfCryptos : IData['cryptoCurrencies'] = Object.keys(response.data.Data);

      resolve({
        cryptoCurrencies : Object.keys(response.data.Data),
        allCurrencies : listOfCryptos.concat(currencies),
      });
    });
  })
  .catch((error) => {
    console.log(error);
    
    return Promise.resolve();
  });
}