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
var path = require('path');
var session = require('client-sessions');
var http = require('http');
var bodyParser = require('body-parser');

// Dispatchers
var taskDispatcher = require('./dispatcher/taskDispatcher');
var loginDispatcher = require('./dispatcher/loginDispatcher');

// Authorization between apiai and server
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
//router.post('/login', loginDispatcher.login);
//router.get('/tasks', taskDispatcher.getIncident);
//router.get('/tasks', taskDispatcher.getIncidents);
//router.get('/tasks', taskDispatcher.getTicket);
//router.get('/tasks', taskDispatcher.getTickets);
router.delete('/logout', function(req, res) {
    req.session.destroy();
    res.end("Deleted");
});

// load the Auth and Task modules
var BasicAuth = require('./sn_api/basicAuth');
var Task = require('./sn_api/task');

// establish authorization credentials into jandj sandbox
var client = new BasicAuth('https://jnjacoriosandbox.service-now.com', 'apigee-user', 'Apigee#2017');

// FOR POC ONLY:
// Preset basic read access to admin

// Introductory response message to prompt the authentication details for the given user
// Turn this into function to iterate until successful log-in or give up on 5th try
/*
app.post("/sms", function (request, response) {

  var textMessage = 'Thanks for messaging the J&J Chatbot! To help us help you, please respond with your J&J WWID';
  req.on('response', function(res) {
    jjwid = res.result.parameters.RequestedItem;
    //send auth to ServiceNow

    if(jjwid) {
      client.authenticate(function(err, response, body, cookie) {
    }
  });
  //respond to twilio with the response from apiai
  req.on('error', function(error) {
    console.log(error);
    response.send("<Response><Message>" + "It seems there's been an error, try again" + "</Message></Response>");

  });
  req.end();
});
*/

//


// Evaluate intent received from api.ai and send corresponding GET request to ServiceNow
app.post("/sms", function (request, response) {
  //print out the body from twilio
  //console.log(request.body);

  // Configures request (gives sessionID #) to API.AI
  var req = appapiai.textRequest(request.body.Body, {
          'sessionId': 123456 //not sure if this needs to be changed????
    });

  // If response from API.AI is "Okay", identify the intent and match to corresponding GET request
  // else send back fullfilment text from API.AI

  req.on('response', function(res) {

    var textMessage = 'parse test';

    if(res.result.fulfillment.speech == 'Okay')
    {
      parseIntent(res.result.metadata.intentName, res.result.parameters.RequestedItem);
      // Figure out asynchronous issue
      response.send("<Response><Message>" + textMessage + "</Message></Response>");
    }
    else
    {
      response.send("<Response><Message>" + res.result.fulfillment.speech + "</Message></Response>");
    }

  //print out the response from apiai
  console.log(res);
  });

  req.on('error', function(error) {
    console.log(error);
  });

  req.end();

});


function parseIntent(intent, item){
  textMessage = 'We are still testing this part';
  switch (intent) {
    case 'RequestAll':
      if(item == 'Incident') // GET request for 10 Incidents
      {
        client.authenticate(function(err, responseClient, body, cookie) {
          var client = new Task('https://jnjacoriosandbox.service-now.com', cookie);
          client.getIncidents(function(err, responseClient, body) {
            textMessage = JSON.stringify(body); //set textMessage to the response from the GET
            console.log(JSON.stringify(body));
            console.log('All Incidents');
            });
          });
      }
      else if (item == 'Ticket') // GET requests for 10 Tickets
      {
        client.authenticate(function(err, responseClient, body, cookie) {
          var client = new Task('https://jnjacoriosandbox.service-now.com', cookie);
          client.getTickets(function(err, responseClient, body) {
            textMessage = JSON.stringify(body);
            console.log(JSON.stringify(body));
            console.log('All Tickets');
            });
          });
      }
      break;

    case 'RequestOne':
      if(item == 'Incident')
      {
        //get info on incident for number res.result.paramenters.number
        //set textMessage to the response from the get
        client.authenticate(function(err, responseClient, body, cookie) {
          var client = new Task('https://jnjacoriosandbox.service-now.com', cookie);
          client.getIncident(function(err, responseClient, body) {
            textMessage = JSON.stringify(body);
            console.log(JSON.stringify(body));
            console.log('All Tickets');


          });
        });
        console.log('One Incident');
        textMessage = 'One Incident'; //getIncidents(body, 1);
      }
      else if (item == 'Ticket')
      {
        //get info on ticket for number res.result.paramenters.number
        //set textMessage to the response from the get
        client.authenticate(function(err, responseClient, body, cookie) {
          var client = new Task('https://jnjacoriosandbox.service-now.com', cookie);
          client.getTicket(function(err, responseClient, body) {
            textMessage = JSON.stringify(body);
            console.log(JSON.stringify(body));
            console.log('One Ticket');
          });
        });
      }
      break;

    case 'knowledgeSearch':
      //Get link from search
      //set textMessage to the response from the get
      console.log('Search');
      textMessage = 'Search'; //something else;
      break;

    case apiaiDefaultIntent:
      break;
  }

  return textMessage;
}

// Register the router
app.use(router);

// Finally starts the server.
app.listen(options.port);
console.log("Server listening on: http://localhost:%s", options.port);
