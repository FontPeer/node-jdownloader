vows    = require 'vows'
assert  = require 'assert'

tests = vows.describe('node-jdownloader').export module

JDownloader = require '../lib/jdownloader'
jdownloader = new JDownloader.Client

tests.addBatch
  'when getting the RemoteControl help page':
    topic: -> jdownloader.get_help @callback
    'it should succeed and explain itself': (err, usage) ->
      assert.ifError err
      assert.ok /\/help/i.test usage


