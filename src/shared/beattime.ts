export function getBeatTimeString(date = new Date()): string {
  const value =
    ((((date.getUTCHours() + 1) % 24) + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) *
      1000) /
    24;
  return value < 100
    ? value < 10
      ? `00${Math.floor(value)}`
      : `0${Math.floor(value)}`
    : `${Math.floor(value)}`;
}
