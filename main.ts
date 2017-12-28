import * as TelegramBot from 'node-telegram-bot-api';
import { getCommands, getStartupTasks } from './command';
import { config } from './config';
import { IMatchesList, IMsg, IOutput } from './helpers/interface';

// Startup
Promise.all(getStartupTasks())
.catch(error => {
  console.log(config.consoleStyle, error);
});

console.log(config.consoleStyle, 'Initializing the bot');

// Bot
const bot : TelegramBot = new TelegramBot(
  config.telegramToken,
  { polling: true }
);

// Iterate through commands
for (const command of getCommands(bot)) {
  // Create listeners for commands
  bot.onText(command.regexp, (msg : IMsg, matches : any[]) => {
    command.handler({msg, matches});
  });
}

// Error handling
bot.on('polling_error', errorHandling);
bot.on('webhook_error', errorHandling);

function errorHandling(error) {
  console.log(config.consoleStyle, error);  
}
  