import { config } from '../config';
import { ICommand, IMsg } from '../helpers/interface';
import * as messageHelper from '../helpers/message';


export default function(bot) : ICommand {
  return {
    regexp: /remind$/,
    name: 'greet',
    help: 'Basic example command for demonstrating purposes',
    usage: 'remind',

    handler: ({msg, matches}) => { // Not necessary to include all parameters
      const args = messageHelper.parseArgs(matches); // You can use messageHelper to parse arguments

      bot.sendMessage(
        msg.chat.id,
        addReminder(msg),
        config.messageOptions // You can pass messageOptions as a parameter
      );
      console.log(msg);
    }
  }
}

function addReminder(msg : IMsg) : string {
  return '';
}