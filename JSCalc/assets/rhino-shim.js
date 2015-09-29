// http://ejohn.org/blog/bringing-the-browser-to-the-server/
// timers, xhr

// The window Object
var window = this;

(function(){

  var curLocation = (new java.io.File("./")).toURL();

  // Timers

  var timers = [];

  window.setTimeout = function(fn, time){
    var num;
    return num = setInterval(function(){
      fn();
      clearInterval(num);
    }, time);
  };

  window.clearTimeout = function(num) {
     clearInterval(num);
  };

  window.setInterval = function(fn, time){
    var num = timers.length;

    timers[num] = new java.lang.Thread(new java.lang.Runnable({
      run: function(){
        while (true){
          java.lang.Thread.currentThread().sleep(time);
          fn();
        }
      }
    }));

    timers[num].start();

    return num;
  };

  window.clearInterval = function(num){
    if ( timers[num] ) {
      timers[num].stop();
      delete timers[num];
    }
  };

  // XMLHttpRequest
  // Originally implemented by Yehuda Katz

  window.XMLHttpRequest = function(){
    this.headers = {};
    this.responseHeaders = {};
  };

  XMLHttpRequest.prototype = {
    open: function(method, url, async, user, password){
      this.readyState = 1;
      if (async)
        this.async = true;
      this.method = method || "GET";
      this.url = url;
      this.onreadystatechange();
    },
    setRequestHeader: function(header, value){
      this.headers[header] = value;
    },
    getResponseHeader: function(header){ },
    send: function(data){
      var self = this;

      function makeRequest(){

        var url = new java.net.URL(curLocation, self.url);

        if ( url.getProtocol() == "file" ) {
          if ( self.method == "PUT" ) {
            var out = new java.io.FileWriter(
                new java.io.File( new java.net.URI( url.toString() ) ) ),
              text = new java.lang.String( data || "" );

            out.write( text, 0, text.length() );
            out.flush();
            out.close();
          } else if ( self.method == "DELETE" ) {
            var file = new java.io.File( new java.net.URI( url.toString() ) );
            file["delete"]();
          } else {
            var connection = url.openConnection();
            connection.connect();
            handleResponse();
          }
        } else {

           var connection = url.openConnection();

           connection.setDoOutput(true);
           connection.setDoInput(true);
           connection.setRequestMethod( self.method );

           // Add headers to Java connection
           for (var header in self.headers) {
              connection.addRequestProperty(header, self.headers[header]);
           };

           var os = new java.io.PrintWriter(connection.getOutputStream(), true);
           console.log(data);
           os.write(data);
           os.close();

           connection.connect();

           // Stick the response headers into responseHeaders
           for (var i = 0; ; i++) {
              var headerName = connection.getHeaderFieldKey(i);
              var headerValue = connection.getHeaderField(i);
              if (!headerName && !headerValue) break;
              if (headerName)
                 self.responseHeaders[headerName] = headerValue;
           }

           handleResponse();
        }

        function handleResponse(){
          self.readyState = 4;
          self.status = parseInt(connection.responseCode) || undefined;
          self.statusText = connection.responseMessage || "";

          var contentEncoding = connection.getContentEncoding() || "utf-8",
            stream = (contentEncoding.equalsIgnoreCase("gzip") || contentEncoding.equalsIgnoreCase("decompress") )?
                    new java.util.zip.GZIPInputStream(connection.getInputStream()) :
                    connection.getInputStream(),
            baos = new java.io.ByteArrayOutputStream(),
                  buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024),
            length,
            responseXML = null;

          while ((length = stream.read(buffer)) != -1) {
            baos.write(buffer, 0, length);
          }

          baos.close();
          stream.close();

          self.responseText = java.nio.charset.Charset.forName(contentEncoding)
            .decode(java.nio.ByteBuffer.wrap(baos.toByteArray())).toString();

          self.__defineGetter__("responseXML", function(){
            return responseXML;
          });

          if ( self.responseText.match(/^\s*</) ) {
            try {
              responseXML = new DOMDocument(
                new java.io.ByteArrayInputStream(
                  (new java.lang.String(
                    self.responseText)).getBytes("UTF8")));
            } catch(e) {}
          }
        }

        self.onreadystatechange();
      }

      if (this.async)
        (new java.lang.Thread(new java.lang.Runnable({
          run: makeRequest
        }))).start();
      else
        makeRequest();
    },
    abort: function(){},
    onreadystatechange: function(){},
    getResponseHeader: function(header){
      if (this.readyState < 3)
        throw new Error("INVALID_STATE_ERR");
      else {
        var returnedHeaders = [];
        for (var rHeader in this.responseHeaders) {
          if (rHeader.match(new RegExp(header, "i")))
            returnedHeaders.push(this.responseHeaders[rHeader]);
        }

        if (returnedHeaders.length)
          return returnedHeaders.join(", ");
      }

      return null;
    },
    getAllResponseHeaders: function(header){
      if (this.readyState < 3)
        throw new Error("INVALID_STATE_ERR");
      else {
        var returnedHeaders = [];

        for (var header in this.responseHeaders)
          returnedHeaders.push( header + ": " + this.responseHeaders[header] );

        return returnedHeaders.join("\r\n");
      }
    },
    async: true,
    readyState: 0,
    responseText: "",
    status: 0
  };
})();

/*
// console-shim
(function() {
  function dump(v) {
    return /number|string|boolean/.test(typeof v) ? v : JSON.stringify(v)
  }

  // ugly, but works (?)
  function logger(a,b,c,d,e,f,g) {
      java.lang.System.out.println([a||'',b||'',c||'',d||'',e||'',f||'',g||''].map(dump).join(''));
  }

  window.console = { dir: logger, log: logger, warn: logger, info: logger };
})();
*/


// arguments (aka process.argv in NodeJS)
/*
var argv = [];

for (var i in arguments) {
  argv.push(arguments[i]);
}*/
