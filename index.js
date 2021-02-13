const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");
const ytpl = require("ytpl");
const presence = require("./presence");
const sox = require("sox-stream");
const ffmpeg = require("fluent-ffmpeg");
const lame = require("@suldashi/lame");

const client = new Discord.Client();

const queue = new Map();

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

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}queue`)) {
    listQueue(message, serverQueue);
  } else {
    message.channel.send("You need to enter a valid command!");
  }
});

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
  if (url.includes("playlist")) {
    const playlistInfo = await ytpl(url);
    const playlistSongs = playlistInfo.items.map((item) => ({
      title: item.title,
      url: item.shortUrl,
      user: message.author.username,
    }));
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

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 3,
      playing: true,
    };

    queue.set(message.guild.id, queueContruct);
    queueContruct.songs.push(...queuedSongs);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
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

function listQueue(message, serverQueue) {
  if (serverQueue?.songs?.length > 0) {
    const queueItemStrings = serverQueue.songs.map((item, i) => {
      return `**[${i + 1}]** ${item.title}\n \`${item.user}\``;
    });

    const queueEmbed = new Discord.MessageEmbed()
      .setColor("#ed872d")
      .setTitle("Up next in the queue")
      .setDescription(queueItemStrings.join("\n\n"))
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
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }
  const pcmStream = ffmpeg(
    ytdl(song.url, {
      filter: (format) => format.container === "mp4",
    })
  )
    .format("mp3")
    .pipe(lame.Decoder())
    .pipe(
      sox({
        output: { type: "pcm" },
        effects: ["compand 0.3,1 6:−70,−60,−20 −5 −90 0.2"],
      })
    );

  const dispatcher = serverQueue.connection
    .play(pcmStream, { type: "converted" })
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", (error) => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

client.login(token);
