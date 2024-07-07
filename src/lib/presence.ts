import { ActivitiesOptions, ActivityType, Client, PresenceStatusData } from "discord.js";

import { getBeatTimeString } from "./util.js";

export function getIdleActivity() {
  const activity: ActivitiesOptions = {
    name: `@${getBeatTimeString()}`,
    type: ActivityType.Playing,
  };
  return activity;
}

export function updatePresence(
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
