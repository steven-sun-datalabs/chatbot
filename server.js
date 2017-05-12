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
app.use(bodyParser.urlencoded({extended: false}));

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
router.delete('/logout', function(req, res) {
    req.session.destroy();
    res.end("Deleted");
});

//router.post('/task/:taskid/comments', taskDispatcher.addComment);

app.post("/sms", function (request, response) {
  //print out the body from twilio
  //console.log(request.body);

  //send the text from twilio to apiai
  var req = appapiai.textRequest(request.body.Body, {
    'sessionId': 123456 //not sure if this needs to be changed????
  });
  //wait for response from apiai

<<<<<<< HEAD
	req.on('response', function(res) {

    switch(intent)

=======
  req.on('response', function(res) {
>>>>>>> 929fc3eeb50b5a48436698d606b1538fda0a9886
    //decide if it needs more info, send it back to twilio, otherwise forward it to servicenow
    // sudo code
      if(res.result.fulfillment.speech == 'Okay')
      {
        var textMessage = 'Something Went Wrong';
        switch (res.result.metadata.intentName) {
          case 'RequestAll':
            if(res.result.parameters.RequestedItem == 'Incident')
            {
              //get results for all incidents
              //set textMessage to the response from the get
              console.log('All Incidents');
              textMessage = 'All Incidents';
            }
            else if (res.result.parameters.RequestedItem == 'Ticket')
            {
              //get results for all tickets
              //set textMessage to the response from the get
              console.log('All Tickets');
              textMessage = 'All Tickets';
            }
            break;

          case 'RequestOne':
            if(res.result.parameters.RequestedItem == 'Incident')
            {
              //get info on incident for number res.result.paramenters.number
              //set textMessage to the response from the get
              console.log('One Incident');
              textMessage = 'One Incident';
            }
            else if (res.result.parameters.RequestedItem == 'Ticket')
            {
              //get info on ticket for number res.result.paramenters.number
              //set textMessage to the response from the get
              console.log('One Ticket');
              textMessage = 'One Ticket';
            }
            break;

          case 'knowledgeSearch':
            //Get link from search
            //set textMessage to the response from the get
            console.log('Search');
            textMessage = 'Search';
            break;

          case apiaiDefaultIntent:
            break;
        }
        response.send("<Response><Message>" + textMessage + "</Message></Response>");

      }
      else
      {
        response.send("<Response><Message>" + res.result.fulfillment.speech + "</Message></Response>");
      }

    //
    //respond to twilio with the response from apiai

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
