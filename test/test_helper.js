var test = require('mjsunit'),
    http  = require("http"),
    sys  = require('sys');

exports.echoServer = function() {
  var server = http.createServer(function(request, response) {
    var echo = [request.method, request.uri.full, "HTTP/" + 
                request.httpVersion].join(' ') + "\r\n";
    for (var header in request.headers) {
      echo += header + ": " + request.headers[header] + "\r\n";
    }
    echo += '\r\n';
    request.addListener('body', function(chunk) {
      echo += chunk;
    });
    request.addListener('complete', function() {
      response.sendHeader(200, {
        'Content-Type': 'text/plain',
        'Content-Length': echo.length
      });
    
      response.sendBody(echo);
      response.finish();
      server.close();
    });
  });
  
  var port = exports.port++;
  server.listen(port, "localhost");
  return ["http://localhost:" + port, server];
}

exports.dataServer = function() {
  var json = "{ ok: true }";
  var xml  = "<document><ok>true</ok></document>";
  var yaml = "ok: true";
  
  var server = http.createServer(function(request, response) {
    response.sendHeader(200, { 'Content-Type': request.headers['accepts'] });
    
    if (request.headers['accepts'] == 'application/json') {
      response.sendBody(json);
    }
    
    if (request.headers['accepts'] == 'application/xml') {
      response.sendBody(xml);
    }
    
    if (request.headers['accepts'] == 'application/yaml') {
      response.sendBody(yaml);
    }
    
    response.finish();
    server.close();
  });
  
  var port = exports.port++;
  server.listen(port, "localhost");
  return ["http://localhost:" + port, server];
}

exports.redirectServer = function() {
  var port = exports.port++;
  
  var server = http.createServer(function(request, response) {
    if (request.uri.full == '/redirected') {
      response.sendHeader(200, { 'Content-Type': 'text/plain' });
      response.sendBody('Hell Yeah!');
      response.finish();
      server.close();
    } else {
      response.sendHeader(301, { 'Location': 'http://localhost:' + port + '/redirected' });
      response.sendBody('Redirecting...');
      response.finish();
    }
    
  });
  
  server.listen(port, "localhost");
  return ["http://localhost:" + port, server];
}

exports.port = 7000;

exports.testCase = function(caseName, serverFunc, tests) {
  var testCount = 0, passes = 0, fails = 0;
  
  function wrapAssertions(name) {
    var assertions = {};
    
    [
      'assertEquals',
      'assertArrayEquals',
      'assertTrue',
      'assertFalse',
      'assertNaN',
      'assertThrows',
      'AssertInstanceOf',
      'assertDoesNotThrow',
      'assertUnreachable'
    ].forEach(function(assert) {
      assertions[assert] = function() {
        testCount++;
        try {
          test[assert].apply(this, arguments);
          passes++;
        } catch(e) {
          sys.puts(name + ': ' + e);
          fails++;
        }
      }
    });
    
    return assertions;
  }
  
  for (var name in tests) {
    if (name.match(/^test/)) {
      var res = serverFunc(), host = res[0], 
          server = res[1];
      tests[name](host, wrapAssertions(name));
    }
  }
  
  process.addListener('exit', function() {
    sys.puts(caseName + " - Assertions: " + testCount + " Passed: " + passes, " Failed: " + fails);
  });
}

