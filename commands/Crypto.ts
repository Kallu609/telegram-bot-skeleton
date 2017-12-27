import Command from './Command';

export default class implements Command {
  command = /\/crypto(.+)?$/;
  help = ['Displays various crypto currencies\' exchange rate'];
  usage = ['/crypto\n/crypto <currency>\n/crypto <amount> <from> to <to>'];
  output = [];

  exec(match: string, chatId: number) {
    this.output.push(match);
    this.output.push(this.help);
    this.output.push(this.usage);
  }
}