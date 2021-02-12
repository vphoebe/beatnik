class BeatTime {
  constructor(date = new Date()) {
    this.value =
      ((((date.getUTCHours() + 1) % 24) +
        date.getUTCMinutes() / 60 +
        date.getUTCSeconds() / 3600) *
        1000) /
      24;
  }

  leadingZeroes() {
    // returns string of value with leading zeroes
    const value = this.value;
    return value < 100
      ? value < 10
        ? `00${Math.floor(value)}`
        : `0${Math.floor(value)}`
      : `${Math.floor(value)}`;
  }

  get string() {
    return `@${this.leadingZeroes()}`;
  }
}

module.exports = BeatTime;
