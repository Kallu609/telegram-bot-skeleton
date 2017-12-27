import * as launcher from './app';
import Command from './commands/Command';
import Crypto from './commands/Crypto';
import Help from './commands/Help';
import * as apiHelper from './helpers/apiHelper';

// Tasks before launching the bot
export const startupTasks : Array<Promise<any>> = [
  apiHelper.fetchCrypto(),
];

// Commands
export const commandList : Command[] = [
  new Command(new Crypto()),
];

// Pushing Help-command last as it needs the list itself
commandList.push(new Command(new Help(commandList)));