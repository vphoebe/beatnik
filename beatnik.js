const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const token = config.token;
const guildId = config.guild;

const presence = require('./presence/presence');

client.on('ready', () => {
	const guild = client.guilds.resolve(guildId);
  console.log(`Logged in as ${client.user.tag} on ${guild.name}!`);
  presence(client); // start presence lifecycle
});

client.login(token);
