class BeatTime {
  constructor (date = new Date()) {
    this.value = (((date.getUTCHours() + 1) % 24) +
      date.getUTCMinutes() / 60 +
      date.getUTCSeconds() / 3600) * 1000 / 24;
  }

  leadingZeroes () {
    // returns string of value with leading zeroes
    if (this.value < 100) {
      if (this.value < 10) return `00${Math.floor(this.value)}`;
      return `0${Math.floor(this.value)}`;
    } else return `${Math.floor(this.value)}`;
  }

  get string () {
    return `@${this.leadingZeroes()}`;
  }
};

module.exports = BeatTime;
