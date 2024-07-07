export type LoggerOptions = {
  type: "CMD" | "INFO" | "DB" | "CACHE" | "ERROR";
  guildId?: string;
  user: string;
  message: string;
};

export function log(options: LoggerOptions) {
  const { type, user, message } = options;
  const method = type === "ERROR" ? console.error : console.info;
  return method(
    `${new Date().toLocaleDateString("en-us", { timeZone: "PST" })} ${new Date().toLocaleTimeString("en-us", { timeZone: "PST" })} [${type}] [${user}]: ${message}`,
  );
}
