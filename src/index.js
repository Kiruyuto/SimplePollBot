const {
  Client,
  GatewayIntentBits,
  ActivityType,
  EmbedBuilder,
} = require('discord.js');
const dt = require('date-fns');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: ['CHANNEL'],
  restTimeOffset: 0,
});

client.on('ready', async () => {
  console.log(`[${client.user.tag}] - Loaded`);
  client.user.setPresence({
    activities: [
      {
        name: 'Vykas enjoyer',
        type: ActivityType.Streaming,
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    ],
  });
  client.application.fetch();
});

const dalgomId = '212328101999411201';
const grupa3ChannelId = '1001601818444431501';
let latestPoolId = '';

let now = new Date();
let daysAfterLastThursday = -7 + 3 - now.getDay();
let lastWednsday = new Date(
  now.getTime() + daysAfterLastThursday * 24 * 60 * 60 * 1000
);
let nextday = new Date(
  lastWednsday.getFullYear(),
  lastWednsday.getMonth(),
  lastWednsday.getDate() + 6
);

client.on('messageCreate', async (message) => {
  if (message.channel.isDMBased()) return;
  try {
    if (message.content == '!poll') {
      if (message.channel.id != grupa3ChannelId) {
        message.author
          .send(
            'Nie możesz tego użyć na tym kanale 🙉\nSpróbuj na: <#1001601818444431501>'
          )
          .catch((e) => {
            console.log(`Error: ${e.message}`);
          });
        return;
      } else if (
        message.author.id == dalgomId ||
        message.author.id == client.application.owner.id
      ) {
        let msgTimestamp = Date.now();
        if (dt.getUnixTime(msgTimestamp) >= dt.getUnixTime(nextday)) {
          const pollEmbed = new EmbedBuilder();
          pollEmbed.addFields({
            name: 'Wartości',
            value:
              '1️⃣ - Środa (Reset)\n2️⃣ - Czwartek\n3️⃣ - Piątek\n4️⃣ - Sobota\n5️⃣ - Niedziela\n6️⃣ - Poniedziałek\n7️⃣ - Wtorek (Last day)\n<a:Fill:1018928990616027156> - Bez znaczenia ',
          });

          pollEmbed.setColor('#ff0000');
          pollEmbed.setTitle('Vykas HardMode');

          pollEmbed.setDescription(
            `<t:${dt.getUnixTime(lastWednsday)}:D> - <t:${dt.getUnixTime(
              nextday
            )}:D>`
          );

          await message.channel
            .send({ embeds: [pollEmbed] })
            .then(async (msg) => {
              await msg.react('1️⃣');
              await msg.react('2️⃣');
              await msg.react('3️⃣');
              await msg.react('4️⃣');
              await msg.react('5️⃣');
              await msg.react('6️⃣');
              await msg.react('7️⃣');
              await msg.react('<a:Fill:1018928990616027156>');
              latestPoolId = msg.id;
            });
        } else {
          message.reply(
            `Po co robić kolejną ankiete? 🤔\nUtworzyć nową będziesz mógł dopiero we Wtorek.. (<t:${dt.getUnixTime(
              nextday
            )}:R>)`
          );
        }
      } else {
        await message.author.send('Nie możesz tego użyć 😇').catch((e) => {
          console.log(`Error: ${e.message}`);
        });
      }
    }
  } catch (e) {
    console.log(`Wystąpił błąd: ${e}`);
  }
});

client.login(process.env.DC_TOKEN);
