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

You'll also need a local Postgres database that the Docker image can access. Configure its connection URI as an environment variable called `DATABASE_URL`

Then start the Docker container. You can view the logs to make sure the configuration was read successfully.

## Basic commands

The default prefix is `-` but can be configured.

`-p`: Play a URL of a video or playlist, or search a term and play the first result. Adds to the end of the queue if present. Use it by itself after to resume a queue if nothing is playing.

`-p:shuffle`: Shuffle a YouTube playlist url while adding to the queue.

`-next`: Add to the next spot in the queue, instead of the end.

`-q`: Displays the current queue. Use this to see a number for each queued track to use it for other commands.

`-jump`: Jump to a specific track using its queue number.

`-delete`: Delete a specific track using its queue number.

`-skip`: Skips to the next track in the queue.

`-back`: Play the previous track in the queue..

`-stop`: Stops playback, but maintains the queue for resume later. beatnik leaves the voice channel.

`-clear`: Stops playback and clears the current queue. beatnik leaves the voice channel.

`-h`: Shows this list of commands.
