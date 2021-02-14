const Discord = require("discord.js");
const { prefix, token, youtubeKey } = require("./config.json");
const ytdl = require("ytdl-core");
const ytpl = require("ytpl");
const YouTube = require("discord-youtube-api");
const youtube = new YouTube(youtubeKey);
const presence = require("./presence");

const client = new Discord.Client();

const botQueue = new Map();

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const defaultVolume = 0.5; // 50%

client.once("ready", () => {
  console.log("Ready!");
  presence(client);
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = botQueue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}p`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}q`)) {
    listQueue(message, serverQueue);
  } else if (message.content.startsWith(`${prefix}volume`)) {
    changeVolume(message, serverQueue);
  } else if (message.content.startsWith(`${prefix}help`)) {
    listCommands(message);
  } else {
    message.channel.send("You need to enter a valid command!");
    listCommands(message);
  }
});

function listCommands(message) {
  const commandEmbed = new Discord.MessageEmbed()
    .setColor("#ed872d")
    .setTitle("All commands")
    .setDescription(
      `\`${prefix}p\`: Play a URL of a video or playlist, or search a term and play the first result. Adds to the end of the queue if present.\n
    \`${prefix}q\`: List the queue, including the currently playing item.\n
    \`${prefix}skip\`: Skips to the next item in queue.\n
    \`${prefix}stop\`: Stops and disconnects from the voice channel.\n
    \`${prefix}volume\`: Change the volume of the playback, from 0 to 100%.\n
    \`${prefix}help\`: Show this message.`
    )
    .setTimestamp()
    .setFooter("sent by beatnik");
  message.channel.send(commandEmbed);
}

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }

  const url = args[1];
  const queuedSongs = [];
  const ytRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/;

  if (ytRegex.test(url)) {
    if (url.includes("playlist")) {
      const playlistInfo = await ytpl(url);
      const playlistSongs = playlistInfo.items.map((item) => ({
        title: item.title,
        url: item.shortUrl,
        user: message.author.username,
      }));
      if (message.content.includes(":shuffle")) shuffleArray(playlistSongs);
      queuedSongs.push(...playlistSongs);
    } else {
      const songInfo = await ytdl.getInfo(url);
      const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
        user: message.author.username,
      };
      queuedSongs.push(song);
    }
  } else {
    // treat as search query
    const query = args.slice(1).join(" ");
    const searchResult = await youtube.searchVideos(query);
    const song = {
      title: searchResult.title,
      url: searchResult.url,
      user: message.author.username,
    };
    queuedSongs.push(song);
  }

  if (!serverQueue) {
    const queueConstruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: defaultVolume,
      playing: true,
    };

    botQueue.set(message.guild.id, queueConstruct);
    queueConstruct.songs.push(...queuedSongs);

    try {
      var connection = await voiceChannel.join();
      queueConstruct.connection = connection;
      play(message.guild, queueConstruct.songs[0]);
    } catch (err) {
      console.log(err);
      botQueue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(...queuedSongs);
    if (queuedSongs.length === 1) {
      return message.channel.send(
        `${queuedSongs[0].title} has been added to the queue!`
      );
    } else {
      return message.channel.send(
        `${queuedSongs.length} tracks have been added to the queue!`
      );
    }
  }
}

function changeVolume(message, serverQueue) {
  const args = message.content.split(" ");
  const inputValue = args[1];
  if (inputValue && serverQueue) {
    const parsedValue = parseInt(inputValue);
    if (parsedValue && parsedValue <= 100 && parsedValue >= 0) {
      const dispatcher = serverQueue.connection.dispatcher;
      dispatcher.setVolume(parsedValue / 100);
      message.channel.send(`Changing volume to ${parsedValue}%...`);
    } else {
      message.channel.send("Please input a number between 0 and 100.");
    }
  } else if (!serverQueue) {
    message.channel.send("Start playing something to change the volume.");
  } else {
    message.channel.send(`The current volume is ${serverQueue.volume * 100}%`);
  }
}

function listQueue(message, serverQueue) {
  if (serverQueue?.songs?.length > 0) {
    const queueItemStrings = serverQueue.songs.map((item, i) => {
      return `**[${i}]** ${item.title}\n Queued by \`${item.user}\``;
    });

    const queueEmbed = new Discord.MessageEmbed()
      .setColor("#ed872d")
      .setTitle("Now playing on beatnik")
      .setDescription(queueItemStrings[0].replace("**[0]** ", ""))
      .addField("Up next", queueItemStrings.slice(1).join("\n\n"))
      .setTimestamp()
      .setFooter("sent by beatnik");

    message.channel.send(queueEmbed);
  } else {
    message.channel.send("No songs currently in queue.");
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );

  if (!serverQueue)
    return message.channel.send("There is no song that I could stop!");

  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = botQueue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    botQueue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", (error) => console.error(error));
  dispatcher.setVolume(serverQueue.volume);
  serverQueue.textChannel.send(`Now playing: **${song.title}**`);
}

client.login(token);
