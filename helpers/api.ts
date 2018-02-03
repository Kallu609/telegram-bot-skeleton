import axios from 'axios';
import * as fs from 'fs';
import * as interval from 'interval-promise';
import * as redis from 'redis';
import { promisify } from 'util';
import { config } from '../config';
import * as messageHelper from './message';

const apiConfig = {
  /*
  * Api URL:s
  *  Changing these values might require reworking the code
  */

  apiUrlPrice : 'https://min-api.cryptocompare.com/data/pricemulti',
  apiUrlCoinlist : 'https://min-api.cryptocompare.com/data/all/coinlist',

  /*
  * Supported Fiat-currencies
  */
  supportedCurrencies : ['USD', 'EUR', 'GBP'],

  /*
  * Currency data file
  */
  redisDatakey : 'api',
};

const client = redis.createClient(process.env.REDIS_URL);

export function buildApiUrl (fromCurrency : string[], toCurrency : string[]) : string {
  return `${apiConfig.apiUrlPrice}?fsyms=${fromCurrency.join(',')}&tsyms=${toCurrency.join(',')}`;
}

export function fetchCrypto() : Promise<any> {
  return interval(
    fetchCryptoes,
    10000,
    { iterations: 10, stopOnError: false}
  );
}

interface ICryptos {
  cryptoCurrencies : string[],
  fiatCurrencies : string[],
}

export async function getCryptos() : Promise<ICryptos> {
  const get = promisify(client.get).bind(client);
  
  const cryptos : ICryptos = {
    cryptoCurrencies : [],
    fiatCurrencies : [],
  };

  try {
    const data : string = await get(apiConfig.redisDatakey);
    cryptos.cryptoCurrencies = JSON.parse(data).cryptoCurrencies;
    cryptos.fiatCurrencies = apiConfig.supportedCurrencies;
  } catch {
    messageHelper.errorHandling('Cryptoes not acquired');
  }

  return cryptos;
}

function fetchCryptoes(iterationNumber : number, stop : () => void) : Promise<any> {
  return axios.get(apiConfig.apiUrlCoinlist)
  .then(response => {
    if(!response.data.hasOwnProperty('Data')) {
      throw new Error('Data not acquired');
    }

    const listOfCryptos : ICryptos['cryptoCurrencies'] = Object.keys(response.data.Data);

    writeCryptoes(listOfCryptos);

    if(listOfCryptos.length > 0) {
      messageHelper.errorHandling(`${listOfCryptos.length} currencies fetched successfully`);

      stop();
    }
  })
  .catch(error => {
    messageHelper.errorHandling(`Currencies couldn't be fetched! Try #${iterationNumber}`);
  });
}

function writeCryptoes(cryptoCurrencies : ICryptos['cryptoCurrencies']) {
  const data = {
    cryptoCurrencies,
  };

  try {
    client.set(apiConfig.redisDatakey, JSON.stringify(data));
  } catch {
    messageHelper.errorHandling(apiConfig.redisDatakey + ' could not be written');
  }
}

export function isNumber(num : any) : boolean {
  return !Number.isNaN(num);
}