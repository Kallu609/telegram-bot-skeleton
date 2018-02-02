import * as TelegramBot from 'node-telegram-bot-api';
import { getCommands, getStartupTasks } from './command';
import { config } from './config';
import { IMsg, IOutput } from './helpers/interface';
import { errorHandling } from './helpers/message';

errorHandling('Initializing the bot');

// Bot
const bot : TelegramBot = new TelegramBot(
  config.telegramToken,
  { polling: true }
);

// Startup
Promise.all(getStartupTasks(bot)).then(() => {
  errorHandling('Bot initialized');
})
.catch(errorHandling);

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