type LogOptions = {
  level?: "INFO" | "WARN" | "ERROR";
  message: string;
} & (
  | {
      /** The provider emitting the log. */
      component: "PROVIDER";
      /** The provider's id e.g. `"youtube"` */
      name: string;
    }
  | {
      /** The Discord layer emitting the log. */
      component: "DISCORD";
      /** The subsystem or guild id the log pertains to. */
      name: string;
      /** The username of the initiator, if applicable. */
      username?: string;
    }
  | {
      /** The core layer emitting the log. */
      component: "CORE";
      /** The core subsystem emitting the log. */
      name: "CACHE" | "DB";
    }
);

export function log(options: LogOptions) {
  const { level = "INFO", message, component, name } = options;
  const username = component === "DISCORD" ? options.username : undefined;
  const method = level === "ERROR" ? console.error : console.info;
  const caller = username ? `${username}@${name}` : name;
  const timestamp = new Date().toLocaleTimeString("en-us");
  return method(`${level}: ${timestamp} [${component}] [${caller}]: ${message}`);
}
