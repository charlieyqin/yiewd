"use strict";
var wd = require("wd")
  , _ = require("underscore")
  , wdUtils = require("../node_modules/wd/lib/utils")
  , apsc = function(obj) { return Array.prototype.slice.call(obj, 0); };

var yiewd = module.exports = {};

yiewd.remote = function() {
  var args = apsc(arguments);
  var gen = args.pop();
  var d = new Driver(gen);
  d._setInnerDriver(wd.remote.apply(wd, args));
};

var Driver = function(generator) {
  this.driver = null;
  this.generator = generator;
  this.iterator = null;
};

Driver.prototype._setInnerDriver = function(driver) {
  this.driver = driver;
  this.iterator = this.generator(this);

  _.each(this.getDriverMethods(), function(cbMethod) {
    this[cbMethod] = function() {
      var args = apsc(arguments, 0);
      var cb = function() {
        var innerArgs = apsc(arguments, 0);
        var res;
        if (innerArgs.length === 0) {
          var err = new Error("Didn't get node-style cb");
          this.iterator.throw(err);
          return;
        } else if (innerArgs.length === 1 && innerArgs[0] !== null) {
          this.iterator.throw(innerArgs[0]);
          return;
        } else if (innerArgs.length === 2) {
          res = innerArgs[1];
        } else {
          res = innerArgs;
        }
        this.iterator.next(res);
      }.bind(this);
      args.push(cb);
      this.driver[cbMethod].apply(this.driver, args);
    }.bind(this);
  }.bind(this));

  _.each(this.getDriverSyncMethods(), function(method) {
    this[method] = function() {
      var args = apsc(arguments, 0);
      return this.driver[method].apply(this.driver, args);
    }.bind(this);
  }.bind(this));

  this.iterator.next();
};

Driver.prototype.run = function(generator) {
  this.generator = generator;
  this.iterator = this.generator();
  this.iterator.next();
};

Driver.prototype.getDriverMethods = function() {
  var methods = [
    'init'
    , 'quit'
    , 'status'
    , 'sessions'
    , 'sessionCapabilities'
    , 'newWindow'
    , 'window'
    , 'windowName'
    , 'windowHandles'
    , 'windowHandle'
    , 'get'
    , 'title'

    // not yet tested
    , 'close'
    , 'frame'
    , 'eval'
    , 'safeEval'
    , 'execute'
    , 'safeExecute'
    , 'executeAsync'
    , 'safeExecuteAsync'
    , 'refresh'
    , 'maximize'
    , 'windowSize'
    , 'getWindowSize'
    , 'setWindowSize'
    , 'getWindowPosition'
    , 'setWindowPosition'
    , 'forward'
    , 'back'
    , 'setImplicitWaitTimeout'
    , 'setAsyncScriptTimeout'
    , 'setPageLoadTimeout'
    , 'element'
    , 'elementOrNull'
    , 'elementIfExists'
    , 'elements'
    , 'hasElement'
    , 'waitForElement'
    , 'waitForVisible'
    , 'takeScreenshot'
    , 'getTagName'
    , 'flick'
    , 'buttonDown'
    , 'buttonUp'
    , 'moveTo'
    , 'click'
    , 'doubleclick'
    , 'type'
    , 'keys'
    , 'source'
    , 'alertText'
    , 'alertKeys'
    , 'acceptAlert'
    , 'dismissAlert'
    , 'active'
    , 'url'
    , 'allCookies'
    , 'setCookie'
    , 'deleteAllCookies'
    , 'deleteCookie'
    , 'getOrientation'
    , 'setOrientation'
    , 'setLocalStorageKey'
    , 'getLocalStorageKey'
    , 'removeLocalStorageKey'
    , 'clearLocalStorage'
    , 'uploadFile'
    , 'waitForConditionInBrowser'
  ];
  _.each(wdUtils.elementFuncTypes, function(type) {
    methods.push("elementBy" + wdUtils.elFuncSuffix(type));
    methods.push("elementBy" + wdUtils.elFuncSuffix(type) + "OrNull");
    methods.push("elementBy" + wdUtils.elFuncSuffix(type) + "IfExists");
    methods.push("hasElement" + wdUtils.elFuncSuffix(type));
    methods.push("waitForElement" + wdUtils.elFuncSuffix(type));
    methods.push("waitForVisible" + wdUtils.elFuncSuffix(type));
    methods.push("elementsBy" + wdUtils.elFuncSuffix(type));
  });
  return methods;
};

Driver.prototype.getDriverSyncMethods = function() {
  return [
    // not yet tested
    'setHTTPInactivityTimeout'
  ];
};