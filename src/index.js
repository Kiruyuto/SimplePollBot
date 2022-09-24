const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const IDs = require('./id');
const emojiDays = require('./emojiOptions');
const mongoose = require('mongoose');
const pollSchema = require('./schemas/poll-schema');
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
  partials: ['CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION', 'USER'],
  rest: { offset: 0 },
  shards: 'auto',
  allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
});

const grupa3ChannelId = '1001601818444431501';
const guildId = '941663059657752616';

client.on('ready', async () => {
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
  await mongoose
    .connect(process.env.MONGO_URI, {
      keepAlive: true,
      dbName: 'Vykas-polls',
    })
    .then(() => console.log(`[${client.user.tag}] - Connected to MongoDB`));

  let pollDb = await pollSchema.findOne({ pollName: 'Vykas' });
  const guild = await client.guilds.fetch(guildId);
  const channel = guild.channels.cache.get(grupa3ChannelId);
  if (pollDb.messageId != 'NONE') {
    const message = await channel.messages.fetch(pollDb.messageId);
  }

  console.log(`[${client.user.tag}] - Connected to Discord`);
});

client.on('messageCreate', async (message) => {
  try {
    if (message.channel.isDMBased()) return;

    if (message.content.toLowerCase() == '!poll') {
      if (message.channel.id != grupa3ChannelId) {
        message.react('👎');
        message.author.send(`Nie możesz tego użyć na tym kanale 🙉\nSpróbuj na: <#${grupa3ChannelId}>`).catch();
        return;
      } else if (message.author.id == IDs.dalgom || message.author.id == client.application.owner.id) {
        let pollDb = await pollSchema.findOne({ pollName: 'Vykas' });

        if (pollDb == null) {
          await message.channel.send('😕 Nie udało się znaleźć TimeStampa w DB. Tworzenie nowego...').then((msg) => {
            setTimeout(() => {
              msg.delete();
            }, 5000);
          });

          await new pollSchema({
            pollName: 'Vykas',
          }).save();

          pollDb = await pollSchema.findOne({ pollName: 'Vykas' });
        }

        let dateDiff = DateTime.fromSeconds(pollDb.lastWednesdayUnix).diffNow('days').toObject().days;

        if (dateDiff <= -6) {
          let staticMembers = '';
          Object.keys(IDs).forEach((key) => {
            staticMembers += `[❓] <@${IDs[key]}>\n`;
          });

          let dayValues = '';
          for (const [k, v] of Object.entries(emojiDays)) {
            dayValues += `${k} - ${v}\n`;
          }

          const pollEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Vykas HardMode 😈')
            .setImage('https://i.imgur.com/cfdsW3C.png')
            .setDescription(
              `<t:${DateTime.fromSeconds(pollDb.lastWednesdayUnix).plus({ weeks: 1 }).toMillis() / 1000}:D> - <t:${
                DateTime.fromSeconds(pollDb.lastWednesdayUnix).plus({ weeks: 1, days: 6 }).toMillis() / 1000
              }:D>`
            )
            .setFooter({ text: `❓ - Brak głosu | ✅ - Głos oddany` })
            .setTimestamp(DateTime.now().toMillis())
            .addFields(
              {
                name: 'Wartości:',
                value: dayValues,
                inline: true,
              },
              {
                name: 'Status głosów:',
                value: staticMembers,
                inline: true,
              }
            );

          await message.channel.send({ embeds: [pollEmbed] }).then(async (msg) => {
            Object.keys(emojiDays).forEach((key) => {
              msg.react(key);
            });

            await pollSchema.findOneAndUpdate(
              { pollName: 'Vykas' },
              {
                messageId: msg.id,
                lastWednesdayUnix: getLastWednesday(),
              }
            );
          });
        } else {
          message.reply(
            `Utworzyć głosowanie będziesz mógł dopiero we Wtorek (<t:${
              DateTime.fromSeconds(pollDb.lastWednesdayUnix).plus({ days: 6 }).toMillis() / 1000
            }:D>)`
          );
        }
      } else {
        await message.author.send('Nie możesz tego użyć 😇\n(Allowed: `Dalgom`, `Kiru`)').catch(e);
      }
    }
  } catch (e) {
    console.log(`Wystąpił błąd: ${e}`);
  }
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  let pollDb = await pollSchema.findOne({ pollName: 'Vykas' });

  if (reaction.message.id == pollDb.messageId) {
    if (emojiDays[reaction.emoji.name] == undefined) return;

    await reaction.message.fetch(reaction.message.id).then((msg) => {
      let votesEmbedValue = msg.embeds[0].fields[1].value;
      let max = {};

      var sorted = msg.reactions.cache.sort((a, b) => b.count - a.count);
      sorted.each((r) => {
        if (r.count >= sorted.first().count) max[r.emoji.name] = r.count;
      });

      let msgStr = `Optymalny termin:\n`;
      for (const [k, v] of Object.entries(max)) {
        msgStr += `\`${emojiDays[k]} - ${v - 1} reakcje\`\n`;
      }

      let staticMembers = '';
      Object.keys(IDs).forEach((key) => {
        staticMembers += `[x] <@${IDs[key]}>\n`;
      });

      votesEmbedValue = votesEmbedValue.replace(`[❓] <@${user.id}>`, `[✅] <@${user.id}>`);

      let embed = msg.embeds[0];
      embed.fields[1] = { name: msg.embeds[0].fields[1].name, value: votesEmbedValue, inline: true };
      msg.edit({ content: msgStr, embeds: [embed] });
    });
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;

  let pollDb = await pollSchema.findOne({ pollName: 'Vykas' });

  if (reaction.message.id == pollDb.messageId) {
    if (emojiDays[reaction.emoji.name] == undefined) return;

    await reaction.message.fetch(reaction.message.id).then((msg) => {
      let votesEmbedValue = msg.embeds[0].fields[1].value;
      let max = {};

      var sorted = msg.reactions.cache.sort((a, b) => b.count - a.count);
      sorted.each((r) => {
        if (r.count >= sorted.first().count) max[r.emoji.name] = r.count;
      });

      let msgStr = `Wyniki:\n`;
      for (const [k, v] of Object.entries(max)) {
        msgStr += `\`${emojiDays[k]} - ${v - 1} reakcje\`\n`;
      }

      let staticMembers = '';
      Object.keys(IDs).forEach((key) => {
        staticMembers += `[x] <@${IDs[key]}>\n`;
      });

      votesEmbedValue = votesEmbedValue.replace(`[✅] <@${user.id}>`, `[❓] <@${user.id}>`);

      let embed = msg.embeds[0];
      embed.fields[1] = { name: msg.embeds[0].fields[1].name, value: votesEmbedValue, inline: true };
      msg.edit({ content: '', embeds: [embed] });
    });
  }
});

function getLastWednesday() {
  let wednesday;
  let now = DateTime.now();
  if (now.weekday == 1 || now.weekday == 2) {
    wednesday = DateTime.fromObject({
      year: now.getFullYear,
      weekNumber: now.weekNumber - 1,
      weekday: 3,
    });
  } else {
    wednesday = DateTime.fromObject({
      year: now.getFullYear,
      weekNumber: now.weekNumber,
      weekday: 3,
    });
  }

  return wednesday.toUnixInteger();
}

client.login(process.env.DC_TOKEN);
