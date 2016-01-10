var RedisSMQ = require("rsmq");
var rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "rsmq"} );

function sendMessage() {
  var msg = getMessage();
  var msg = msg.toString()
  rsmq.sendMessage({qname: 'messages', message: msg}, function (err, resp) {
    if (resp) {
      console.log('Message sent body: ', msg);
    }
  });
};

function getMessage(){
  this.cnt = this.cnt || 0;
  return this.cnt++;
};

module.exports = sendMessage;
