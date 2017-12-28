import * as TelegramBot from 'node-telegram-bot-api';
import * as apiHelper from './helpers/api';
import { ICommand } from './helpers/interface';

import Crypto from './commands/Crypto';
import Greeter from './commands/Greeter';
import Help from './commands/Help';
import Notify from './commands/Notify';

// Commands
export function getCommands(bot : TelegramBot) : ICommand[] {
  return [
    Greeter(bot),
    Notify(bot),
    Crypto(bot),
    Help(bot),
  ]
}

// Promises executed while starting the bot
export function getStartupTasks() : Array<Promise<any>> {
  return [
    apiHelper.fetchCrypto(),
  ];
}