var RedisSMQ = require("rsmq");
var rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "rsmq"} );
var async  = require('async');

function receiveMessages() {
  console.log('run as message receiever');

  function eventHandler(msg, callback) {
    function onComplete() {
      var error = Math.random() > 0.85;
      callback(error, msg);
    };

    setTimeout(onComplete, Math.floor(Math.random()*1000));
  };

  function receiveMessage(callback) {
    qname = 'messages';
    rsmq.receiveMessage({qname: qname}, function (err, resp) {
      if (err) return callback(err);

      if (resp.id) {
        msg = resp.message;

        eventHandler(msg, function(error, msg) {
          if (error == true) {
            sendToErrorsQueue(msg);
          } else {
            console.log("Message received:", msg);
          }
        });
        callback(null, resp.id);
      }
    });
  };

  function deleteMessage(id, callback) {
    if (!id) return

    rsmq.deleteMessage({qname: "messages", id: id}, function (err, resp) {
      if (resp===1) {
        console.log("Message deleted:" + msg);
      }
    });
  };

  function sendToErrorsQueue(msg) {
    rsmq.sendMessage({qname: "errors", message: msg}, function (err, resp) {
      if (resp) {
        console.log("Send to errors queue:", msg);
      }
    });
  };

  function handleMessage() {
    async.waterfall([
      receiveMessage,
      deleteMessage
    ], function(err) {
      if (err) return next(err);
    });
  };

  var timerId = setInterval(handleMessage, 100);
}

receiveMessages();
