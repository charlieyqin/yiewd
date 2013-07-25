yiewd
=====

A [Wd.js](https://github.com/admc/wd) wrapper that uses V8's new generators for
cleaner code! It's called `yiewd` because it uses the new `yield` syntax with
`wd`. `yield` + `wd` = `yiewd`. Right?

The problem
-----------
Let's say we want to write a webdriver test:

```js
var wd = require('wd')
  , driver = wd.remote();

driver.init(desiredCaps, function(err, sessionId) {
  if (err) return postTest(err);
  driver.get("http://mysite.com", function(err) {
    if (err) return postTest(err);
    driver.elementById("someId", function(err, el) {
      if (err) return postTest(err);
      el.click(function(err) {
        if (err) return postTest(err);
        driver.elementById("anotherThing", function(err, el2) {
          if (err) return postTest(err);
          el2.text(function(err, text) {
            if (err) return postTest(err);
            text.should.equal("What the text should be");
            driver.quit(postTest);
          });
        });
      });
    });
  });
});
```

Yeah, that sucks. Look at that callback pyramid! Look at all those error checks!

The solution
------------

Let's all be a little more sane, shall we?

```js
var wd = require('yiewd');

wd.remote(function*(driver) {
  var sessionId, el, el2, text;
  sessionId = yield driver.init(desiredCaps);
  yield driver.get("http://mysite.com");
  el = driver.elementById("someId");
  yield el.click();
  el2 = driver.elementById("anotherThing")
  text = yield el2.text();
  text.should.equal("What the text should be");
  yield driver.quit();
});
```

Isn't that awesome?

How it works
------------

Basically, you pass a generator to `wd.remote`. This generator receives
a driver object. Now, anytime you would have had a callback, just yield the
function. If anything would have been passed as an argument to the callback,
you'll get it as the assignment to yield.

It takes a slight change of thought, but it's so much better than callbacks.

Enjoy!

Integrating with test suites
----------------------------

It's relatively easy to break up bits of sessions between testcases and so on. Here's what a simple mocha test suite could look like:

```js
describe('my cool feature', function() {
  var driver = null;  // driver object used across testcases

  // global setUp, tearDown
  before(function(done) {
    yiewd.remote(function*(d) {
      driver = d;
      yield driver.init(desiredCaps);
      done();
    });
  });
  after(function(done) {
    driver.run(function*() {
      yield driver.quit();
      done();
    });
  });

  it('should do some thing', function(done) {
    driver.run(function*() {
      // test logic
      done();
    });
  });

  it('should do another thing', function(done) {
    driver.run(function*() {
      // test logic
      done();
    });
  });
});
```

Essentially, if you have a `driver` object originally passed into the generator
argument to `yiewd.remote()`, you can use `driver.run()` and pass it another
generator which will take over execution for the driver. Easy!

Requirements
------------
* Node &gt;= 0.11.3 (one with generators)
* Make sure you start your test runner with the `--harmony` flag; this might
  be non-trivial but for mocha, see below.

Run the Tests
-----
Make sure you have your chromedriver-enabled Selenium server running, then:

```
mocha -R spec -t 60000 --harmony test/
```
