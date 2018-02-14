// Local event based client for alexa
//
// Generates events for each Alexa Skill message
//
var mqtt = require('mqtt');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('alexaLocal');

var Validator = require('jsonschema').Validator;
var v = new Validator();
var alexaSchema = require('./alexa_smart_home_message_schema.json');
var connection = {};

inherits(alexaLocalClient, EventEmitter);

module.exports = {
  alexaLocalClient: alexaLocalClient
};

function alexaLocalClient(options) {

  debug("Connecting to homebridge-alexa");
  connection.client = mqtt.connect(options);
  connection.client.setMaxListeners(0);

  connection.client.on('connect', function() {

    debug('connect', "command/" + options.username + "/#");
    connection.client.removeAllListeners('message');    // This hangs up everyone on the channel
    connection.client.subscribe("command/" + options.username + "/#");
    connection.client.on('message', function(topic, message) {
      var msg = JSON.parse(message.toString());

  //    debug("Count", this.listenerCount(msg.directive.header.namespace.toLowerCase()));
      if (this.listenerCount(msg.directive.header.namespace.toLowerCase()) > 0) {
        debug('Emitting', msg.directive.header.namespace.toLowerCase());
        this.emit(msg.directive.header.namespace.toLowerCase(), msg, function(err, response) {

          // TODO: Add message validation
          //        v.addSchema(alexaSchema);
          //        debug(v.validate(response));
          connection.client.publish("response/1", JSON.stringify(response));
        });

      } else {

        debug('No listener for', msg.directive.header.namespace.toLowerCase());
        connection.client.publish("response/1", _alexaErrorResponse(msg));

      }

    }.bind(this));
  }.bind(this));

  connection.client.on('offline', function() {
    debug('offline');
  });

  connection.client.on('reconnect', function() {
    debug('reconnect');
  });

  connection.client.on('error', function(err) {
    debug('error', err);
  });

}

function _alexaErrorResponse(message) {

  var response = {
    "event": {
      "header": {
        "name": "ErrorResponse",
        "namespace": message.directive.header.namespace,
        "payloadVersion": "3",
        "messageId": message.directive.header.messageId
      },
      "payload": {
        "endpoints": []
      }
    }
  }
  return( JSON.stringify(response));
};