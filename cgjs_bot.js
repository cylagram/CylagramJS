const CylagramJS = require('./cgjs_functions.js');

class Bot {
	static handleUpdate (update) {
		try {
			if (update.message) {
				if (update.message.text == '/start') {
					CylagramJS.callMethod('sendMessage', {
						chat_id:update.message.chat.id,
						text:'Hello, welcome to CylagramJS!'
					});
				}
			}
		} catch(e) { console.log(e); }
	}
}

CylagramJS.verifyBotToken(function(r) {
	if (r.valid == true) {
		CylagramJS.enableUpdatesPolling(Bot.handleUpdate);
		console.log('Started updates polling!');
	}
	else {
		console.log('Invalid bot token, please change it in functions.js line 3.');
	}
});