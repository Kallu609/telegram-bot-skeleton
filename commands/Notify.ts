import { INotification } from '../helpers/database';
import Command from './Command';

export default class implements Command {
  public command: RegExp;
  public help: string[];
  public usage: string[]; 
  public output: string[];

  public exec(match: string, chatId: number) {
    //
  }
}