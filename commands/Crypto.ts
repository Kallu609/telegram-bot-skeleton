import { IMatchesList, IMsg, IOutput } from '../helpers/interfaces';

export default function(message? : IMsg, matches? : IMatchesList) : IOutput {
  const io : IOutput = {
    regexp: /\/crypto(.*)$/,
    help: 'Displays various crypto currencies\' exchange rate',
    usage: ['/crypto', '/crypto <currency>', '/crypto <amount> <from> to <to>'].join('\n'),
    output: '',
  };

  return io;
}