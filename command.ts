import * as TelegramBot from 'node-telegram-bot-api';
import * as apiHelper from './helpers/api';
import { ICommand } from './helpers/interface';

import Greeter from './commands/Greeter';
import Help from './commands/Help';

// Commands
export function getCommands(bot : TelegramBot) : ICommand[] {
  return [
    Help(bot),
    Greeter(bot),
  ]
}

// Promises executed while starting the bot
export function getStartupTasks(bot : TelegramBot) : Array<Promise<any>> {
  return []; // No startup tasks
}