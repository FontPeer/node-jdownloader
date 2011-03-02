(function() {
  var JDownloader, assert, jdownloader, tests, vows;
  vows = require('vows');
  assert = require('assert');
  tests = vows.describe('node-jdownloader')["export"](module);
  JDownloader = require('../lib/jdownloader');
  jdownloader = new JDownloader.Client;
  tests.addBatch({
    'when getting the RemoteControl help page': {
      topic: function() {
        return jdownloader.get_help(this.callback);
      },
      'it should succeed and explain itself': function(err, usage) {
        assert.ifError(err);
        return assert.ok(/\/help/i.test(usage));
      }
    }
  });
}).call(this);
