const BeatTime = require('../classes/BeatTime');
let currentBeats; // string

module.exports = (client) => {
  const setPresence = () => {
    const newBeats = new BeatTime().string;
    if (newBeats !== currentBeats) {
      currentBeats = newBeats;
      client.user.setPresence({
        activity: {
          name: currentBeats,
          type: 'PLAYING'
        }
      });
    };
  };
  setPresence();
  return setInterval(setPresence, 500);
};
