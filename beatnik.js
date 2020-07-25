const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json')
const token = config.token;
const guildId = config.guild;

let currentBeats = 0;

const getBeatTime = () => {
  const dt = new Date();
  const beats = (((dt.getUTCHours() + 1) % 24) + dt.getUTCMinutes() / 60 + dt.getUTCSeconds() / 3600) * 1000 / 24;
  if (beats < 100) {
    if (beats < 10) return `00${Math.floor(beats)}`;
    return `0${Math.floor(beats)}`;
  } else return `${Math.floor(beats)}`;
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const guild = client.guilds.resolve(guildId);
  const user = guild.me;
  client.user.setPresence({
    activity: {
      name: 'PHANTASY STAR ONLINE 2'
    }
  });
  const setPresence = () => {
    const newBeats = getBeatTime();
    if (newBeats != currentBeats) {
      console.log(newBeats);
      currentBeats = newBeats;
      user.setNickname(`@${currentBeats}`);
    }
  }
  setInterval(setPresence, 5000);
});

client.login(token);
