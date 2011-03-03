vows    = require 'vows'
assert  = require 'assert'

JDownloader = require '../lib/jdownloader'


assert.matches = (actual, regex, message) ->
  if regex instanceof RegExp
    assert.fail(actual, regex, message, '.test', assert.matches) unless regex.test(actual)
  else
    assert.equal actual, regex, message

assert.type = (actual, expected_type, message) ->
  if typeof actual != expected_type
    assert.fail(typeof actual, expected_type, message, '==', assert.type);

is_a = (fn) -> fn
matches   = (regex) -> (actual) -> assert.matches actual, regex
is_typed  = (type)  -> (actual) -> assert.type    actual, type
boolean = is_typed 'boolean'
number  = is_typed  'number'

response = (verifications) ->
  () -> verifications.apply null, arguments

# For async tests, vows wants the topic function to return nothing,
# which is very inconvenient in CoffeeScript. Hence, this helper
call_to = (api_method_name, args...) -> (vows_contexts..., client) ->
  throw new Error "NotImplemented: #{api_method_name}" unless client[api_method_name]
  client[api_method_name](args..., @callback)
  undefined

DOWNLOAD_URL = "http://www.filesonic.com/file/113998031/ubuntu-10.04.1_5in1.part1.rar"

tests = vows.describe('node-jdownloader').export module
tests.addBatch
  "JDownloader's":
    topic: new JDownloader.Client()

    'current speed':
      topic: call_to 'current_speed'
      'is probably 0': (err, speed) ->
        assert.ifError err
        assert.strictEqual speed, 0

    'RemoteControl help page':
      topic: call_to 'help'
      'should mention itself': response matches /JDRemoteControl Help/i

    'IP':
      topic: call_to 'ip'
      'should be well-formed': response matches /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/

    'configuration':
      topic: call_to 'config'
      'should say the RemoteControl plugin is enabled': (err, config) ->
        assert.ok config
        assert.equal config['OPTIONAL_PLUGIN2_remotecontrol'], 'true'

    'reported version':
      topic: call_to 'version'
      'is not very helpful': response matches 'JDownloader'

    'reported RemoteControl plugin version':
      topic: call_to 'rc_version'
      'should be numeric': response matches /[0-9]+/

    'speedlimit ':
      topic: call_to 'get_speedlimit'
      'should be be disabled ;)': (err, speedlimit) ->
        assert.strictEqual speedlimit, '0'

    'autoreconnect setting':
      topic: call_to 'get_autoreconnect'
      'is a boolean': response is_a boolean

    'download status':
      topic: call_to 'download_status'
      'is RUNNING, NOT_RUNNING or STOPPING': (err, status) ->
        switch status
          when 'RUNNING', 'NOT_RUNNING', 'STOPPING'
          else assert.fail status

    'total download count':
      topic: call_to 'downloads_count'
      'is a number': response is_a number

    'current download count':
      topic: call_to 'current_downloads_count'
      'is a number': response is_a number

    'finished download count':
      topic: call_to 'finished_downloads_count'
      'is a number': response is_a number

    'set_download_dir':
      topic: call_to 'set_download_dir', '/tmp'
      'should confirm the new download directory': response matches "PARAM_DOWNLOAD_DIRECTORY=/tmp"

    'enable_reconnect':
      topic: call_to 'enable_reconnect'
      'should confirm the autoreconnect state': response matches "PARAM_ALLOW_RECONNECT=true"

    'check_links':
      topic: call_to('check_links', [DOWNLOAD_URL])
      'should give complete information about the download': (err, result) ->
        assert.ifError err
        assert.equal result[0].url, DOWNLOAD_URL
        file = result[0].files[0]
        assert.equal file.download_url, DOWNLOAD_URL
        assert.equal file.size, '500.00 MiB'
        assert.equal file.package, 'ubuntu-10 04 1 5in1'
        assert.equal file.hoster, 'filesonic.com'
        assert.equal file.available, 'TRUE'

tests.addBatch
  "JDownloader":
    topic: new JDownloader.Client()
    'with an empty download list':
      topic: call_to 'purge_downloads'

      'enable_grabber_autoadding':
        topic: call_to 'enable_grabber_autoadding'
        'should confirm links will be added automatically': response matches 'PARAM_START_AFTER_ADDING_LINKS_AUTO=true'

        'enable_grabber_startafteradding':
          topic: call_to 'enable_grabber_startafteradding'
          'should confirm links download will start automatically': response matches 'PARAM_START_AFTER_ADDING_LINKS=true'

          'add_downloads':
            topic: call_to('add_downloads', [DOWNLOAD_URL])
            'should add the downloads': response matches /Link\(s\) added/

            'current_downloads_list':
              topic: (topics..., client) ->
                # we need to wait a few seconds while the grabber panel verifies the link
                failed = false; that = this
                failer = setTimeout fail, 30e3
                fail = =>
                  failed = true
                  @callback 'Did not add the link in < 30s !'

                check_the_downloads_list = ->
                  client.current_downloads_list (err, downloads) ->
                    if !err && downloads && downloads.length > 0
                      clearTimeout failer
                      return that.callback(err, downloads)
                    setTimeout check_the_downloads_list, 500 unless failed
                check_the_downloads_list()
                undefined # to trigger the async mode in vows

              'should contain a matching item': (err, downloads) ->
                assert.ifError(err)
                assert.equal downloads[0].name, 'ubuntu-10 04 1 5in1'
                assert.equal downloads[0].linkstotal, 1
                assert.equal downloads[0].size, '500.00 MiB'

              'stop_downloads':
                topic: call_to 'stop_downloads'
                'should stop the downloads and confirm': response matches 'Downloads stopped'

                'download_status':
                  topic: call_to 'download_status'
                  'should respond the NOT_RUNNING or STOPPING status': response matches /^(NOT_RUNNING|STOPPING)$/

                  'start_downloads':
                    topic: call_to 'start_downloads'
                    'should restart the downloads and confirm': response matches 'Downloads started'

                    'wait a little':
                      topic: -> setTimeout(@callback, 20e3)
                      'download_status':
                        topic: call_to 'download_status'
                        'should respond the RUNNING status': response matches 'RUNNING'

                        'remove_downloads':
                          topic: call_to('remove_downloads', ['ubuntu-10 04 1 5in1'])
                          'should confirm it cleared the queue': response matches "The following packages were removed from download list: 'ubuntu-10 04 1 5in1'"

