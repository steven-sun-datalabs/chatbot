/*
Copyright © 2016 ServiceNow, Inc.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
 Startup script for node.js server. It loads the required packages and sets message routers.
 */

// Required packages
var express = require('express');
var taskDispatcher = require('./dispatcher/taskDispatcher');
var loginDispatcher = require('./dispatcher/loginDispatcher');
var path = require('path');
var session = require('client-sessions');
var http = require('http');
var bodyParser = require('body-parser');

// Authorization between apiai and server: test the single line auth
var apiai = require('apiai')
var appapiai = apiai('8e9d6bf7b5c04ff194aacbffaf995db3');

// some common utilities
var respLogger = require('./common/responseLogger');
var usage = require('./common/usage');

// process the command line options
var options = usage.processArgs(path.basename(__filename));

// Modules used for communication with ServiceNow instance.
var snAuth = require('./sn_api/basicAuth');
var snTask = require('./sn_api/task');

var app = express();

// Register the authenticate and task modules to be used in dispatchers
app.set('snAuth', snAuth);
app.set('snTask', snTask);
app.set('respLogger', respLogger);
app.set('options', options);

// Register the static html folder. Browser can load html pages under this folder.
app.use(express.static(path.join(__dirname, 'public')));

// Register the Servicenow session. Secret can be an arbitrary string.
app.use(session({
    cookieName: 'session',
    secret: 'af*asdf+_)))==asdf afcmnoadfadf',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
}));

// Create our Express router
var router = express.Router();

// Register dispatchers for different types of requests. This application receives following
// types of http requests from browser.
router.post('/login', loginDispatcher.login);
router.get('/tasks', taskDispatcher.getTasks);
router.get('/task/:taskid/comments', taskDispatcher.getComments);
router.post('/task/:taskid/comments', taskDispatcher.addComment);
router.delete('/logout', function(req, res) {
    req.session.destroy();
    res.end("Deleted");
});

app.post("/sms", function (request, response) {
  //print out the body from twilio
  console.log(request.body);

  //send the text from twilio to apiai
  var req = appapiai.textRequest(request.body.Body, {
    'sessionId': 123456 //not sure if this needs to be changed????
  });
  //wait for response from apiai

	ro
  req.on('response', function(res) {
    //decide if it needs more info, send it back to twilio, otherwise forward it to servicenow
    /* sudo code
      if apiai is ready
      {
        if(ticket)
        {
          if many
          {
            serviceNow call
            response.send("<Response><Message>" + link to ticket table + "</Message></Response>");
          }
          else
          {
            serviceNow call
            response.send("<Response><Message>" + ticket details + "</Message></Response>");
          }
        }
        if(incident)
        {
          if many
          {
            serviceNow call
            response.send("<Response><Message>" + link to incident table + "</Message></Response>");
          }
          else
          {
            serviceNow call
            response.send("<Response><Message>" + incident details + "</Message></Response>");
          }
        }
        if(knowledgeSearch)
        {
          serviceNow call
          response.send("<Response><Message>" + link to search + "</Message></Response>");
        }
      }
      else
      {
        response.send("<Response><Message>" + res.result.fulfillment.speech + "</Message></Response>");
      }

      console.log(res);

      remove the duplicated code
    */
    //respond to twilio with the response from apiai
    response.send("<Response><Message>" + res.result.fulfillment.speech + "</Message></Response>");

    //print out the response from apiai
    console.log(res);
  });

  req.on('error', function(error) {
    console.log(error);
  });

  req.end();
});


// Register the router
app.use(router);

// Finally starts the server.
app.listen(options.port);
console.log("Server listening on: http://localhost:%s", options.port);
