import Command from './Command';

export default class implements Command {
  command = /\/help$/;
  help = ["Displays a list of all available commands."];
  usage = ["/help\n/help <command>"];
  output = ['*The following commands are available:*', ''];

  constructor(commands : Command[]) {
    for (const c of commands) {
      this.output.push(`${c.joinUsage()} - ${c.joinHelp()}`);
    }
  }

  exec() { }
}