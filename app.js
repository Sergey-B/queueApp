var minimist = require ('minimist')
var _ = require ('underscore')

var sendMessage = require ('./sender');
var receiveMessage = require ('./receiver')
var showErrors = require('./errors');

var client = require('redis').createClient();
var redislock   = require('redislock');
var lock = redislock.createLock(client, {
  timeout: 1000
});
var LockAcquisitionError = redislock.LockAcquisitionError;

var args = minimist(process.argv.slice(2), {
  string: 'getErrors'
});
if (_.includes(args._, 'getErrors')) {
  showErrors();
}

var receivingMode = false;
var sendingMode = false;
var sendTimerId;
var extendTimerId;
var receiveTimerId;

function quitReceiving() {
}

function startSending() {
  if (sendingMode == true) return;

  sendingMode = true;
  receivingMode = false;

  sendTimerId = setInterval(sendMessage, 500);
  extendTimerId = setInterval(function() {
    lock.extend(1000, function(err) {
      if (err) return console.log(err.message); // 'Lock on app:lock has expired'
    });
  }, 900)
};

function startRecieving() {
  if (receivingMode === true) return;

  receivingMode = true;
  sendingMode = false;

  receiveTimerId = setInterval(function() {
    receiveMessage();
    tryLock();
  }, 500);
};

function tryLock() {
  lock.acquire('app:messages:lock').then(function(err) {
    if (err) return console.log(err.message); // 'Lock already held'

    clearInterval(receiveTimerId);
    startSending();
  }).catch(LockAcquisitionError, function(err) {
    startRecieving();
  });
};

tryLock();
