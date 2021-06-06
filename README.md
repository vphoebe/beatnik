# beatnik

a discord bot that tells you the time, among other things.

## Current features

- Music bot: Play YouTube videos or playlists and SoundCloud tracks in voice channels.
- Beat time clock: View current Swatch Internet Time in the bot's status message.

## Installation

`beatnik` runs in Docker for production, via `pm2`. You can also run it directly locally if you wish, but you'll need to install `ffmpeg`.

### Prerequisites

- Discord Bot token
- YouTube Data API token (for search functionality)

### Configuration

Duplicate the `config.json.sample` file and fill in your values. Rename to `config.json.` You'll need to bind mount this into the Docker container at the following path: `/usr/app/config.json`

Then start the Docker container. You can view the logs to make sure the configuration was read successfully.

## Basic commands

The default prefix is `-` but can be configured.

`-p [URL]`: Play a URL (YouTube and SoundCloud supported). If something is already playing, it will be added to the queue.

`-p:shuffle [URL]`: Shuffle a YouTube playlist URL into the queue.

`-skip`: Skip to the next track in queue.

`-stop`: Stops playback, deletes the queue, and leaves the channel.

`-volume`: Sets a default volume for playback from 0 to 100%.

`-q`: View the current queue.

`-h`: Shows all commands, and configured shortcuts if you've added any.
