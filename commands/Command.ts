export default class Command {
  public command : RegExp;
  public help : string[];
  public usage : string[];
  public output : string[];
  public self? : Command;

  constructor(cmd? : Command) {
    if(cmd) {
      this.self = cmd;
      this.command = cmd.command;
      this.help = cmd.help;
      this.usage = cmd.usage;
      this.output = cmd.output;
    }
  }

  public exec?(match : string, chatId : number) : void {
    if(typeof this.self.exec === "function") {
      return this.self.exec(match, chatId);
    }
  }

  public joinHelp?() : string { return this.help.join('\n'); }
  public joinUsage?() : string { return this.usage.join('\n'); }
  public joinOutput?() : string { return this.output.join('\n'); }
}