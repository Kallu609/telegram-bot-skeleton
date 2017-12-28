
import * as apiHelper from './helpers/apiHelper';
import { IMatchesList, IMsg, IOutput } from './helpers/interfaces';

import Crypto from './commands/Crypto';
import Greeter from './commands/Greeter';
import Help from './commands/Help';
import Notify from './commands/Notify';

// Commands
export const commandList : Array<(message?: IMsg, matches?: IMatchesList) => IOutput> = [
  Greeter,
  Notify,
  Crypto,
  Help,
];

// Tasks before launching the bot
export const startupTasks : Array<Promise<any>> = [
  apiHelper.fetchCrypto(),
];