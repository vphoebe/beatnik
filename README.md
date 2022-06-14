# Beatnik: a Discord music bot

Run your own modern and simple Discord music bot with easy-to-use commands that anyone on your server can understand.

## Features
- Fully utilizes simple to understand Discord slash commands
- Robust music queue management (add, remove, skip, shuffle, etc.)
- Save URLs so you can queue them easily later
- Status updates with current Swatch Internet Time so you can sync up your raids
- Prioritizes Opus-encoded streams from services to increase performance
- Supported music sources:
	- YouTube
- Easy setup
	- No service API keys required
	- No database processes to maintain, just a single database file
	- Run with Docker or natively with Node.js

## Installation
Beatnik is designed to be operated yourself, so there's a few things to set up first. Before you do anything though, you'll need to set up an application and bot on the [Discord developer portal](https://discord.com/developers/applications).  Make sure to have this page handy because you'll need some info soon.

### Docker (recommended)
If you are familiar at all with Docker, this is the fastest way to get Beatnik up and running. The [latest Docker image](https://hub.docker.com/r/nickseman/beatnik) is at `nickseman/beatnik:latest`

Trust me, getting the dependencies to install correctly can be annoying, especially if you're on a new architecture like Apple M1. Docker takes care of all of it for you. 

Make sure to configure the Docker container's environment according to the [Environment](#Environment) section below. You'll probably want to bind the path that you specify for `DATABASE_PATH` to somewhere outside the container in case it needs to be updated or re-created.

Skip down to [Invite](#Invite) to see what's next.

### Local Node.js (via pm2)
1. Clone this repository somewhere locally. You'll need Node.js 16 or later installed.
2. Run `npm install` to install all the dependencies.
3. Make sure ``ffmpeg`` is installed on your OS. The command above won't install it, and it's required for Beatnik to play audio.
4. Run `npm run build` to actually build the application.
5. Set up your `.env` file by creating `.env` in the same directory, and filling out the fields as described below in [Environment](#Environment).
6. It's best to run Beatnik with `pm2` so that the process is managed for you. Run `npm install -g pm2` to install `pm2` on your system.
7. Run `npm start` and you're up and running. Skip down to [Invite](#Invite) to see what's next.

If you don't want to use `pm2`, you can run `build/index.js` however you want to start the bot. Before you do so though, run `build/deploy-global-commands.js` or else you won't be able to install the commands to your guild (server.) 

### Environment
Whether you're using Docker or Node.js, you'll need to configure the environment variables with a few things from the bot application you created earlier on the Discord developer portal.
| Variable | Value | Example |
|--|--|--|
| TOKEN | Your Discord bot's token | xxxxxxxxxxxx.yyyyyyyyy | 
| CLIENT_ID | Your Discord bot's client ID | 00000000000 |
| DATABASE_PATH | A path to a SQLite database file (one will be created for you once the app runs.) | `/Users/You/Documents/beatnik.db`

### Invite
Check out the Discord developer portal > OAuth2 > URL Generator to create an invite link. Make sure the `bot` and `application.commands` scopes are set, and `Connect` and `Speak` are enabled in the bot permissions under Voice.

### Install
You need to be a server administrator to install Beatnik. Type `/install` in any text channel the bot can see, and the commands will now be available.

## Usage and commands

Beatnik uses Discord slash commands. You can just type `/` in your text channel, and then click the Beatnik icon to see all the commands. Or you can read this.

|Command| Description | Options |
|--|--|--|
| /play  | Plays a URL (or searches for a text query). `next` will add the track next in the queue instead of at the end. `shuffle` will shuffle a playlist link as it gets added. | next, shuffle
| /stop  | Stops music, clears the queue, and removes Beatnik from the voice channel.  |  |
| /skip  | Skips the current playing track in the queue. Use the `track` option to skip to a specific track. | track |
| /shuffle | Shuffles all the tracks in the queue and starts playing from the top. | |
| /queue | Lists the current queue and currently playing track. | |
| /save | Gives a `name` to a URL so you can load it into the queue easily later. | name |
| /load | Loads a saved URL with `name` into the queue. The same options as `/play` apply here. | name, next, shuffle
| /list | Lists all saved URLs in the guild | |
| /remove queue | Removes a track from the queue | track |
| /remove saved | Removes a saved URL with `name` from the guild. | name |
| /install | Installs Beatnik commmands to your guild. Admins only. |
| /uninstall | Removes Beatnik commands from your guild. Admins only. |
 