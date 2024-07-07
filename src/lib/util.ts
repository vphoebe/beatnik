export const getDurationString = (seconds: number | null) => {
  if (seconds) {
    const hours = Math.floor(seconds / 60 / 60);
    const minutes = Math.floor(seconds / 60) - hours * 60;
    const sec = Math.floor(seconds % 60);
    return `${hours > 0 ? `${hours}:` : ""}${
      minutes > 10 || !hours ? minutes : `0${minutes}`
    }:${sec < 10 ? `0${sec}` : sec}`;
  }
  return "unknown";
};

export const durationStringToSeconds = (string: string) => {
  const [minutes, seconds] = string.split(":");
  return parseInt(minutes) * 60 + parseInt(seconds);
};

export const shuffleArray = <T>(array: Array<T>) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = newArray[i];
    newArray[i] = newArray[j];
    newArray[j] = temp;
  }
  return newArray;
};

export const getBeatTimeString = (date = new Date()): string => {
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
