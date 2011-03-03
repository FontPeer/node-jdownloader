(function() {
  var Client, ltx, parse_xml, request, _;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  request = require('request');
  _ = require('underscore')._;
  ltx = require('ltx');
  parse_xml = function(xml, callback) {
    try {
      return ltx.parse(xml);
    } catch (err) {
      callback(err);
      return null;
    }
  };
  Client = (function() {
    var hash_prefix_remover, parse_link_analysis, whitespace_nodes;
    function Client(host, port) {
      if (host == null) {
        host = "localhost";
      }
      if (port == null) {
        port = 10025;
      }
      this.server_url = "http://" + host + ":" + port + "/";
    }
    Client.get = function(path, async_filter) {
      return function(cb) {
        if (!cb) {
          throw new Error("No callback passed !");
        }
        return this.request(path, function(err, resp) {
          if (err) {
            return cb(err);
          }
          if (async_filter) {
            return async_filter(resp, cb);
          } else {
            return cb(null, resp);
          }
        });
      };
    };
    Client.feature_switch = function(feature, path) {
      var switch_fn;
      switch_fn = function(enable, callback) {
        return this.request("" + path + (!!enable), callback);
      };
      this.prototype["set_" + feature + "_enabled"] = switch_fn;
      this.prototype["enable_" + feature] = function(callback) {
        return switch_fn.call(this, true, callback);
      };
      return this.prototype["disable_" + feature] = function(callback) {
        return switch_fn.call(this, false, callback);
      };
    };
    Client.as_number = function(value, callback) {
      return callback(null, parseInt(value, 10));
    };
    Client.as_boolean = function(value, callback) {
      value = (function() {
        switch (value) {
          case 'true':
          case '1':
          case 'on':
          case 'yes':
            return true;
          case 'false':
          case '0':
          case 'off':
          case 'no':
            return false;
          default:
            return value;
        }
      })();
      return callback(null, value);
    };
    whitespace_nodes = function(el) {
      return typeof el === 'string' && /\s+/.test(el);
    };
    hash_prefix_remover = function(prefix) {
      return function(cumbersome_hash) {
        var injector;
        injector = function(hash, value, key) {
          hash[key.replace(prefix, '')] = value;
          return hash;
        };
        return _(cumbersome_hash).reduce(injector, {});
      };
    };
    Client.parse_configuration = function(xml, callback) {
      var config, root;
      root = parse_xml(xml, callback);
      if (!root) {
        return;
      }
      config = _(root.children).detect(function(el) {
        return typeof el !== 'string';
      }).attrs;
      return callback(null, config);
    };
    Client.parse_downloads = function(xml, callback) {
      var packages, root;
      root = parse_xml(xml, callback);
      if (!root) {
        return;
      }
      packages = _(root.children).chain().reject(whitespace_nodes).pluck('attrs').map(hash_prefix_remover(/^package_/)).value();
      return callback(null, packages);
    };
    parse_link_analysis = function(xml, callback) {
      var adapt_link_nodes, results, root;
      root = parse_xml(xml, callback);
      if (!root) {
        return;
      }
      adapt_link_nodes = function(link_node) {
        var link;
        link = link_node.attrs;
        link.files = _(link_node.children).chain().reject(whitespace_nodes).pluck('attrs').map(hash_prefix_remover(/^file_/)).value();
        return link;
      };
      results = _(root.children).chain().reject(whitespace_nodes).map(adapt_link_nodes).value();
      return callback(null, results);
    };
    Client.prototype.help = Client.get('help');
    Client.prototype.ip = Client.get('get/ip');
    Client.prototype.current_speed = Client.get('get/speed', Client.as_number);
    Client.prototype.config = Client.get('get/config', Client.parse_configuration);
    Client.prototype.version = Client.get('get/version');
    Client.prototype.rc_version = Client.get('get/rcversion');
    Client.prototype.get_speedlimit = Client.get('get/speedlimit');
    Client.prototype.get_autoreconnect = Client.get('get/isreconnect', Client.as_boolean);
    Client.prototype.download_status = Client.get('get/downloadstatus');
    Client.prototype.start_downloads = Client.get('action/start');
    Client.prototype.pause_downloads = Client.get('action/pause');
    Client.prototype.stop_downloads = Client.get('action/stop');
    Client.prototype.toggle_downloads = Client.get('action/toggle');
    Client.prototype.current_downloads_count = Client.get('get/downloads/current/count', Client.as_number);
    Client.prototype.finished_downloads_count = Client.get('get/downloads/finished/count', Client.as_number);
    Client.prototype.downloads_count = Client.get('get/downloads/all/count', Client.as_number);
    Client.prototype.current_downloads_list = Client.get('get/downloads/current/list', Client.parse_downloads);
    Client.prototype.finished_downloads_list = Client.get('get/downloads/finished/list', Client.parse_downloads);
    Client.prototype.downloads_list = Client.get('get/downloads/all/list', Client.parse_downloads);
    Client.prototype.check_links = function(links, cb) {
      var links_list, path;
      links_list = links.join('\n');
      path = "special/check/" + (encodeURI(links_list));
      return this.request(path, __bind(function(err, resp) {
        if (err) {
          return cb(err);
        }
        return parse_link_analysis(resp, cb);
      }, this));
    };
    Client.prototype.add_downloads = function(links, cb) {
      var links_list, path;
      links_list = links.join('\n');
      path = "action/add/links/" + (encodeURI(links_list));
      return this.request(path, cb);
    };
    Client.prototype.purge_downloads = Client.get('action/downloads/removeall');
    Client.prototype.remove_downloads = function(package_names, cb) {
      var path;
      package_names = package_names.join('/');
      path = "action/downloads/remove/" + (escape(package_names));
      return this.request(path, cb);
    };
    Client.prototype.webupdate = Client.get('action/update');
    Client.prototype.force_webupdate = Client.get('action/forceupdate');
    Client.prototype.reconnect = Client.get('action/reconnect');
    Client.prototype.restart = Client.get('action/restart');
    Client.prototype.shutdown = Client.get('action/shutdown');
    Client.prototype.set_speedlimit = function(new_limit, callback) {
      return "action/set/download/limit/" + new_limit;
    };
    Client.prototype.remove_speedlimit = function(callback) {
      return set_speedlimit(0, callback);
    };
    Client.prototype.set_max_downloads = function(count, callback) {
      return "action/set/download/max/" + count;
    };
    Client.prototype.set_download_dir = function(directory, callback) {
      return this.request("action/set/downloaddir/general/" + (escape(directory)), callback);
    };
    Client.feature_switch('grabber_autoadding', "set/grabber/autoadding/");
    Client.feature_switch('grabber_startafteradding', "set/grabber/startafteradding/");
    Client.feature_switch('reconnect', 'action/set/reconnect/');
    Client.feature_switch('premium', 'action/set/premiumenabled/');
    Client.prototype.request = function(path, callback) {
      return request({
        uri: this.server_url + path,
        callback: __bind(function(error, response, body) {
          if (error) {
            error.response = response;
            error.body = body;
            return callback(error);
          } else {
            return callback(null, body, response.statusCode);
          }
        }, this)
      });
    };
    return Client;
  })();
  exports.Client = Client;
}).call(this);
