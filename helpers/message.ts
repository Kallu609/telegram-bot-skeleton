export function parseArgs(matches : any[]) : string[] {
  if(matches && matches[1]) {
    const argsVar : string = matches[1];
    return argsVar.split(' ');
  }
  
  const array : string[] = [];
  return array;
}