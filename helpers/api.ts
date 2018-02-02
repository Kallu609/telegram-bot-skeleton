import axios from 'axios';
import * as fs from 'fs';
import * as interval from 'interval-promise';
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
  dataFile : './data/api.json',
};

/*
 * Builds API url
 * Supports arrays and strings as parameters
 */
export function buildApiUrl (fromCurrency : string[], toCurrency : string[]) : string {
  return `${apiConfig.apiUrlPrice}?fsyms=${fromCurrency.join(',')}&tsyms=${toCurrency.join(',')}`;
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

interface ICryptos {
  cryptoCurrencies : string[],
  fiatCurrencies : string[],
}

export async function getCryptos() : Promise<ICryptos> {
  const readFile = promisify(fs.readFile);
  const cryptos : ICryptos = {
    cryptoCurrencies : [],
    fiatCurrencies : [],
  };

  try {
    const data = await readFile(apiConfig.dataFile, 'utf8');
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

  fs.writeFile(apiConfig.dataFile, JSON.stringify(data), (err) => {
    if(err) {
      messageHelper.errorHandling(apiConfig.dataFile + ' could not be written');
    }
  });
}

export function isNumber(num : any) : boolean {
  return !Number.isNaN(num);
}