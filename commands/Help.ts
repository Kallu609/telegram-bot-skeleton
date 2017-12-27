import Command from './Command';

export default class implements Command {
  public command = /\/help$/;
  public help = ["Displays a list of all available commands."];
  public usage = ["/help\n/help <command>"];
  public output = ['*The following commands are available:*', ''];

  constructor(commands : Command[]) {
    for (const c of commands) {
      this.output.push(`${c.joinUsage()} - ${c.joinHelp()}`);
    }
  }
}

