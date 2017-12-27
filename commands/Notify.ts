import Command from './Command';
import { Notification } from '../helpers/database';

export default class implements Command {
  command: RegExp;
  help: string[];
  usage: string[]; 
  output: string[];

  exec(match: string, chatId: number) {

  }
}