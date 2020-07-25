const { getBeatTime } = require('../util/beats');
let currentBeats = 0;

module.exports = (client) => {
	const setPresence = () => {
		const newBeats = getBeatTime();
		if (newBeats != currentBeats) {
			currentBeats = newBeats;
			client.user.setPresence({
				activity: {
					name: `@${currentBeats}`,
					type: 'PLAYING'
				}
			});
		};
	};
	setPresence();
	return setInterval(setPresence, 5000);
}
