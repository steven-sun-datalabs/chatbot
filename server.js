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
router.post('/login', loginDispatcher.login);
router.get('/tasks', taskDispatcher.getTasks);
router.get('/task/:taskid/comments', taskDispatcher.getComments);
router.delete('/logout', function(req, res) {
    req.session.destroy();
    res.end("Deleted");
});

// load the modules
var BasicAuth = require('../sn_api/basicAuth');
var Task = require('../sn_api/task');

// FOR POC ONLY:
// Preset basic read access to admin


// set your ServiceNow instance uri, username and password. Make sure you have installed the MyTasks service.
/*
var client = new BasicAuth('https://jnjacoriosandbox.service-now.com', 'apigee-user', 'Apigee#2017');
client.authenticate(function(err, response, body, cookie) {
	var client = new Task('https://jnjacoriosandbox.service-now.com', cookie);
	client.getTasks(function(err, response, body) {
	    console.log(JSON.stringify(body).substring(1,1500));
	});
});
*/
// Introductory response message to prompt the authentication details for the given user
// Turn this into function to iterate until successful log-in or give up on 5th try
var jjwwid = "";
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

// Evaluate intent received from api.ai and send corresponding GET request to ServiceNow

app.post("/sms", function (request, response) {
  //print out the body from twilio
  //console.log(request.body);

  // Configures request (gives sessionID #) to API.AI

  var req = appapiai.textRequest(request.body.Body, {
      'sessionId': 123456 //not sure if this needs to be changed????
    });

  //
  req.on('response', function(res) {
    //decide if it needs more info, send it back to twilio, otherwise forward it to servicenow
    // sudo code

      var textMessage = 'Something Went Wrong';

      if(req.result.fulfillment.speech == 'Okay')
      {
        /*
        var client = new BasicAuth('https://jnjacoriosandbox.service-now.com', 'apigee-user', 'Apigee#2017');
        client.authenticate(function(err, response1, body, cookie) {
        	var client = new Task('https://jnjacoriosandbox.service-now.com', cookie);
        	client.getTasks(function(err, response1, body) {
        	    console.log(JSON.stringify(body));
              textMessage = JSON.stringify(body).substring(1,1500);

              textMessage = parseIntent(res.result.metadata.intentName, res.result.parameters.RequestedItem, body);

              response.send("<Response><Message>" + textMessage + "</Message></Response>");



        	});
        });
        */
        textMessage = parseIntent(res.result.metadata.intentName, res.result.parameters.RequestedItem, body);

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

function parseIntent(intent, item, body){
  textMessage = 'Something Went Wrong';
  switch (intent) {
    case 'RequestAll':
      if(item == 'Incident')
      {
        //get results for all incidents
        //set textMessage to the response from the get
        console.log('All Incidents');
        textMessage = 'All Incidents'; //getIncidents(body, 5);
      }
      else if (item == 'Ticket')
      {
        //get results for all tickets
        //set textMessage to the response from the get
        console.log('All Tickets');
        textMessage = 'All Tickets'; //getTickets(body,5);
      }
      break;

    case 'RequestOne':
      if(item == 'Incident')
      {
        //get info on incident for number res.result.paramenters.number
        //set textMessage to the response from the get
        console.log('One Incident');
        textMessage = 'One Incident'; //getIncidents(body, 1);
      }
      else if (item == 'Ticket')
      {
        //get info on ticket for number res.result.paramenters.number
        //set textMessage to the response from the get
        console.log('One Ticket');
        textMessage = 'One Ticket'; //getTickets(body, 1);
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

function getTickets(body, number){
  retVal = '';
  //temp for parsing the full Json
  for(var i = 0; i &lt; number; i++){
    //grab the first ticket in body, then set body equal to the substring of everything after the ticket
  }
  return retVal;
}

function getIncidents(body, number){
  retVal = '';
  //temp for parsing the full Json
  for(var i = 0; i &lt; number; i++){
    //grab the first incident in body, then set body equal to the substring of everything after the incident
  }
  return retVal;
}

// Register the router
app.use(router);

// Finally starts the server.
app.listen(options.port);
console.log("Server listening on: http://localhost:%s", options.port);
