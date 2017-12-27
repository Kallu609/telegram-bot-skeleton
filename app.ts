import * as TelegramBot from "node-telegram-bot-api";
import * as commandList from "./commandList";
import { config } from "./config";

// Startup
Promise.all(commandList.startupTasks).then(values => {
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
for (const command of commandList.commandList) {
  // Create listeners for commands
  bot.onText(command, (msg, matches) => {
    const match : string = matches[1];
    const chatId : number = msg.chat.id;

    // Execute the command
    command.exec(match, chatId);

    // Send return message if there is something to send
    if(command.output.length > 0) {
      bot.sendMessage(
          chatId,
          command.joinOutput(),
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
  