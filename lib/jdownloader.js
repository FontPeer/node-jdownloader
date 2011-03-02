(function() {
  var restler;
  restler = require('restler-aaronblohowiak');
  exports.Client = (function() {
    function Client(host, port, login, password) {}
    Client.prototype.get_help = function(callback) {
      return callback(null, "/help is a great start to understand me");
    };
    return Client;
  })();
}).call(this);
