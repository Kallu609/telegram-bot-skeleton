import * as TelegramBot from "node-telegram-bot-api";
import * as commands from "./commands";
import { config } from "./config";
import { IMatchesList, IMsg, IOutput } from "./helpers/interfaces";

// Startup
Promise.all(commands.startupTasks).then(values => {
  console.log(`promise: [${values}]`);
}).catch(error => {
  console.log(error);
});

console.log('Initializing the bot');

// Bot
const bot : TelegramBot = new TelegramBot(
  config.telegramToken,
  { polling: true }
);

// Iterate through commands
for (const command of commands.commandList) {
  const initialCommandData = command();

  // Create listeners for commands
  bot.onText(command.regexp, (msg, matches) => {
    const match : string = matches[1];
    const chatId : number = msg.chat.id;

    const IMessage : IMsg = msg;
    const IMatches : IMatchesList = matches as IMatchesList;

    // Execute the command
    command(msg, matches);

    // Send return message if there is something to send
    if(command.output.length > 0) {
      console.log(msg);
      console.log(matches);

      bot.sendMessage(
          chatId,
          command.output,
          config.messageOptions
      )
      .catch(errorHandling);
    }
  });
}

// Error handling
bot.on('polling_error', errorHandling);
bot.on('webhook_error', errorHandling);

function errorHandling(error) {
  console.log(error);  
}
  