import { commandList } from '../commands';
import { IMatchesList, IMsg, IOutput } from '../helpers/interfaces';

export default function(message? : IMsg, matches? : IMatchesList) : IOutput {
  const io : IOutput = {
    regexp: /\/help$/,
    help: 'Displays a list of all available commands.',
    usage: '/help\n/help <command>',
    output: '*The following commands are available:*\n',
  };

  for (const command of commandList) {
    io.output += (`${command.usage} - ${command.help}\n`);
  }

  return io;
}