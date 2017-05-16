# Apigee Chatbot (to either be ported directly to server or packaged into custom plug-in) : Node.js
This project contains source code for a [Node.js](https://nodejs.org/) server that interacts with ServiceNow's [REST APIs](https://docs.servicenow.com/bundle/helsinki-servicenow-platform/page/integrate/inbound_rest/concept/c_RESTAPI.html) including a [Scripted REST API](https://docs.servicenow.com/bundle/helsinki-servicenow-platform/page/integrate/custom_web_services/concept/c_CustomWebServices.html) as well as API.ai's intent identification engine. The simple use case is an end-to-end chatbot application which identifies user intents and returns queries from ServiceNow matching those intents.

## Prerequisites
* [Node.js](https://nodejs.org/) installed
* A ServiceNow instance ([Geneva Patch 3](https://docs.servicenow.com/bundle/geneva-release-notes/page/c2/geneva-patch-3-2.html) or later).
* An instance of API.ai is iinstalled

--------------------------------------------------------------------------

## Install the Node.js project on your host. This could be your laptop or a server where you have installed Node.js.
1. Clone the project and install dependencies
	* Git clone
	```bash
	$ cd chatbot-directory
	$ npm install
	```

2. Install the **MyWork Update Set** in your ServiceNow instance. This is a ServiceNow scoped application which contains the **Task Tracker API** Scripted REST API and related files. Note that you must have the admin role on your ServiceNow instance to install update sets.
	1. Obtain the "My Work" update set
		* Download the update set from [share.servicenow.com](https://share.servicenow.com/app.do#/detailV2/e43cf2f313de5600e77a36666144b0b4/overview)
<br/>--or--
		* Get the update set from the directory where you cloned the GitHub repository: **example-restclient-myworkapp-nodejs/mywork_update_set/sys_remote_update_set_2f48a7d74f4652002fa02f1e0210c785.xml**
	2. Install the Update Set XML
		1. In your ServiceNow instance, navigate to **Retrieved Update Sets**
		2. Click **Import Update Set from XML**
		3. Click **Choose File**, browse to find the downloaded update set XML file from Step 1, and click **Upload**
		4. Click to open the **My Work** update set
		5. Click **Preview Update Set**
		6. Click **Commit Update Set**
	3. Verify the MyWork Update Set installed using the API Explorer
		1. In your ServiceNow instance, navigate to **Scripted REST APIs**
		2. Open the **Task Tracker** Scripted REST API, then open the **My Tasks** API resource
		3. Click **Explore REST API** (this opens the API in the REST API Explorer)
		4. In the API Explorer, click **Send** and verify the API request is sent and receives a **200-OK** response

--------------------------------------------------------------------------

## Running the Node.js application
Start the Node.js server
```bash
$ cd example-restclient-myworkapp-nodejs
$ node server.js
Server listening on: http://localhost:3000

```

By default the Node application will listen for requests on localhost port 3000. Navigate in your web browser to [http://localhost:3000](http://localhost:3000) and you should see the login screen for the My Work application.

To run the server on a different port, use the `--port=xxxx` option
```bash
$ node server.js --port=8080
Server listening on: http://localhost:8080
```

For more information about available options, use --help
```bash
$ node server.js --help

Usage: node server.js [ -h ] [ -p <port> ] [ -v ]
   -h, --help                  Show this usage help
   -p <port>, --port=<port>    HTTP server listen port (default 3000)
   -v, --verbose               Verbose HTTP output
$
```

--------------------------------------------------------------------------

## About the application
In this application, the client speaks via SMS (handled with Twilio) to the server. The server passes this message to API.ai, which identifies intent. Based on intent, a call to the servicenow developer instance is made.

Server side, the Node application uses the **Task Tracker** Scripted REST API to get the list of tasks assigned to the logged-in user. Dispatchers handle interaction between Node and the ServiceNow instance.

#### Session management
Three types of sessions are managed by the application, between:
* Twilio and Node.js server
* API.ai and Node.js server
* Node.js server and ServiceNow instance

--------------------------------------------------------------------------

## Sample REST API requests/responses

### 1. Login/retrieve user account
The initial request to ServiceNow submits the user credentials and retrieves the user account. This establishes a session with ServiceNow which can be maintained by saving and resending the cookies returned from the first request.

Here is an equivalent sample curl request. It saves the response cookies in a new file called cookies.txt. The same file is specified on subsequent request in order to apply all cookies.
```
$ curl --verbose --request GET \
--header "Accept: application/json" \
--user "john.doe:password" --cookie cookies.txt --cookie-jar cookies.txt \
 "https://myinstance.service-now.com/api/now/v2/table/sys_user?user_name=john.doe&sysparm_fields=user_name,first_name,last_name,sys_id"

> GET /api/now/v2/table/sys_user?user_name=john.doe&sysparm_fields=user_name,first_name,last_name,sys_id HTTP/1.1
> Authorization: Basic am9obi5kb2U6cGFzc3dvcmQ=
> Host: myinstance.service-now.com
> Accept: application/json

< HTTP/1.1 200 OK
< Set-Cookie: JSESSIONID=3BFF4F3A8AC5F4695E0477F6F8E34BDE;Secure; Path=/; HttpOnly
< Set-Cookie: glide_user="";secure; Expires=Thu, 01-Jan-1970 00:00:10 GMT; Path=/; HttpOnly
< Set-Cookie: glide_user_session="";secure; Expires=Thu, 01-Jan-1970 00:00:10 GMT; Path=/; HttpOnly
< Set-Cookie: glide_user_route=glide.787db27f9eb4d8275f143168c5481c86;secure; Expires=Mon, 27-Mar-2084 19:32:44 GMT; Path=/; HttpOnly
< Set-Cookie: glide_session_store=292391354F4212008A5AB895F110C722; Expires=Wed, 09-Mar-2016 16:48:37 GMT; Path=/; HttpOnly
< Set-Cookie: BIGipServerpool_myinstance=2927640842.52542.0000; path=/
< X-Total-Count: 1
< Pragma: no-store,no-cache
< Cache-control: no-cache,no-store,must-revalidate,max-age=-1
< Expires: 0
< Content-Type: application/json;charset=UTF-8
< Transfer-Encoding: chunked
{
  "result": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "sys_id": "ea2bc1b14f4212008a5ab895f110c7d1",
      "user_name": "john.doe"
    }
  ]
}
```

### 2. Get user's tasks
Next, the user's tasks are retrieved. Note how the cookies from the first request are sent with subsequent requests, and user credentials no longer need to be sent:
```
$ curl --verbose --request GET \
--header "Accept: application/json" \
--cookie cookies.txt --cookie-jar cookies.txt \
 "https://myinstance.service-now.com/api/x_snc_my_work/v1/tracker/task"

> GET /api/x_snc_my_work/v1/tracker/task HTTP/1.1
> Host: myinstance.service-now.com
> Cookie: BIGipServerpool_myinstance=2927640842.52542.0000; JSESSIONID=3BFF4F3A8AC5F4695E0477F6F8E34BDE; glide_session_store=292391354F4212008A5AB895F110C722; glide_user_route=glide.787db27f9eb4d8275f143168c5481c86
> Accept: application/json

< HTTP/1.1 200 OK
< Set-Cookie: glide_user="U0N2Mjo1ODczMTEzNTIxNDIxMjAwOWE3NDgyZDFlZjg3Mzk4OQ==";Secure; Version=1; Max-Age=2147483647; Expires=Mon, 27-Mar-2084 19:34:00 GMT; Path=/; HttpOnly
< Set-Cookie: glide_user_session="U0N2Mjo1ODczMTEzNTIxNDIxMjAwOWE3NDgyZDFlZjg3Mzk4OQ==";Secure; Version=1; Path=/; HttpOnly
< Set-Cookie: glide_session_store=292391354F4212008A5AB895F110C722; Expires=Wed, 09-Mar-2016 16:24:53 GMT; Path=/; HttpOnly
< Pragma: no-store,no-cache
< Cache-control: no-cache,no-store,must-revalidate,max-age=-1
< Expires: 0
< Content-Type: application/json;charset=UTF-8
< Transfer-Encoding: chunked
{
  "result": {
    "Incident": [
      {
        "short_desc": "my computer doesn't work",
        "snowui": "https://myinstance.service-now.com/incident.do?sys_id=061c92d26f030200d7aecd9c5d3ee4f8",
        "number": "INC0010021",
        "sys_id": "061c92d26f030200d7aecd9c5d3ee4f8",
        "link": "https://myinstance.service-now.com/api/now/v2/table/incident/061c92d26f030200d7aecd9c5d3ee4f8",
        "created": "2015-10-14 07:45:55"
      }
    ],
    "Problem": [
      {
        "short_desc": "Unknown source of outage",
        "snowui": "https://myinstance.service-now.com/problem.do?sys_id=d7296d02c0a801670085e737da016e70",
        "number": "PRB0000011",
        "sys_id": "d7296d02c0a801670085e737da016e70",
        "link": "https://myinstance.service-now.com/api/now/v2/table/problem/d7296d02c0a801670085e737da016e70",
        "created": "2014-02-04 04:58:15"
      },
      {
        "short_desc": "Getting NPE stack trace accessing link",
        "snowui": "https://myinstance.service-now.com/problem.do?sys_id=fb9620914fc212008a5ab895f110c7c4",
        "number": "PRB0040010",
        "sys_id": "fb9620914fc212008a5ab895f110c7c4",
        "link": "https://myinstance.service-now.com/api/now/v2/table/problem/fb9620914fc212008a5ab895f110c7c4",
        "created": "2016-03-07 23:47:43"
      }
    ]
  }
}
```

### 3. Add a comment
To add a comment, send a POST request with a JSON payload using the Task Tracker API.

```
$ curl --verbose --request POST \
--header "Accept: application/json" --header "Content-Type: application/json" \
--cookie cookies.txt --cookie-jar cookies.txt \
--data '{"comment":"Hello, world!"}' \
 "https://myinstance.service-now.com/api/x_snc_my_work/v1/tracker/task/d7296d02c0a801670085e737da016e70/comment"

> POST /api/x_snc_my_work/v1/tracker/task/d7296d02c0a801670085e737da016e70/comment HTTP/1.1
> Host: myinstance.service-now.com
> Cookie: BIGipServerpool_myinstance=2927640842.52542.0000; JSESSIONID=3BFF4F3A8AC5F4695E0477F6F8E34BDE; glide_session_store=292391354F4212008A5AB895F110C722; glide_user="U0N2Mjo1ODczMTEzNTIxNDIxMjAwOWE3NDgyZDFlZjg3Mzk4OQ=="; glide_user_route=glide.787db27f9eb4d8275f143168c5481c86; glide_user_session="U0N2Mjo1ODczMTEzNTIxNDIxMjAwOWE3NDgyZDFlZjg3Mzk4OQ=="
> Accept: application/json
> Content-Type: application/json
> Content-Length: 27
{"comment":"Hello, world!"}

< HTTP/1.1 201 Created
< Set-Cookie: glide_session_store=292391354F4212008A5AB895F110C722; Expires=Wed, 09-Mar-2016 16:29:58 GMT; Path=/; HttpOnly
< Content-Type: application/json
< Transfer-Encoding: chunked
{
  "data": "Successfully inserted"
}
```
