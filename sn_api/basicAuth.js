/*
Copyright © 2016 ServiceNow, Inc.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
  This is the re-usable authenticate module for ServiceNow REST api. The authenticate method sends
  a GET request to sys_user api to authenticate the user and establish a session. Subsequent requests can
  connect to this session (using same cookie) to avoid re authentication.
 */
module.exports = BasicAuth;

function BasicAuth(snInstanceURL, username, password, options) {
	this.snInstanceURL = snInstanceURL;
	this.username = username;
	this.password = password;
    this.options = options;
}

BasicAuth.prototype.authenticate = function(callBack) {
	var request = require('request');
    //request.debug = this.options.verbose;
	request({
		baseUrl : this.snInstanceURL,
		method : 'GET',
		uri : 'api/now/v2/table/sys_user?sysparm_query=user_name%3D' + this.username,
		json : true,
		// Here we use the basic authentication. The username and password set here will send
		// as the authentication header.
		auth: {
            'user': this.username,
            'pass': this.password,
            'sendImmediately': true
        }

	}, function(err, response, body) {
		if (!err && response.statusCode == 200){
			callBack(err, response, body, response.headers['set-cookie']);
		} else {
			callBack(err, response, body);
		}
	});
}
