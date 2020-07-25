const getBeatTime = (date = new Date()) => {
  const beats = (((date.getUTCHours() + 1) % 24) + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) * 1000 / 24;
  if (beats < 100) {
    if (beats < 10) return `00${Math.floor(beats)}`;
    return `0${Math.floor(beats)}`;
  } else return `${Math.floor(beats)}`;
};

module.exports = {
  getBeatTime: getBeatTime
};
