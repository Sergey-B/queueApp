var minimist = require ('minimist')
var RedisSMQ = require("rsmq");
var rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "rsmq"} );
var async = require('async');
var _ = require ('underscore')

var args = minimist(process.argv.slice(2), {
  string: 'getErrors'
});
if (_.includes(args._, 'getErrors')) {
  showErrors();
}

function showErrors() {
  function getMsgsCount(callback) {
    var msgsCount;

    rsmq.getQueueAttributes({qname: 'errors'}, function(err, resp){
      if (!resp) return;

      msgsCount = resp.msgs;
      callback(null, msgsCount);
    });
  }

  function fetchAllMsgs(cnt, callback) {
    if (cnt === 0) {
      callback(null, [])
    }

    var messages = [];

    for (var i = 0, l = cnt; i < l; i ++) {
      rsmq.receiveMessage({qname: 'errors'}, function(err, resp) {
        if (err) return callback(err);

        if (resp) {
          messages.push(resp);
          del(resp.id);

          if (messages.length === cnt) {
            callback(null, messages);
          }
        }
      });
    }
  }

  function del(id) {
    rsmq.deleteMessage({qname: 'errors', id: id}, function (err, resp) {
      if (err) throw err;
    });
  }

  function prepareMsgs(messages, callback) {
    if (messages === []) {
      callback(null, []);
    }

    var result = _.map(messages, function prepareMsg(msg) {
      return ['Message body: ' + msg.message];
    });
    callback(null, result);
  }

  var tasksIndex = [
    getMsgsCount,
    fetchAllMsgs,
    prepareMsgs
  ];
  async.waterfall(tasksIndex, function (err, result) {
    if (err) return next(err);

    if (_.isEmpty(result)) {
      console.log('Error queue is empty.');
    } else {
      console.log('Error queue contains: ' + '\n\n' + result.join('\n'));
    };

    process.exit();
  })
}
