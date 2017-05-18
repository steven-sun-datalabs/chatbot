/*
Copyright © 2016 ServiceNow, Inc.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
 * This is a re-usable module to do tasks related operations with ServiceNow instance.
 */

module.exports = Task;

function Task(snInstanceURL, snCookie, options) {
    this.snInstanceURL = snInstanceURL;
    this.snCookie = snCookie;
    this.options = options;
}

// Returns a single (or most recent) incident back to the user
Task.prototype.getIncident = function (callBack) {
  var request = require('request');
  request({
      baseUrl: this.snInstanceURL,
      method: 'GET',
      uri: '/api/now/table/incident?sysparm_query=active%3Dfalse%5Ecaller_id.employee_number%3D1057914&sysparm_display_value=true&sysparm_fields=number%2C%20short_description%2Csys_updated_on%2Cu_state&sysparm_limit=10',
      json: true,
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cookie': this.snCookie
      }

  }, function (err, response, body) {
      callBack(err, response, body);
  });
}

//
Task.prototype.getIncidents = function (callBack) {
    var request = require('request');
    request({
        baseUrl: this.snInstanceURL,
        method: 'GET',
        uri: '/api/now/table/incident?sysparm_query=active%3Dfalse%5Ecaller_id.employee_number%3D1057914&sysparm_display_value=true&sysparm_fields=number%2C%20short_description%2Csys_updated_on%2Cu_state&sysparm_limit=1',
        json: true,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cookie': this.snCookie
        }

    }, function (err, response, body) {
        callBack(err, response, body);
    });
}

Task.prototype.getTicket = function (callBack) {
    var request = require('request');
    request({
        baseUrl: this.snInstanceURL,
        method: 'GET',
        uri: '/api/table/ticket?sysparm_display_value=true&sysparm_exclude_reference_link=true&sysparm_suppress_pagination_header=true&sysparm_fields=number%2Cu_last_attached_date%2Cu_status%2Cu_current_support_level%2Curgency%2Cdescription&sysparm_limit=1'
        json: true,
        headers: {
            'Cookie': this.snCookie
        }

    }, function (err, response, body) {
        callBack(err, response, body);
    });
}

Task.prototype.getTickets = function (callBack) {
    var request = require('request');
    request({
        baseUrl: this.snInstanceURL,
        method: 'GET',
        uri: '/api/table/ticket?sysparm_display_value=true&sysparm_exclude_reference_link=true&sysparm_suppress_pagination_header=true&sysparm_fields=number%2Cu_last_attached_date%2Cu_status%2Cu_current_support_level%2Curgency%2Cdescription&sysparm_limit=10',
        json: true,
        headers: {
            'Cookie': this.snCookie
        }

    }, function (err, response, body) {
        callBack(err, response, body);
    });
}

}
