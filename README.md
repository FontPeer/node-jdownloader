# node-jdownloader #

## Why ? ##

Control JDownloader from Nodejs via the 'Remote Control' plugin

No more hassle with one-click download websites !

## Getting started ##
    npm install node-jdownloader
then,

    var JDownloader = require('node-jdownloader')
    var jdownloader = new JDownloader.Client("localhost", 10025, "admin", "admin")
    jdownloader.get_speed(function(speed){  console.log("Woohoo! " + speed + "Kbps !!"); })


Run `npm test node-jdownloader` and read the output specs

# Developing node-jdownloader #

### Editing, testing ###

node-jdownloader is written in [CoffeeScript](http://jashkenas.github.com/coffee-script/), a nice little language that compiles to Javascript

To get all the development and runtime dependencies installed, run `npm link`

Edit the source files in `src/` and the tests in `test-src`.

Then run `npm test` to compile the files and run the tests. You should see output like this:

    npm info it worked if it ends with ok
    npm info using npm@0.3.12
    npm info using node@v0.4.1
    npm info pretest node-jdownloader@0.1.0
    npm info test node-jdownloader@0.1.0
    
    ♢ node-jdownloader
    
      when getting the RemoteControl help page
        ✓ it should succeed and explain itself
     
    ✓ OK » 1 honored (0.001s)
    npm info posttest node-jdownloader@0.1.0
    npm ok



### Installing JDownloader on a Debian server: ###

Download site: [https://launchpad.net/~jd-team](https://launchpad.net/~jd-team)

    add-apt-repository ppa:jd-team/jdownloader
    apt-get update
    apt-get install jdownloader

### Using VNC to visually check JDownloader status (port 5900 by default): ###
    Xvfb :1 -screen 0 1280x1024x16 &
    export DISPLAY=:1
    x11vnc -display :1 -usepw -xkb -ncache 10 &
    fluxbox & # if necessary
    jdownloader --hide &

### Other tips : ###

 * The testsuite is run against a RemoteControl plugin of version 12612 [http://localhost:10025/get/rcversion to get it](http://localhost:10025/get/rcversion)
 * To upgrade the plugin, start JDownloader with `-branch NIGHTLY` in the command-line. The branch is pretty stable in my experience.
 * Launch JDownloader with `--hide` to prevent Linkgrabber confirmations blocking it:
    `cd ~/.jdownloader; java -Xmx512M -jar JDownloader.jar --hide`
 * JDownloader default ports: Webinterface => 8765, Remote control => 10025
 * [JDownloader forums](http://board.jdownloader.org/)
 * [JDownloader wiki](http://jdownloader.org:8081/knowledge/wiki/start)
 * [Ruby bindings by JP Hastings-Spital](https://github.com/jphastings/jd-control/)
 * `npm edit <dependency>`

## TODO / Issues ##
TBD

## License ##

(The MIT License)

Copyright (c) 2011 Mathieu Ravaux

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.