import { config } from "../config";

export function parseArgs(matches : any[]) : string[] {
  if(matches && matches[1]) {
    const argsVar : string = matches[1];
    return argsVar.split(' ');
  }
  
  const array : string[] = [];
  return array;
}

export function errorHandling(error) : void {
  console.log(config.consoleStyle, error);
}
  