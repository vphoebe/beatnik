export type LoggerOptions = {
  type: "CMD" | "INFO" | "DB" | "CACHE" | "ERROR";
  guildId?: string;
  user: string;
  message: string;
};

export function log(options: LoggerOptions) {
  const { type, guildId, user, message } = options;
  const method = type === "ERROR" ? console.error : console.info;
  return method(
    `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} [${type}] [${user}${
      guildId ? `@${guildId}` : ""
    }]: ${message}`
  );
}
