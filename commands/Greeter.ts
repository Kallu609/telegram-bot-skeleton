import { IMatchesList, IMsg, IOutput } from '../helpers/interfaces';

export default function(message? : IMsg, matches? : IMatchesList) : IOutput {
  const io : IOutput = {
    regexp: /\/greet$/,
    help: 'Just say /greet',
    usage: 'Just say /greet',
    output: 'Hello',
  };

  if(message.from.first_name !== undefined) {
    io.output += message.from.first_name;
  }

  return io;
}

