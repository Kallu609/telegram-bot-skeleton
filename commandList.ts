import Command from './commands/Command';
import Crypto from './commands/Crypto';
import Help from './commands/Help';
import * as helper from './helpers/helper';
import * as launcher from './app';

// Tasks before launching the bot
export const startupTasks : Promise<any>[] = [
  helper.fetchCrypto(),
];

// Commands
export const commandList : Command[] = [
  new Command(new Crypto()),
];

// Pushing Help-command last as it needs the list itself
commandList.push(new Command(new Help(commandList)));