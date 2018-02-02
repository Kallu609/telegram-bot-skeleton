import * as fs from 'fs';
import * as interval from 'interval-promise';
import * as moment from 'moment';
import * as TelegramBot from 'node-telegram-bot-api';
import * as parse from 'parse-duration';
import { promisify } from 'util';
import { config } from '../config';
import { ICommand, IMsg } from '../helpers/interface';
import * as messageHelper from '../helpers/message';

const datafile = './data/reminder.json';

export default function(bot) : ICommand {
  return {
    regexp: /[\/]?remind (.+)$/,
    name: 'remind',
    help: 'Quote the message you want to be reminded of',
    usage: 'remind [duration]',

    handler: ({msg, matches}) => { // Not necessary to include all parameters
      const args = messageHelper.parseArgs(matches); // You can use messageHelper to parse arguments

      bot.sendMessage(
        msg.chat.id,
        addReminder(msg, matches),
        config.messageOptions // You can pass messageOptions as a parameter
      );
    }
  }
}

function addReminder(msg : IMsg, matches) : string {
  const args = messageHelper.parseArgs(matches);
  const duration = parse(args.join(' '));

  if(duration <= 0) {
    return 'Duration was not valid';
  }

  if(!msg.hasOwnProperty('reply_to_message')) {
    return 'Please quote the message you want to get reminded of';
  }

  const targetMs = moment().valueOf() + duration;
  addReminders(msg, targetMs);

  const currentTime = moment(targetMs).format('YYYY/MM/DD, HH:mm:ss');
  return 'Reminding you at **' + currentTime + '**!';
}

interface IReminderData {
  chatId : number,
  userId : number,
  userName : string,
  replyMessageId : number,
  targetMs : number,
}

function addReminders(msg : IMsg, targetMs : number) : Promise<void> {
  return getReminders().then(data => {
    const newdata = data;

    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.first_name;
    const replyMessageId = msg.reply_to_message.message_id;
    newdata.push({
      chatId,
      userId,
      userName,
      replyMessageId,
      targetMs,
    });

    fs.writeFile(datafile, JSON.stringify(newdata), (err) => {
      if(err) {
        messageHelper.errorHandling(datafile + ' could not be written');
      }
    });
  });
}

function removeReminders(time : number) {
  return getReminders().then(data => {
    const newdata = data.filter(reminder => {
      return reminder.targetMs > time;
    });

    fs.writeFile(datafile, JSON.stringify(newdata), (err) => {
      if(err) {
        messageHelper.errorHandling(datafile + ' could not be written');
      }
    });
  });
}

async function getReminders() : Promise<IReminderData[]> {
  const readFile = promisify(fs.readFile);

  try {
    const data = await readFile(datafile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function remind(bot : TelegramBot) {
  getReminders().then(data => {
    const currentTime = moment().valueOf();

    for(const reminder of data) {
      if(reminder.targetMs <= currentTime) {
        bot.sendMessage(
          reminder.chatId,
          `[@${reminder.userName}](tg://user?id=${reminder.userId}), here's your reminder!`,
          { reply_to_message_id : reminder.replyMessageId, ...config.messageOptions },
        );
      }
    }

    removeReminders(currentTime);
  });
}

export function startReminder(bot : TelegramBot) : Promise<any> {
  return interval(
    async () => {
      await remind(bot);
    },
    10000,
    { stopOnError: false }
  );
}