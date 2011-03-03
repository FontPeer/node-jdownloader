# **node-jdownloader** is a no-frills api for driving JDownloader through its
# RemoteControl's plugin HTTP Api. It parses the returned results from XML
# to idiomatic Javascript structures.
#
# The [source for node-jdownloader](http://github.com/mathieuravaux/node-jdownloader)
# is available on GitHub and released under the MIT license.
#
# To install node-jdownloader, first make sure you have [Node.js](http://nodejs.org/),
# Then, with NPM:
#
#     sudo npm install node-jdownloader
#

#### External dependencies.

request = require 'request'
_ = require('underscore')._
ltx = require 'ltx'


#### Helper methods

# Parses the given xml into nested hashes using `ltx`.
# If an exception arises, the error callback is called, and null is sent back
# TODO: change this to fit better in the (err, callback) chain
parse_xml = (xml, callback) ->
  try ltx.parse(xml)
  catch err
    callback(err)
    null

# The main class
class Client

  # Use the default JDownloader configuration
  constructor: (host = "localhost", port = 10025) ->
    @server_url = "http://#{host}:#{port}/"

  #### API methods generators:

  # Creates a function that fetches given `path`, optionally transforming the result
  # through `async_filter` if successful
  @get: (path, async_filter) ->
    (cb) ->
      throw new Error("No callback passed !") unless cb
      @request path, (err, resp) ->
        return cb(err) if err
        if async_filter
          async_filter(resp, cb)
        else
          cb null, resp

  # For configuration flags, generate 3 convenience functions. E.g.: for 'reconnect'
  #
  #     set_reconnect_enabled(true|false, callback)
  #     enable_reconnect(callback)
  #     disable_reconnect(callback)
  @feature_switch = (feature, path) ->
    switch_fn = (enable, callback) -> @request "#{path}#{!!enable}", callback
    @prototype["set_#{feature}_enabled"] = switch_fn
    @prototype["enable_#{feature}"]  = (callback) -> switch_fn.call(this, yes, callback)
    @prototype["disable_#{feature}"] = (callback) -> switch_fn.call(this, no,  callback)


  #### Parsers for the server response contents

  # String -> Number
  @as_number: (value, callback) -> callback(null, parseInt(value, 10))

  # String -> Boolean
  @as_boolean: (value, callback) ->
    value = switch value
      when 'true',  '1', 'on',  'yes' then true
      when 'false', '0', 'off', 'no'  then false
      else value
    callback null, value

  # Filter to reject the whitespace XML text nodes
  whitespace_nodes = (el) -> typeof el == 'string' && /\s+/.test el

  # Remove the prefix for hashes like:
  #
  #     {
  #       package_size: '500 MiB',
  #       package_url:  '....',
  #       package_status: 'RUNNING',
  #       ...
  #     }
  hash_prefix_remover = (prefix) -> (cumbersome_hash) ->
    injector = (hash, value, key) ->
      hash[key.replace prefix, ''] = value
      hash
    _(cumbersome_hash).reduce(injector, {})

  # XML 'configuration' nodes -> 'Configuration' Hash
  @parse_configuration = (xml, callback) ->
    root = parse_xml xml, callback
    return unless root
    config = _(root.children).detect( (el) -> typeof el != 'string').attrs
    callback(null, config)

  # XML 'package' nodes -> Array of 'Package' Hashes
  @parse_downloads = (xml, callback) ->
    root = parse_xml xml, callback
    return unless root
    packages = _(root.children)
      .chain()
      .reject(whitespace_nodes)
      .pluck('attrs')
      .map(hash_prefix_remover /^package_/)
      .value()
    callback(null, packages)

  # XML 'link' nodes ->
  #
  #     [{
  #       url: 'http://ww...1/ubuntu-10.04.1_5in1.part1.rar' },
  #       files: [{
  #         size: '500.00 MiB',
  #         browser_url: 'http://ww...1/ubuntu-10.04.1_5in1.part1.rar',
  #         package: 'ubuntu-10 04 1 5in1',
  #         hoster: 'filesonic.com',
  #         status: '',
  #         name: 'ubuntu-10.04.1_5in1.part1.rar',
  #         download_url: 'http://ww...1/ubuntu-10.04.1_5in1.part1.rar',
  #         available: 'TRUE'
  #       }]
  #     }]

  parse_link_analysis = (xml, callback) ->
    root = parse_xml xml, callback
    return unless root #TODO: change this to keep the normal control flow
    adapt_link_nodes = (link_node) ->
      link = link_node.attrs
      link.files = _(link_node.children).chain()
        .reject(whitespace_nodes)
        .pluck('attrs')
        .map(hash_prefix_remover /^file_/).value()
      link
    results = _(root.children).chain()
      .reject(whitespace_nodes)
      .map(adapt_link_nodes)
      .value()
    callback(null, results)


  ## General information API

  # RemoteControl API html help
  help:               @get 'help'
  # IP of the machine hosting JDownloader
  ip:                 @get 'get/ip'
  # current download speed
  current_speed:      @get 'get/speed', @as_number

  # JDownloader configuration, parsed as a Hash
  config:             @get 'get/config', @parse_configuration

  # JDownloader version string
  version:            @get 'get/version'

  # JDownloader's RemoteControl plugin version string
  rc_version:         @get 'get/rcversion'

  # Download speed limit
  get_speedlimit:     @get 'get/speedlimit'

  # Autoreconnect flag (for dial-up style Internet connections ?)
  get_autoreconnect:  @get 'get/isreconnect', @as_boolean

  # Download status: RUNNING, NOT_RUNNING or STOPPING
  download_status:    @get 'get/downloadstatus'

  ## Downloads management API

  # Manage the status of the download list at once
  start_downloads:    @get 'action/start'
  pause_downloads:    @get 'action/pause'
  stop_downloads:     @get 'action/stop'
  toggle_downloads:   @get 'action/toggle'

  # Get the current, finished and total downloads count
  current_downloads_count:  @get 'get/downloads/current/count',  @as_number
  finished_downloads_count: @get 'get/downloads/finished/count', @as_number
  downloads_count:          @get 'get/downloads/all/count',      @as_number

  # Get the current, finished and full downloads list
  current_downloads_list:  @get 'get/downloads/current/list',    @parse_downloads
  finished_downloads_list: @get 'get/downloads/finished/list',   @parse_downloads
  downloads_list:          @get 'get/downloads/all/list',        @parse_downloads

  # Check a list of links WITHOUT downloading them.
  # Useful to guess the 'feasibility' of a download
  check_links: (links, cb) ->
    links_list = links.join('\n')
    path = "special/check/#{encodeURI links_list}"
    @request path, (err, resp) =>
      return cb(err) if err
      parse_link_analysis resp, cb

  # Add a set of links to the linkgrabber. This may need user interaction in
  # JDownloader, depending on its configuration.
  # See [automatic downloads configuration](#section-9)
  add_downloads: (links, cb) ->
    links_list = links.join('\n')
    path = "action/add/links/#{encodeURI links_list}"
    @request path, cb

  # Remove all downloads from any list
  purge_downloads: @get 'action/downloads/removeall'

  # Remove a list of downloads based on their package name
  remove_downloads: (package_names, cb) ->
    package_names = package_names.join('/')
    path = "action/downloads/remove/#{escape package_names}"
    @request path, cb


  ## JDownloader management API

  # Trigger the automatic update. `force` if you're willing to install updates
  # that need a restart of JDownloader
  webupdate: @get 'action/update'
  force_webupdate: @get 'action/forceupdate'

  # Reconnects, shutdown, restart JDownloader
  reconnect: @get 'action/reconnect'
  restart:   @get 'action/restart'
  shutdown:  @get 'action/shutdown'

  # Manage the download speed limit
  # TODO
  set_speedlimit: (new_limit, callback) ->
    "action/set/download/limit/#{new_limit}"

  remove_speedlimit: (callback) -> set_speedlimit 0, callback

  # Manage the maximum number of simulaneous downloads
  # TODO:
  set_max_downloads: (count, callback) ->
    "action/set/download/max/#{count}"

  # Destination directory for the downloads
  set_download_dir: (directory, callback) ->
    @request "action/set/downloaddir/general/#{escape directory}", callback


  #### automatic download configuration
  # Wether added links are automatically accepted in the linkgrabber
  @feature_switch 'grabber_autoadding', "set/grabber/autoadding/"
  # Weher added links are automatically started once in the download list
  @feature_switch 'grabber_startafteradding', "set/grabber/startafteradding/"

  # Set the 'reconnect enabled', 'premium enabled' options of JDowndloader
  @feature_switch 'reconnect', 'action/set/reconnect/'
  @feature_switch 'premium', 'action/set/premiumenabled/'


#### Helpers

  # The common idiom of making an asynchronous GET on the server
  request: (path, callback) ->
    request
      uri: @server_url + path
      callback: (error, response, body) =>
        if error
          error.response = response
          error.body = body
          callback error
        else
          callback null, body, response.statusCode

exports.Client = Client
