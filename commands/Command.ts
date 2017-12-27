/*
* Implementation:
*/

/*
import Command from './Command';

export default class implements Command {
  // Set with these
  command: RegExp;
  help: string[]; // List to support multi-line outputs
  usage: string[]; 
  output: string[];

  // Get with these
  exec(match: string, chatId: number) { }
}
*/

export default class Command {
  command : RegExp;
  help : string[];
  usage : string[];
  output : string[];

  constructor(cmd : Command = undefined) {
    if(cmd !== undefined) {
      this.self = cmd;
      this.command = cmd.command;
      this.help = cmd.help;
      this.usage = cmd.usage;
      this.output = cmd.output;
    }
  }

  exec(match : string, chatId : number) : void {
    return this.self.exec(match, chatId);
  }

  self? : Command;
  joinHelp?() : string { return this.help.join('\n'); }
  joinUsage?() : string { return this.usage.join('\n'); }
  joinOutput?() : string { return this.output.join('\n'); }
}