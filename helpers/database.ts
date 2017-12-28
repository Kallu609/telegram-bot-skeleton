import * as fs from 'file-system';

/*
 * Datatypes
 */
export interface IData {
  notifications : INotification[];
  cryptoCurrencies : string[];
  allCurrencies : string[];
}

export interface INotification {
  chatId : number;
  userId : number;
  crypto : string;
  comparator : string;
  rate : number;
  currency : string;
}

export interface ICryptos {
  cryptoCurrencies : IData['cryptoCurrencies'];
  allCurrencies : IData['allCurrencies'];
}

/*
 * Database
 */
const notificationsVar : IData['notifications'] = [];
const cryptoCurrenciesVar : IData['cryptoCurrencies'] = [];
const allCurrenciesVar : IData['allCurrencies'] = [];

export const data : IData = {
  notifications : notificationsVar,
  cryptoCurrencies : cryptoCurrenciesVar,
  allCurrencies : allCurrenciesVar,
};

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
 */
declare global {
  // tslint:disable-next-line:interface-name
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

export function writeData() : Promise<any> {
  return new Promise((resolve, reject) => {
    const jsondata : string = JSON.stringify(data.notifications);

    fs.writeFile("./data/notifications.json", jsondata, (err) => {
      if(err) {
        reject(err);
      }

      resolve("The file was saved!");
    });
  }).catch(error => {
    console.log(error);
  });
}