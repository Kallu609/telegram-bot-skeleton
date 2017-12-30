import { getCommands } from '../command';
import { config } from '../config';
import { ICommand } from '../helpers/interface';
import * as messageHelper from '../helpers/message';

export default function(bot) : ICommand {
  return {
    regexp: /\/help$/,
    help: 'Displays a list of all available commands.',
    usage: '/help\n/help <command>',

    handler: ({msg, matches}, cmd? : string) => {
      let message = '*The following commands are available:*\n';
      
      for (const command of getCommands(bot)) {
        message += (`${command.usage}\n_${command.help}_\n\n`);
      }

      bot.sendMessage(msg.chat.id, message, config.messageOptions);
    }
  }
}