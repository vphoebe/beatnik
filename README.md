# beatnik - a music bot for Discord

A modern music bot for your Discord server that you can host yourself! No subscription fees, service API keys, or advanced knowledge required.

## 🥁 Features
- Use easy to understand slash commands to play audio from YouTube videos in your server's voice channels
- Save YouTube playlists and videos to your library for fast, local playback
  - Adding to your library downloads the audio and metadata locally, so future plays don't require the API
- Text-based Othello which can be played with other users in any text channel
- Get up and running using Docker in minutes
- No fees, service tokens, or privacy concerns - everything is operated by you locally

## 🚀 Get started

### Discord application setup
1. Sign into the [Discord developer portal](https://discord.com/developers/applications "Discord developer portal") and create a new application. You can call it whatever you'd like and set a profile picture for it. You'll return here later to grab your token and client ID.
2. Once created, navigate to **OAuth2** on the left sidebar. Scroll down to **OAuth2 URL Generator** and make the following changes:
	- Under *Scopes*, check `applications.commands` and `bot`.
	- Under *Bot Permissions*, check `Send Messages`, `Connect`, and `Speak`.
3. Copy the generated URL, paste into your web browser, and select a Discord server to add Beatnik to.

### Docker

You can use this example Docker compose file to get Beatnik up and running.

```yaml
version: "3.9"
services:
  beatnik:
    container_name: "beatnik"
    image: "nickseman/beatnik:latest"
    volumes:
      - "/path/on/your/computer/library.db:/library.db"
      - "/path/on/your/computer/library:/library"
      - "/path/on/your/computer/cookies.json:/cookies.json"
    environment:
      - TOKEN=xxxxxxxxxx
      - CLIENT_ID=00000000
    restart: always
```

Change `/path/on/your/computer` to a directory where Beatnik's files can live, such as `/Users/me/Documents/Beatnik`. Create the `library` directory there, and then `touch` two empty files for `library.db` and `cookies.json`. Then, update the two environment variables in your Docker compose file:

| Variable  |  Where to find |
| ------------ | ------------ |
| `TOKEN`  | Discord developer portal > Applications > [your app] > Bot > Token  |
| `CLIENT_ID` | Discord developer portal > Applications > [your app] > OAuth2 > Client ID  |

### YouTube cookies (optional)
This isn't required for Beatnik to work, but some YouTube videos require a cookie (signed in user) to play, like age-restricted or private videos. [Follow the steps here](https://github.com/distubejs/ytdl-core?tab=readme-ov-file#how-to-get-cookies "Follow the steps here") to create `cookies.json` in the Beatnik folder you created above if you require this setup.


## 🎵 Usage
Beatnik uses Discord slash commands. You can type `/` in any text channel, and then click the Beatnik icon to see all the commands with descriptions.

|Command| Description | Options |
|--|--|--|
| `/play [query]` | Plays a video or playlist URL, or searches for a text query and plays the first result. | `end`: Adds to end of the queue, instead of next.<br> `shuffle`: Shuffles a playlist. |
| `/load (playlist \| track) [item]` | Loads a playlist or track from your library. | `end`: Adds to end of the queue, instead of next.<br> `shuffle`: Shuffles a playlist. |
| `/add [query]` | Adds a YouTube URL to your library (playlist or track) and downloads the tracks locally. |
| `/update [playlist]` | Updates a playlist in your library (eg. when new tracks are added.) | |
| `/stop`  | Stops music, clears the queue, and removes Beatnik from the voice channel.  |  |
| `/skip`  | Skips the current playing track in the queue. | `track`: Skip to a specific track in queue. |
| `/shuffle` | Shuffles tracks in the queue after the currently playing song. | |
| `/queue` | Lists the current queue and currently playing track. | `page`: View another page of the queue, if necessary. |
| `/remove queue [track]` | Removes a track from the queue. | | |
| `/remove (playlist \| saved-track) [item]` | Removes an item from your library. | |

### Othello commands
Beatnik includes a text-based version of Othello.

| Command | Description |
| -- | -- |
| `/othello-start [player 1] [player 2]` | Starts the game with the two users you specify. If any of the players are in an active game, it will be removed. |
| `/move [coordinates]`| Makes your player's move using the grid coordinates. Example: `/move c4` |
| `/pass` | Passes your turn to the next player. Used if there are no available moves. |
| `/rules` | Shows basic rules and usage for commands. |
 