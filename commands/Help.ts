import { getCommands } from '../command';
import { config } from '../config';
import { ICommand } from '../helpers/interface';
import * as messageHelper from '../helpers/message';

export default function(bot) : ICommand {
  return {
    regexp: /\/help[ ]?(.*)$/,
    name: 'help',
    help: 'Displays a list of all available commands.',
    usage: ['/help', '/help <command>'].join('\n'),

    handler: ({msg, matches}) => {
      const args = messageHelper.parseArgs(matches);
      let message = '';

      if (args.length === 0) {
        message = '*The following commands are available:*\n';

        for (const command of getCommands(bot)) {
          message += (`${command.usage}\n_${command.help}_\n\n`);
        }
      }

      if (args.length === 1) {
        const command = getCommands(bot).find(cmd => cmd.name === args[0]);

        if (command) {
          message += (`${command.usage}\n_${command.help}_`);
        } else {
          message += 'Command not found.\nPlease refer to /help';
        }
      }

      bot.sendMessage(msg.chat.id, message, config.messageOptions);
    }
  }
}