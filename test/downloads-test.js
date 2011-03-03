(function() {
  var DOWNLOAD_URL, JDownloader, assert, boolean, call_to, is_a, is_typed, matches, number, response, tests, vows;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  vows = require('vows');
  assert = require('assert');
  JDownloader = require('../lib/jdownloader');
  assert.matches = function(actual, regex, message) {
    if (regex instanceof RegExp) {
      if (!regex.test(actual)) {
        return assert.fail(actual, regex, message, '.test', assert.matches);
      }
    } else {
      return assert.equal(actual, regex, message);
    }
  };
  assert.type = function(actual, expected_type, message) {
    if (typeof actual !== expected_type) {
      return assert.fail(typeof actual, expected_type, message, '==', assert.type);
    }
  };
  is_a = function(fn) {
    return fn;
  };
  matches = function(regex) {
    return function(actual) {
      return assert.matches(actual, regex);
    };
  };
  is_typed = function(type) {
    return function(actual) {
      return assert.type(actual, type);
    };
  };
  boolean = is_typed('boolean');
  number = is_typed('number');
  response = function(verifications) {
    return function() {
      return verifications.apply(null, arguments);
    };
  };
  call_to = function() {
    var api_method_name, args;
    api_method_name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return function() {
      var client, vows_contexts, _i;
      vows_contexts = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), client = arguments[_i++];
      if (!client[api_method_name]) {
        throw new Error("NotImplemented: " + api_method_name);
      }
      client[api_method_name].apply(client, __slice.call(args).concat([this.callback]));
      return;
    };
  };
  DOWNLOAD_URL = "http://www.filesonic.com/file/113998031/ubuntu-10.04.1_5in1.part1.rar";
  tests = vows.describe('node-jdownloader')["export"](module);
  tests.addBatch({
    "JDownloader's": {
      topic: new JDownloader.Client(),
      'current speed': {
        topic: call_to('current_speed'),
        'is probably 0': function(err, speed) {
          assert.ifError(err);
          return assert.strictEqual(speed, 0);
        }
      },
      'RemoteControl help page': {
        topic: call_to('help'),
        'should mention itself': response(matches(/JDRemoteControl Help/i))
      },
      'IP': {
        topic: call_to('ip'),
        'should be well-formed': response(matches(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/))
      },
      'configuration': {
        topic: call_to('config'),
        'should say the RemoteControl plugin is enabled': function(err, config) {
          assert.ok(config);
          return assert.equal(config['OPTIONAL_PLUGIN2_remotecontrol'], 'true');
        }
      },
      'reported version': {
        topic: call_to('version'),
        'is not very helpful': response(matches('JDownloader'))
      },
      'reported RemoteControl plugin version': {
        topic: call_to('rc_version'),
        'should be numeric': response(matches(/[0-9]+/))
      },
      'speedlimit ': {
        topic: call_to('get_speedlimit'),
        'should be be disabled ;)': function(err, speedlimit) {
          return assert.strictEqual(speedlimit, '0');
        }
      },
      'autoreconnect setting': {
        topic: call_to('get_autoreconnect'),
        'is a boolean': response(is_a(boolean))
      },
      'download status': {
        topic: call_to('download_status'),
        'is RUNNING, NOT_RUNNING or STOPPING': function(err, status) {
          switch (status) {
            case 'RUNNING':
            case 'NOT_RUNNING':
            case 'STOPPING':
              break;
            default:
              return assert.fail(status);
          }
        }
      },
      'total download count': {
        topic: call_to('downloads_count'),
        'is a number': response(is_a(number))
      },
      'current download count': {
        topic: call_to('current_downloads_count'),
        'is a number': response(is_a(number))
      },
      'finished download count': {
        topic: call_to('finished_downloads_count'),
        'is a number': response(is_a(number))
      },
      'set_download_dir': {
        topic: call_to('set_download_dir', '/tmp'),
        'should confirm the new download directory': response(matches("PARAM_DOWNLOAD_DIRECTORY=/tmp"))
      },
      'enable_reconnect': {
        topic: call_to('enable_reconnect'),
        'should confirm the autoreconnect state': response(matches("PARAM_ALLOW_RECONNECT=true"))
      },
      'check_links': {
        topic: call_to('check_links', [DOWNLOAD_URL]),
        'should give complete information about the download': function(err, result) {
          var file;
          assert.ifError(err);
          assert.equal(result[0].url, DOWNLOAD_URL);
          file = result[0].files[0];
          assert.equal(file.download_url, DOWNLOAD_URL);
          assert.equal(file.size, '500.00 MiB');
          assert.equal(file.package, 'ubuntu-10 04 1 5in1');
          assert.equal(file.hoster, 'filesonic.com');
          return assert.equal(file.available, 'TRUE');
        }
      }
    }
  });
  tests.addBatch({
    "JDownloader": {
      topic: new JDownloader.Client(),
      'with an empty download list': {
        topic: call_to('purge_downloads'),
        'enable_grabber_autoadding': {
          topic: call_to('enable_grabber_autoadding'),
          'should confirm links will be added automatically': response(matches('PARAM_START_AFTER_ADDING_LINKS_AUTO=true')),
          'enable_grabber_startafteradding': {
            topic: call_to('enable_grabber_startafteradding'),
            'should confirm links download will start automatically': response(matches('PARAM_START_AFTER_ADDING_LINKS=true')),
            'add_downloads': {
              topic: call_to('add_downloads', [DOWNLOAD_URL]),
              'should add the downloads': response(matches(/Link\(s\) added/)),
              'current_downloads_list': {
                topic: function() {
                  var check_the_downloads_list, client, fail, failed, failer, that, topics, _i;
                  topics = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), client = arguments[_i++];
                  failed = false;
                  that = this;
                  failer = setTimeout(fail, 30e3);
                  fail = __bind(function() {
                    failed = true;
                    return this.callback('Did not add the link in < 30s !');
                  }, this);
                  check_the_downloads_list = function() {
                    return client.current_downloads_list(function(err, downloads) {
                      if (!err && downloads && downloads.length > 0) {
                        clearTimeout(failer);
                        return that.callback(err, downloads);
                      }
                      if (!failed) {
                        return setTimeout(check_the_downloads_list, 500);
                      }
                    });
                  };
                  check_the_downloads_list();
                  return;
                },
                'should contain a matching item': function(err, downloads) {
                  assert.ifError(err);
                  assert.equal(downloads[0].name, 'ubuntu-10 04 1 5in1');
                  assert.equal(downloads[0].linkstotal, 1);
                  return assert.equal(downloads[0].size, '500.00 MiB');
                },
                'stop_downloads': {
                  topic: call_to('stop_downloads'),
                  'should stop the downloads and confirm': response(matches('Downloads stopped')),
                  'download_status': {
                    topic: call_to('download_status'),
                    'should respond the NOT_RUNNING or STOPPING status': response(matches(/^(NOT_RUNNING|STOPPING)$/)),
                    'start_downloads': {
                      topic: call_to('start_downloads'),
                      'should restart the downloads and confirm': response(matches('Downloads started')),
                      'wait a little': {
                        topic: function() {
                          return setTimeout(this.callback, 20e3);
                        },
                        'download_status': {
                          topic: call_to('download_status'),
                          'should respond the RUNNING status': response(matches('RUNNING')),
                          'remove_downloads': {
                            topic: call_to('remove_downloads', ['ubuntu-10 04 1 5in1']),
                            'should confirm it cleared the queue': response(matches("The following packages were removed from download list: 'ubuntu-10 04 1 5in1'"))
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
}).call(this);
