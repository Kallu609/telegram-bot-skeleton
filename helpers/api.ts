import axios from 'axios';
import * as interval from 'interval-promise';
import { config } from '../config';
import { data, ICryptos, IData } from './database';
import { errorHandling } from './message';

const apiConfig = {
  /*
  * Api URL:s
  *  Changing these values might require reworking the code
  */

  apiUrl_price : 'https://min-api.cryptocompare.com/data/pricemulti',
  apiUrl_coinlist : 'https://min-api.cryptocompare.com/data/all/coinlist',

  /*
  * Supported Fiat-currencies
  */
  supportedCurrencies : ['USD', 'EUR', 'GBP'],
};

/*
 * Builds API url
 * Supports arrays and strings as parameters
 */
export function buildApiUrl (fromCurrency : string[] | string, toCurrency : string[] | string) : string {
  const fromString : string = [].concat(fromCurrency).join(',');
  const toString : string = [].concat(toCurrency).join(',');

  return `${apiConfig.apiUrl_price}?fsyms=${fromString}&tsyms=${toString}`;
}

/*
 * Returns all available cryptos from API
 */

export function fetchCrypto() : Promise<any> {
  return interval(
    fetchCryptoes,
    10000,
    { iterations: 10, stopOnError: false}
  );
}

function fetchCryptoes(iterationNumber : number, stop : () => void) : Promise<any> {
  return axios.get(apiConfig.apiUrl_coinlist)
  .then(response => {
    if(!response.data.hasOwnProperty('Data')) {
      throw new Error('Data not acquired');
    }

    const listOfCryptos : IData['cryptoCurrencies'] = Object.keys(response.data.Data);

    Array.prototype.push.apply(data.cryptoCurrencies, Object.keys(response.data.Data));
    Array.prototype.push.apply(data.allCurrencies, listOfCryptos.concat(apiConfig.supportedCurrencies));

    if(data.allCurrencies.length > 0) {
      errorHandling(`${data.allCurrencies.length} currencies fetched successfully`);

      stop();
    }
  })
  .catch(error => {
    errorHandling(`Currencies couldn't be fetched! Try #${iterationNumber}`);
  });
}

export function isNumber(num : any) : boolean {
  return !Number.isNaN(num);
}