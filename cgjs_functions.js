const https = require('https');
const querystring = require('querystring');
const bot_token = 'YOUR_TOKEN_HERE';

/*

Version -> 0.1
Telegram -> t.me/cylagram
Github -> github.com/cylagram

*/

var db = {
	calls:{}
};
var offset = -1;

const HTTPRequest = function(data, cbfunc) {
	var body = '';
	var request = https.request({host:data.host,port:443,path:data.params,method:data.method}, function(r) {
		r.setEncoding('utf8');
		r.on('data', function (b) {
			body += b;
		});
		r.on('end', function(){
			cbfunc({status:r.statusCode,headers:r.headers,body:body});
		});
	});
	request.end();
}
const isValidJSON = function (jdata) {
	try {
		JSON.parse(jdata);
		return true;
	}
	catch(e) {
		return false;
	}
}

const bot_functions = module.exports = {
	sendHttpRequest: function(data, cbfunc) {
		var body = '';
		var request = https.request({host:data.host,port:443,path:data.params,method:data.method,headers:data.headers}, function(r) {
			r.setEncoding('utf8');
			r.on('data', function (b) {
				body += b;
			});
			r.on('end', function(){
				cbfunc({status:r.statusCode,headers:r.headers,body:body});
			});
		});
		request.end();
	},
	enableUpdatesPolling: function(cbfunc) {
		HTTPRequest({host:'api.telegram.org',params:'/bot'+bot_token+'/getUpdates?'+querystring.stringify({offset:offset,limit:100}),method:'GET'}, function(c) {
			if (!c.error) {
				if (isValidJSON(c.body)) {
					var r_body = JSON.parse(c.body);
					var r_status = JSON.parse(c.status);
					if (r_status == 200) {
						if (typeof cbfunc === 'function') {
							var updates = r_body.result;
							if (updates.length > 0) {
								for (var i = 0; i < updates.length; i++) {
									var update = updates[i];
									offset = update.update_id + 1;
									cbfunc(update);
								}
							}
							bot_functions.enableUpdatesPolling(cbfunc);
						}
					}
					else {
						if (typeof cbfunc === 'function') {
							cbfunc({err:{method:'getUpdates',err_code:r_status,err_desc:r_body.description}});
						}
					}
				}
				else {
					if (typeof cbfunc === 'function') {
						cbfunc({err:{method:method,err_code:r_status,err_desc:'Unknown error description, probably not related to called method.'}});
					}
				}
			}
		});
	},
	verifyBotToken: function(cbfunc) {
		HTTPRequest({host:'api.telegram.org',params:'/bot'+bot_token+'/getMe',method:'GET'}, function(c) {
			if (!c.error) {
				if (isValidJSON(c.body)) {
					var r_body = JSON.parse(c.body);
					if (typeof cbfunc === 'function') {
						if (r_body.ok == true) {
							cbfunc({valid:true});
						}
						else {
							cbfunc({valid:false});
						}
					}
				}
			}
		});
	},
	callMethod: function(method, args, cbfunc, options) {
		if (options) {
			var time = Date.now() / 1000 | 0;
			if (!db['calls'][options.ratelimit_id]) { db['calls'][options.ratelimit_id] = {timestamp:0,count:0}; }
			if (db['calls'][options.ratelimit_id]['timestamp'] < time) { db['calls'][options.ratelimit_id]['count'] = 0; }
			if (db['calls'][options.ratelimit_id]['count'] < options.ratelimit_count) {
				db['calls'][options.ratelimit_id]['count']++;
				db['calls'][options.ratelimit_id]['timestamp'] = time + options.ratelimit_time;
				HTTPRequest({host:'api.telegram.org',params:'/bot'+bot_token+'/'+method+'?'+querystring.stringify(args),method:'GET'}, function(c) {
					if (!c.error) {
						if (isValidJSON(c.body)) {
							var r_body = JSON.parse(c.body);
							var r_status = JSON.parse(c.status);
							if (r_status == 200) {
								if (typeof cbfunc === 'function') {
									cbfunc(r_body);
								}
							}
							else {
								if (typeof cbfunc === 'function') {
									cbfunc({err:{method:method,err_code:r_status,err_desc:r_body.description}});
								}
								
							}
						}
						else {
							if (typeof cbfunc === 'function') {
								cbfunc({err:{method:method,err_code:r_status,err_desc:'Unknown error description, probably not related to called method.'}});
							}
						}
					}
				});
			}
			else {
				if (typeof cbfunc === 'function') {
					cbfunc({ratelimit:{method:method,id:options.ratelimit_id,remaining_time:(db['calls'][options.ratelimit_id]['timestamp']-time)}});
				}
			}
		}
		else {
			HTTPRequest({host:'api.telegram.org',params:'/bot'+bot_token+'/'+method+'?'+querystring.stringify(args),method:'GET'}, function(c) {
				if (!c.error) {
					if (isValidJSON(c.body)) {
						var r_body = JSON.parse(c.body);
						var r_status = JSON.parse(c.status);
						if (r_status == 200) {
							if (typeof cbfunc === 'function') {
								cbfunc(r_body);
							}
						}
						else {
							if (typeof cbfunc === 'function') {
								cbfunc({err:{method:method,err_code:r_status,err_desc:r_body.description}});
							}
							
						}
					}
					else {
						if (typeof cbfunc === 'function') {
							cbfunc({err:{method:method,err_code:r_status,err_desc:'Unknown error description, probably not related to called method.'}});
						}
					}
				}
			});
		}
	}
};