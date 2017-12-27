/*
 * Datatypes
 */
export type Data = {
  notifications : Notification[];
  cryptoCurrencies : string[];
  allCurrencies : string[];
};

export type Notification = {
  chatId : number;
  crypto : string;
  comparator : string;
  rate : number;
  currency : string;
};

export type Cryptos = {
  cryptoCurrencies : Data['cryptoCurrencies'];
  allCurrencies : Data['allCurrencies'];
};

/*
 * Database
 */
const notificationsVar : Data['notifications'] = [];
const cryptoCurrenciesVar : Data['cryptoCurrencies'] = [];
const allCurrenciesVar : Data['allCurrencies'] = [];

export const data : Data = {
  notifications : notificationsVar,
  cryptoCurrencies : cryptoCurrenciesVar,
  allCurrencies : allCurrenciesVar,
};