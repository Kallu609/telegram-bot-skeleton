import { data } from '../helpers/database';
import Command from './Command';

export default class implements Command {
  public command = /\/crypto(.+)?$/;
  public help = ['Displays various crypto currencies\' exchange rate'];
  public usage = ['/crypto', '/crypto <currency>', '/crypto <amount> <from> to <to>'];
  public output = [];

  public exec(match: string, chatId: number) {
    console.log(data.allCurrencies.length);
  }
}