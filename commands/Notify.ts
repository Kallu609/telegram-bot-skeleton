import { ICommand } from '../helpers/interface';

export default function(bot) : ICommand {
  return {
    regexp: /\/notify$/,
    help: 'needs to be implemented',
    usage: '/notify',

    handler: ({msg}) => {
      bot.sendMessage(msg.chat.id, 'Wassup!');
    }
  }
}