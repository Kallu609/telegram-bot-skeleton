import { config } from '../config';
import { ICommand } from '../helpers/interface';
import * as messageHelper from '../helpers/message';


export default function(bot) : ICommand {
  return {
    regexp: /\/greet$/,
    name: 'greet',
    help: 'Basic example command for demonstrating purposes',
    usage: '/greet',

    handler: ({msg, matches}) => { // Not necessary to include all parameters
      const args = messageHelper.parseArgs(matches); // You can use messageHelper to parse arguments

      bot.sendMessage(
        msg.chat.id,
        `Wassup ${msg.chat.first_name}!`,
        config.messageOptions // You can pass messageOptions as a parameter
      );
    }
  }
}