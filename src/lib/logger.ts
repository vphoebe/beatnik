export type LoggerOptions = {
  type: "CMD" | "INFO" | "DB";
  guildId: string;
  user: string;
  message: string;
};

export function log(options: LoggerOptions) {
  const { type, guildId, user, message } = options;
  return console.info(
    `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} [${type}] [${user}@${guildId}]: ${message}`
  );
}
