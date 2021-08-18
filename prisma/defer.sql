alter table "Track" add constraint "queuePosition"
  unique("guildId", "queueIndex")
  deferrable initially deferred;