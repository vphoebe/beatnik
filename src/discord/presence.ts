import type { ActivitiesOptions, Client, PresenceStatusData } from "discord.js";
import { ActivityType } from "discord.js";

const getBeatTimeString = (date = new Date()): string => {
  const value =
    ((((date.getUTCHours() + 1) % 24) + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) *
      1000) /
    24;
  return value < 100
    ? value < 10
      ? `00${Math.floor(value)}`
      : `0${Math.floor(value)}`
    : `${Math.floor(value)}`;
};

function getIdleActivity() {
  const activity: ActivitiesOptions = {
    name: `@${getBeatTimeString()}`,
    type: ActivityType.Playing,
  };
  return activity;
}

function updatePresence(
  client: Client,
  status: PresenceStatusData,
  activity: ActivitiesOptions,
): void {
  client.user?.setPresence({ status, activities: [activity] });
  return;
}

export function startPresenceLifecycle(client: Client) {
  function checkStatusAndUpdate() {
    const user = client.user;
    if (!user) return;
    const currentActivities = user.presence.activities;
    const potentialNewStatus = `@${getBeatTimeString()}`;
    if (currentActivities && currentActivities.length > 0) {
      const currentStatus = user.presence.activities[0].name;
      if (currentStatus !== potentialNewStatus) {
        updatePresence(client, "online", getIdleActivity());
      }
    } else {
      updatePresence(client, "online", getIdleActivity());
    }
  }
  checkStatusAndUpdate();
  return setInterval(checkStatusAndUpdate, 10000);
}
