# Telegram Bot Skeleton

Easily expandable and modifiable Typescript Telegram bot. Works on top of [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api).

Forked from https://github.com/naftis/tuplabotti

## Prerequisites

* Node.js
* `ts-node`

## Installation and usage

1. Clone the repository
2. Rename `config-example.ts` to `config.ts` and add in your bot token.
3. `npm install`
4. `ts-node main`

## Developing

### Adding commands

Commands are supposed to be added to `./commands/` as *.ts* files. You can use `Greeter.ts` as an example of a ICommand function.

When you have finished creating your command, you can add it to `./command.ts` to `getCommand()` function, which returns a list that Tuplabotti iterates through when starting to listen for messages.

### Adding startup tasks

Append the list in `./command.ts`'s `getStartupTasks()` with your function which returns a `Promise`.
