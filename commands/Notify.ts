import { IMatchesList, IMsg, IOutput } from '../helpers/interfaces';

export default function Notify(message? : IMsg, matches? : IMatchesList) : IOutput {
  const io = {
    regexp: /\/notify$/,
    help: 'Notifys',
    usage: 'Yes',
    output: 'Hello',
  };

  if(message.from.first_name !== undefined) {
    io.output += message.from.first_name;
  }

  return io;
}