// app file BRRUHHHHHH
const app = require('express')();
var btoa = require('btoa'),
    atob = require('atob'),
    fs = require('fs')
    bp = require('body-parser'),
    https = require('https');

app.use(bp.json());
app.use(bp.urlencoded({
    extended: true
}));

app.use(function(req, res, next) {
  res.setHeader("RW-Auth", btoa(Date.now()+"-XXX-1"));
  next();
});

app.get('/a3/ported/t/gTD/a', function(req, res) {
  var q = req.query;

  q.testCode = q.testCode || 0;
  q.auth = q.auth || 0;
  q.index = q.index || 0;

      var TestFile = "./bank/tests/"+q.testCode+".json"

      var data;
      try {
        data = fs.readFileSync(TestFile);
        data = JSON.parse(data);
      } catch(e) {
        res.json({
          "crit": "This test code is allocated but contains no reciprocating target file. (Corrupted Test Data)"
        })
      }

      if(data) {
        var ClientTestData = new Array();

        for(let i=0; i < data.length; i++) {
          var t = data[i]
          ClientTestData.push({
            "questionID": t["_id"],
            "questionIndex": t["_index"],
            "recipIndex": i,
            "questionType": t["_data"]["qType"],
            "questionValue": t["_data"]["qValue"],
            "questionOptions": t["_data"]["qAns"]
          })
        };

        res.json(ClientTestData);
      } else {
        res.json({
          "crit": "This test code is allocated but contains no reciprocating target file. (Corrupted Test Data)"
        })
      };
}); 

app.get('/a3/l/q/a/m', function(req, res) {
  let q = req.query;

  q.index = q.index || 0;
  q.auth = q.auth || 0;

  var logs = fs.readFileSync('./bank/Users.json');
  logs = JSON.parse(logs);

  if(q.auth == logs[q.index].address) {
    res.json({
      created: logs[q.index].created,
      name: logs[q.index].name,
      org: logs[q.index].organization,
      orgLeader: logs[q.index]["org-leader"],
      role: logs[q.index].role,
    })
  } else {
    res.json({
      "<?>": null
    })
  }
});

app.get("/a3/l/q/a/t/tl", function(req, res) {
  let q = req.query;

  q.index = q.index || 0;
  q.auth = q.auth || 0;

  var users = fs.readFileSync('./bank/Users.json');
  users = JSON.parse(users);

  var userProfile = users[q.index];

  var username = userProfile["username"];

  if(q.auth == userProfile.address) {
    try { 
      var tests = fs.readFileSync('./bank/TestRepo.json');
      tests = JSON.parse(tests);

      tests = tests[username];

      var bank = new Array();

      for(let i=0; i < Object.keys(tests).length; i++) {
        bank.push({
          code: Object.keys(tests)[i],
          name: Object.values(tests)[i].name,
          tuid: Object.values(tests)[i].tuid,
          meta: Object.values(tests)[i].meta
        })
      }

      res.json(bank);
    } catch(e) { res.json([]) }

  } else {
    res.json( {
      "<?>": null
    })
  }
});

app.post('/a3/l/q/a/l', function(req, res) {
  var Stamp   = req.query.stamp;
  var Form    = req.query.form;
  var Data    = req.body;

  // console.log(Data);
  // Data = JSON.parse(Data);
  Data = atob(Data.data);
  Data = JSON.parse(Data)

  // We can use a normal fs parse for user logins
  // becuase their aren't as many entries in said array
  if(Data.m == "teacher") {
    console.log("teacher");
    var logs = fs.readFileSync('./bank/Users.json'), i=0, logged = [];
    logs = JSON.parse(logs);
    for(i=0; i<logs.length; i++) {
      if(Data["u"] == logs[i].username) {
        if(Data["p"] == logs[i].password) {
          logged = [
            true,
            i
          ]
        }
      }
    }
    if(logged[0]) {
      res.json({
        auth: true,
        method: 'teacher',
        use: logged[1],
        address: logs[logged[1]].address
    });
    } else {
      res.json({
        auth: false,
        serr: false
      })
    }
  } else if (Data.m == "student") {
    var code = Data.c;
    var codeFile = fs.readFileSync('./bank/CodeRepo.json');
    codeFile = JSON.parse(codeFile);
    var keys = Object.keys(codeFile);

    if(keys.includes(code)) {
      var username = codeFile[code].o;
      
      var TestFile = fs.readFileSync('./bank/TestRepo.json');
      TestFile = JSON.parse(TestFile);
      var final = TestFile[username][code];
      final.auth = true;
      final.serr = false;

      res.json(final);
    } else {
      res.json({
        auth: false,
        serr: false
      })
    }
  } else {
    res.json({
      auth: false,
      serr: false,
      message: "invalid packet"
    })
  }
  
});

app.get('/', function(req, res) {
	res.send("Test Caplet Backend API v3. Have a good day!");
});

var privateKey, certificate, ca, credentials;

privateKey = fs.readFileSync('./private.pem', 'utf8');
certificate = fs.readFileSync('./cert.pem', 'utf8');
//ca = fs.readFileSync('/etc/letsencrypt/live/ryanwans.com/chain.pem', 'utf8');
credentials = {key: privateKey,cert: certificate};

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(8080, () => {
    console.log('HTTPS Server running on port 8080 redirecting 443');
});
