# Beatnik: a Discord music bot

Run your own modern and simple Discord music bot with easy-to-use native slash commands.

## Features
- Fully utilizes simple to understand Discord slash commands
- Robust music queue management (add, remove, skip, shuffle, etc.)
- Save URLs so you can queue them easily later
- Configurable cache to improve performance of frequently queued content
- Status updates with current Swatch Internet Time so you can sync up your raids
- Prioritizes Opus-encoded streams from services to increase performance
- Supported music sources:
	- YouTube
- Easy setup
	- No service API keys required
	- No database processes to maintain, just a single database file
	- Run with Docker or natively with Node.js
- Fully text-based two-player Othello gameplay, using Discord message embeds in any channel

## Installation
Beatnik is designed to be operated yourself, so there's a few things to set up first. Before you do anything though, you'll need to set up an application and bot on the [Discord developer portal](https://discord.com/developers/applications).  Make sure to have this page handy because you'll need some info soon.

### Docker
If you are familiar at all with Docker, this is the fastest way to get Beatnik up and running. The [latest Docker image](https://hub.docker.com/r/nickseman/beatnik) is at `nickseman/beatnik:latest` - or you can build it yourself after checking out the code.

Beatnik is able to run on [fly.io](https://fly.io/docs/about/pricing/#free-allowances) using resources available within their Free Allowances.

Make sure to configure the Docker container's environment according to the [Environment](#Environment) section below, and ensure the paths for database and cache are properly bound to persistent storage.

Skip down to [Invite](#Invite) to see what's next.

### Node.js
1. Clone this repository somewhere locally. You'll need Node.js 18 or later installed along with `pnpm` ideally.
2. Run `pnpm install` to install all the dependencies.
3. Make sure ``ffmpeg`` is installed on your OS. The command above won't install it, and it's required for Beatnik to play audio.
4. Set up your `.env` file by creating `.env` in the same directory, and filling out the fields as described below in [Environment](#Environment).
5. Run `pnpm start` and you're up and running. Skip down to [Invite](#Invite) to see what's next.

### Environment
Whether you're using Docker or Node.js, you'll need to configure the environment variables with a few things from the bot application you created earlier on the Discord developer portal.
| Variable | Value | Example
|--|--|--|
| TOKEN | Your Discord bot's token. **Required.** | xxxxxxxxxxxx.yyyyyyyyy | 
| CLIENT_ID | Your Discord bot's client ID. **Required.** | 00000000000 |
| MAX_CACHE_SIZE_IN_MB | How much space in megabytes that the cache can expand to. Set this value to `0` to disable caching entirely. | `128`
| DATABASE_PATH | A valid path that Beatnik can use to create a SQLite file. In advance, run `touch beatnik.sqlite` to make sure the file exists. If you're using Docker, bind this example path to your persistent storage, and don't change the ENV variable. | `/usr/beatnik/beatnik.sqlite`
| CACHE_PATH | A valid directory that Beatnik can use to save its cache. If you're using Docker, bind this example path to your persistent storage, and don't change the ENV variable. Not required if `MAX_CACHE_SIZE_IN_MB` is set to `0`. | `/usr/beatnik/beatnik-cache`

### Invite
Check out the Discord developer portal > OAuth2 > URL Generator to create an invite link. Make sure the `bot` and `application.commands` scopes are set, and `Connect` and `Speak` are enabled in the bot permissions under Voice. Also, once Beatnik is invited, ensure it gets assigned a role that lets it post messages in at least one text channel. Now Playing embeds and other messages are posted in the channel where the command was called.

### Install
You need to be a server administrator to install Beatnik. Type `/install` in any text channel the bot can see, and the commands will now be available.

## Usage and commands

Beatnik uses Discord slash commands. You can just type `/` in your text channel, and then click the Beatnik icon to see all the commands. Or you can read this.

|Command| Description | Options |
|--|--|--|
| `/play [query]` | Plays a URL, or searches for a text query and plays the first result. `end` will add the track to the end of the queue, instead of the beginning. `shuffle` will shuffle a playlist link as it gets added. | end, shuffle
| `/stop`  | Stops music, clears the queue, and removes Beatnik from the voice channel.  |  |
| `/skip [track?]`  | Skips the current playing track in the queue. Use the `track` option to skip to a specific track. | |
| `/shuffle` | Shuffles all the tracks in the queue and starts playing from the top. | |
| `/queue [page?]` | Lists the current queue and currently playing track. Specify a page to see the rest of the queue. | |
| `/save [name] [url]` | Gives a `name` to a URL so you can load it into the queue easily later. | |
| `/load [name]` | Loads a saved URL with `name` into the queue. The same options as `/play` apply here. | end, shuffle
| `/list` | Lists all saved URLs in the guild. | |
| `/remove queue [track]` | Removes a track from the queue. | |
| `/remove saved [name]` | Removes a saved URL with `name` from the guild. | |
| `/install` | Installs Beatnik commmands to your guild. Admins only. |
| `/uninstall` | Removes Beatnik commands from your guild. Admins only. |

### Othello commands
Beatnik includes a text-based version of Othello.

| Command | Description |
| -- | -- |
| `/start [player 1] [player 2]` | Starts the game with the two users you specify. If any of the players are in an active game, it will be removed. |
| `/move [coordinates]`| Makes your player's move using the grid coordinates. Example: `/move c4` |
| `/pass` | Passes your turn to the next player. Used if there are no available moves. |
| `/rules` | Shows basic rules and usage for commands. |
 
