/*
Copyright © 2016 ServiceNow, Inc.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
  This module handles the login requests. It receives the message from browser and extracts the username, password and
  ServiceNow instance url from the request. Then authenticate the user with snAuth module and finally saves the cookie
  in client session.
 */
module.exports = {
    login: function(serverRequest, serverResponse) {
        var bodyString = '';
        var body = {};

        // Server receives data as parts. Use this method to concatenate them to one message.
        serverRequest.on('data', function(data) {
            bodyString += data;
        });

        // At the end use the full string to extract the data and invoke back end.
        serverRequest.on('end', function() {
            body = JSON.parse(bodyString);
            var SNAuth = serverRequest.app.get('snAuth');
            var options = serverRequest.app.get('options');
            var snAuth = new SNAuth(body.hosturl, body.username, body.password, options);

            // Initialize the sessions to store details.
            serverRequest.session['snConfig'] = {};
            serverRequest.session.snConfig['snInstanceURL'] = body.hosturl;

            // Invoke the snAuth module. That returns the response and cookie.
            snAuth.authenticate(function(error, response, body, cookie) {
                serverRequest.app.get('respLogger').logResponse(options, response, body);
                if (response) {
                    if (response && response.statusCode == 200) {
                    	// This means username, password is valid and response contains the valid cookie.
                        serverRequest.session.snConfig['snCookie'] = cookie;
                        serverResponse.status(response.statusCode).send(body);
                    } else if (response && response.statusCode == 401) {
                    	// This means username or password is invalid.
                        serverResponse.status(response.statusCode).send('Invalid username or password');
                    } else {
                        serverResponse.status(response.statusCode).send(
                            'Error occured while communicating with ServiceNow instance. ');
                    }
                } else {
                	// This means either ServiceNow instance url is wrong or it is down.
                    serverResponse.status(500).send(
                            'Error occured while communicating with ServiceNow instance. ');
                }
            });
        });
    }
}
