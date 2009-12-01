var helper = require ('./test_helper'),
    rest = require('../lib/restler'),
    sys  = require('sys'),
    http = require('http');
    
helper.testCase("Basic Tests", helper.echoServer, {
  testRequestShouldTakePath: function(host, test) {
    rest.get(host + '/thing', function(data) {
      test.assertTrue(/^GET \/thing/.test(data), 'should hit /thing');
    });
  },
  testRequestShouldWorkWithNoPath: function(host, test) {
    rest.get(host, function(data) {
      test.assertTrue(/^GET \//.test(data), 'should hit /');
    });
  },
  testRequestShouldWorkPreserveQueryStringInURL: function(host, test) {
    rest.get(host + '/thing?boo=yah', function(data) {
      test.assertTrue(/^GET \/thing\?boo\=yah/.test(data), 'should hit /thing?boo=yah');
    });
  },
  testRequestShouldBeAbleToGET: function(host, test) {
    rest.get(host, function(data) {
      test.assertTrue(/^GET/.test(data), 'should be GET');
    });
  },
  testRequestShouldBeAbleToPUT: function(host, test) {
    rest.put(host, function(data) {
      test.assertTrue(/^PUT/.test(data), 'should be PUT');
    });
  },
  testRequestShouldBeAbleToPOST: function(host, test) {
    rest.post(host, function(data) {
      test.assertTrue(/^POST/.test(data), 'should be POST');
    });
  },
  testRequestShouldBeAbleToDELETE: function(host, test) {
    rest.del(host, function(data) {
      test.assertTrue(/^DELETE/.test(data), 'should be DELETE');
    });
  },
  testRequestShouldSerializeQuery: function(host, test) {
    rest.get(host, {
      query: { q: 'balls' },
      complete: function(data) {
        test.assertTrue(/^GET \/\?q\=balls/.test(data), 'should hit /?q=balls');
      }
    });
  },
  testRequestShouldPostBody: function(host, test) {
    rest.post(host, {
      data: "balls",
      complete: function(data) {
        test.assertTrue(/\r\n\r\nballs/.test(data), 'should have balls in the body')
      }
    });
  },
  testRequestShouldSerializePostBody: function(host, test) {
    rest.post(host, {
      data: { q: 'balls' },
      complete: function(data) {
        test.assertTrue(/\r\n\r\nq=balls/.test(data), 'should have balls in the body')
      }
    });
  },
  testRequestShouldSendHeaders: function(host, test) {
    rest.get(host, {
      headers: { 'Content-Type': 'application/json' },
      complete: function(data) {
        test.assertTrue(/content\-type\: application\/json/.test(data), 'should content type header')
      }
    });
  },
  testRequestShouldSendBasicAuth: function(host, test) {
    rest.post(host, {
      username: 'danwrong',
      password: 'flange',
      complete: function(data) {
        test.assertTrue(/authorization\: Basic ZGFud3Jvbmc6Zmxhbmdl/.test(data), 'should have auth header')
      }
    });
  },
  testRequestShouldSendBasicAuthIfInURL: function(host, test) {
    var port = host.match(/\:(\d+)/)[1];
    host = "http://danwrong:flange@localhost:" + port;
    rest.post(host, {
      complete: function(data) {
        test.assertTrue(/authorization\: Basic ZGFud3Jvbmc6Zmxhbmdl/.test(data), 'should have auth header')
      }
    });
  },
});



helper.testCase("Deserialization Tests", helper.dataServer, {
  testAutoSerializerShouldParseJSON: function(host, test) {
    rest.get(host, {
      headers: { 'Accepts': 'application/json' },
      complete: function(data) {
        test.assertEquals(true, data.ok, "returned " + sys.inspect(data));
      }
    });
  },
  testAutoSerializerShouldParseXML: function(host, test) {
    rest.get(host, {
      headers: { 'Accepts': 'application/xml' },
      complete: function(data) {
        test.assertEquals("true", data.document.ok, "returned " + sys.inspect(data));
      }
    });
  },
  testAutoSerializerShouldParseYAML: function(host, test) {
    rest.get(host, {
      headers: { 'Accepts': 'application/yaml' },
      complete: function(data) {
        test.assertEquals(true, data.ok, "returned " + sys.inspect(data));
      }
    });
  }
});

helper.testCase('Redirect Tests', helper.redirectServer, {
  testShouldAutomaticallyFollowRedirects: function(host, test) {
    rest.get(host, function(data) {
      test.assertEquals('Hell Yeah!', data, "returned " + sys.inspect(data));
    });
  }
});




helper.testCase("Streaming Use Case Tests", helper.dataServer, {
  testReturnsClientObjectForStreamProcessing: function(host, test) {
    var res = rest.get(host, {
      headers: { 'Accepts': 'application/json' }
    });
    test.assertFalse(typeof res === "undefined");
    test.assertFalse(res === null);
    res.finish(function(response) {
      var body = '';
    
      response.addListener('body', function(chunk) {
        body += chunk;
      });
    
      response.addListener('complete', function() {
        //note that it is not translated.
        test.assertEquals("{ ok: true }", body, "returned " + sys.inspect(body)); 
      });
    });
  }
});
