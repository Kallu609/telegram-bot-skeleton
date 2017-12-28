export interface IMsg {
  message_id: number;
  from?: {
    id?: number;
    is_bot?: boolean;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  chat?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    type?: string;
  };
  date?: number;
  text?: string;
  entities?: [{offset?: number, length?: number, type?: string }];
};

export interface IMatches {
  message: string;
  match: string;
  index: number;
  input: string;
};

export type IMatchesList = [IMatches];

/* IOutput */
export interface IOutput {
  regexp: RegExp;
  help: string;
  usage: string;
  output: string;
};

export interface ICommand {
  regexp: RegExp;
  help: string;
  usage: string;

  handler: (data: {msg: IMsg, matches: any[]}) => void;
}