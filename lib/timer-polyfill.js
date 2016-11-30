/*
 Source is originated from https://github.com/morungos/java-xmlhttprequest

 Articles about Nashorn:
 - https://blog.codecentric.de/en/2014/06/project-nashorn-javascript-jvm-polyglott/
 */
(function nashornEventLoopMain(context) {
  'use strict';

  var Timer = Java.type('java.util.Timer');
  var TimerTask =  Java.type("java.util.TimerTask");
  var HashMap = Java.type('java.util.HashMap');

  var finalException = null;

  var timerMap = new HashMap(1);
  var globalTimerId = 1;

  function newTimer() {
    timer = new Timer('jsEventLoop', false);
  }

  var timer;

  newTimer();

  var onTaskFinished = function () {
  };

  var shutdown = function () {
    timer.cancel();
  };

  function createTimerTask (fn, timerId, args, repeated) {
    return new TimerTask {
      run: function () {
        try {
          fn.apply(context, args);
          if (!repeated) timerMap.remove(timerId);
        } catch (e) {

          // Store the error
          finalException = e;
          console.error(e)
          // Clear the phaser blocks and the timer
          // This drops main to end
          shutdown();
        }
      }
    }
  }

  var setTimeout = function (fn, millis /* [, args...] */) {
    var args = [].slice.call(arguments, 2, arguments.length);

    var timerId = globalTimerId++;
    var task = createTimerTask(fn, timerId, args, false);

    timerMap.put(timerId, task);

    timer.schedule(task, millis);

    return timerId;
  };

  var clearTimeout = function (timerId) {
    var task = timerMap.get(timerId);
    if (task) {
      console.log('before clearTimeout for timerId ' + timerId)
      task.cancel();
      timerMap.remove(timerId)
    }
  };

  var setInterval = function (fn, delay /* [, args...] */) {
    var args = [].slice.call(arguments, 2, arguments.length);

    var timerId = globalTimerId++;
    var task = createTimerTask(fn, timerId, args, true);
    timerMap.put(timerId, task);

    timer.scheduleAtFixedRate(task, delay, delay);

    return timerId;
  };

  var clearInterval = function (timerId) {
    clearTimeout(timerId);
  };

  context.setTimeout = setTimeout;
  context.clearTimeout = clearTimeout;
  context.setInterval = setInterval;
  context.clearInterval = clearInterval;
  context.timerMap = timerMap;
})(typeof global !== "undefined" && global || typeof self !== "undefined" && self || this);