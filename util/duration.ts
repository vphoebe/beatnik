const getDurationString = (seconds: number | null) => {
  if (seconds) {
    const hours = Math.floor(seconds / 60 / 60);
    const minutes = Math.floor(seconds / 60) - hours * 60;
    const sec = seconds % 60;
    return `${hours > 0 ? `${hours}:` : ""}${minutes}:${
      sec < 10 ? `0${sec}` : sec
    }`;
  }
  return "unknown";
};

export default getDurationString;
