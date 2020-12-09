// app file BRRUHHHHHH
const app = require('express')();
var btoa = require('btoa'),
    atob = require('atob'),
    fs = require('fs')
    bp = require('body-parser'),
    https = require('https'),
    http = require('http'),
    tHtt = http.createServer(app);

var privateKey, certificate, ca, credentials;

privateKey = fs.readFileSync('./private.pem', 'utf8');
certificate = fs.readFileSync('./cert.pem', 'utf8');
//ca = fs.readFileSync('/etc/letsencrypt/live/ryanwans.com/chain.pem', 'utf8');
credentials = {key: privateKey,cert: certificate};

const httpsServer = https.createServer(credentials, app);

var io = require('socket.io')(httpsServer);
var Namespace = new Object();
var WaitingRoom = new Object();

// Code Status Cheat Sheet
// xx1 - Teacher has not yet started the live testing
// xx2 - Test is still locked
// xx3 - Test is nominal
// xx4 - Test locking was triggered
// xx5 - Data aknowledged
// xx6 - Attempt reconnection
// xx7 - Test is paused
// xx8 - Authorized test unlock

io.of('/a3/sockets/sss').on('connection', (socket) => {
  console.log("\n> New Client: Connection\n");

  socket.on("teacher-register", (Data) => {
    console.log("teacher register attempted");
    console.log(JSON.stringify(Data, null, 4));
    Namespace[Data.namespace] = {clients: {}, lockStatus: false};
    if(WaitingRoom[Data.namespace]) {
      for(let i=0; i<WaitingRoom[Data.namespace].length; i++) {
        socket.broadcast.emit(WaitingRoom[Data.namespace][i], {
          status: false,
          code: 'xx6',
          wait: false
        });
        console.log("Sent WAITING_ROOM request to user "+WaitingRoom[Data.namespace][i]);
        WaitingRoom[Data.namespace].splice(i, 1);
      }
    }
    console.log("Done. Test was allocated in the namespace");
    var tLi = Data.auth+"_teXX";
    socket.emit("return", {
      listen: tLi,
      now: Date.now(),
      allocation: Namespace,
      waiting: WaitingRoom
    })
  });

  socket.on("teacher-getNamespace", (Data) => {
    // console.log("teacher requested respective namespace object");
    socket.emit("namespace", {
      namespace: Namespace[Data.namespace]
    })
  });

  socket.on('teacher-StartStop', (Data) => {
    console.log("teacher has editted a tests start/stop state");
    Namespace[Data.namespace].lockStatus = Data.opened;
    socket.emit("namespace", {
      namespace: Namespace[Data.namespace]
    }); 
    for(let i=0; i<Object.keys(Namespace[Data.namespace].clients).length; i++) {
      console.log("Opening test for " + Object.values(Namespace[Data.namespace].clients)[i].route)
      socket.broadcast.emit(Object.values(Namespace[Data.namespace].clients)[i].route, {
        status: Data.opened,
        code: (Data.opened) ? 'xx3' : 'xx7',
        wait: false
      });
    }
  })

  socket.on('teacher-unlockStudent', (Data) => {
    var Reply = Data.student, Auth = Data.auth;

    //console.log(Auth + "::"+Reply);

    if(Object.keys(Namespace).includes(Auth)) {
      socket.broadcast.emit(Reply, {
        status: true,
        code: 'xx8',
        wait: false
      })
    } else {
      socket.emit('return', {
        message: "tried"
      })
    }
  })

  socket.on('approval-request', (Auth) => {
    if(Auth.purpose == 'routing') {
      var route = Auth.routing;
      if(route.target in Namespace) {
        Namespace[route.target]['clients'][route.id] = {
          name: route.name,
          stage: route.stage,
          id: route.id,
          route: Auth.return,
          status: {
            testing: false,
            activeQ: null,
            answers: null,
            elapsed: null,
            wpFire: false,
            submit: false,
            score: null
          }
        };
        console.log(Namespace[route.target]);
        socket.emit(Auth.return, {
          status: true,
          code: (Namespace[route.target]['lockStatus']) ? 'xx3' : 'xx2',
          wait: false,
          syncR: {
            t: true
          }
        });
      } else {
        WaitingRoom[route.target] = WaitingRoom[route.target] || new Array();
        WaitingRoom[route.target].push(Auth.return);
        socket.emit(Auth.return, {
          status: false,
          code: 'xx1',
          wait: true
        })
      }
    }
  });
  socket.on('tcio-data', (data) => {
    if(data.purpose == 'status-update') {
      Namespace[data.routing.target]['clients'][data.routing.id].status = data.status;
      console.log("Status Update Received - Target "+data.routing.target);
      socket.emit(data.return, {
        status: true,
        code: 'xx5'
      })
      var f = fs.readFileSync('./bank/AnswerRepo.json', {root: __dirname});
      f = JSON.parse(f);
      f[data.routing.target][data.routing.id] = data.status;
      fs.writeFileSync('./bank/AnswerRepo.json', JSON.stringify(f), {root: __dirname});
    }
  });
  socket.on('disconnect', ()=> {
    console.log("\n> New Client: Disconnection\n");
  })
  io.on('approval-request', (a) => {
    console.log(a);
  })
})

app.use(bp.json());
app.use(bp.urlencoded({
    extended: true
}));

app.use(function(req, res, next) {
  res.setHeader("RW-Auth", btoa(Date.now()+"-XXX-1"));
  next();
});

app.post('/a3/ported/qgr/enco/new/now/result=json', function(req, res) {
  var Data = req.body;
  var [Grade, Output] = GradeTestData(Data, true);
  var f = fs.readFileSync('./bank/AnswerRepo.json', {root: __dirname});
  f = JSON.parse(f);
  f[Data.tuid][Data.name].score = Grade;
  fs.writeFileSync('./bank/AnswerRepo.json', JSON.stringify(f), {root: __dirname});
  console.log(Output);
  res.json([Grade, Output]);
})

app.get('/a3/ported/t/sTD/state', function(req, res) {
  var code = req.query.code, state = req.query.state;
  var index = req.query.index, auth = req.query.auth;

  var gg = JSON.parse(fs.readFileSync('./bank/Users.json', {root: __dirname}));

  if(gg[index]['address'] == auth) {
    var codes = fs.readFileSync('./bank/CodeRepo.json', {root: __dirname});
    codes = JSON.parse(codes);
    var owner = codes[code]["o"];
  
    var repo = fs.readFileSync('./bank/TestRepo.json', {root: __dirname});
    repo = JSON.parse(repo);
    repo[owner][code]['meta']['open'] = (state == 'open') ? true : false;
  
    fs.writeFileSync('./bank/TestRepo.json', JSON.stringify(repo, null, 4), {root: __dirname});

    console.log("authenticated user edited test lock state")
  } else {console.log("unauthenticated lock states attempt");}

  res.json({message: 'operation was probably completed, though we will never know ;)'});
})

app.post("/a3/edge/enco/realtime-data-stream", function(res, res) {
  var DATA = JSON.parse(req.body);
});

app.post("/a3/l/q/svr", function(req, res) {
  var data = req.body;

  console.log(">> HIT");

  // step one - authenticate
  var UserFile = fs.readFileSync('./bank/Users.json', {root: __dirname});
  UserFile = JSON.parse(UserFile);
  var auth = false; 

  for(let i=0; i<UserFile.length; i++) {
    if(UserFile[i].address == data.auth && UserFile[i].password == data.password) {auth = true;}
  }

  if(auth) {
    console.log(">> Auth Passed");
    // step two - identify test and get data
    var id = data.id;
    var Codes = JSON.parse(fs.readFileSync('./bank/CodeRepo.json'));
    try {
      var owner = Codes[id]["o"];
      if("string" != typeof owner) {
        res.json({code: false});
      } else {
        var Tests = JSON.parse(fs.readFileSync('./bank/TestRepo.json'));
        var testId = Tests[owner][id]["tuid"];

        var AnswerRepo = JSON.parse(fs.readFileSync('./bank/AnswerRepo.json'));
        res.json({
          auth: true,
          data: AnswerRepo[testId],
          test: JSON.parse(fs.readFileSync('./bank/tests/'+testId+".json"))
        })
      }
    } catch(e) {
      res.json({code: false});
    }
  } else {console.log(">> Auth Failed");res.json({auth: false});}
})

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
        try {
          res.json({
            "crit": "This test code is allocated but contains no reciprocating target file. (Corrupted Test Data)"
          })
        } catch(e) {}
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

const GradeTestData = (TestData, generateReport) => {
  var Answers = JSON.parse(atob(TestData.data));
  console.log(Answers);

  var file = fs.readFileSync('./bank/tests/'+TestData.tuid+".json", {root: __dirname});
  file = JSON.parse(file); 

  var points = 0, ansReport = {};

  for(let i=0; i<file.length; i++) {
    var Q = file[i];
    var type = Q["_data"]["qType"];
    if(type == 0) {
      // multichoice - shorthand
      console.log(Answers[i] + ":" + Q["_data"].qShorthand);
      if(Answers[i] == Q["_data"].qShorthand) {
        points++;
      }
      ansReport[i] = {
        C: Q["_data"].qShorthand,
        A: Answers[i]
      }
    } else if (type == 1) {
      // matching - deprecated so give a full point
      points++;console.log("was correct.");
    } else if (type == 2) {
      // fill in the blank - shorthand
      var fstr = "";
      for(let r=0; r<Object.keys(Answers[i]).length; r++) {
        fstr = fstr + Object.keys(Answers[i])[r] + Object.values(Answers[i])[r]
      }
      console.log(fstr + ":" + Q["_data"].qShorthand);
      if(fstr == Q["_data"].qShorthand) {
        points++;
      }
      ansReport[i] = {
        C: Q["_data"].qShorthand,
        A: fstr
      }
    } else if (type == 3) {
      // true or false - shorthand
      console.log(Answers[i] + ":" + Q["_data"].qShorthand);
      if(Answers[i] == Q["_data"].qShorthand) {
        points++;
      }
      ansReport[i] = {
        C: Q["_data"].qShorthand,
        A: Answers[i]
      }
    } else if (type == 4) {
      // multianswer - bucket
      Answers[i] = Answers[i].sort(function(a, b) {
        return a - b;
      });
      var compr = Q["_data"].qBucket.sort(function(a, b) {
        return a - b;
      });
      console.log(Answers[i].toString() + ":" + compr.toString());
      if(Answers[i].toString() == compr.toString()) {
        points++;
      }
      ansReport[i] = {
        C: compr.toString(),
        A: Answers[i].toString()
      }
    } else if (type == 5) {
      // slider - bucket
      console.log(Answers[i] + ":" + Q["_data"].qBucket);
      if(Answers[i] == Q["_data"].qBucket) {
        points++;
      }
      ansReport[i] = {
        C: Q["_data"].qBucket,
        A: Answers[i]
      }
    } else if (type == 6) {
      // table - shorthand
      var fstr = "";
      for(let r=0; r<Answers[i].length; r++) {
        fstr = fstr + Answers[i][r];
      }
      console.log(fstr + ":" + Q["_data"].qShorthand);
      if(fstr == Q["_data"].qShorthand) {
        points++;
      }
      ansReport[i] = {
        C: Q["_data"].qShorthand,
        A: fstr
      }
    }
  }
  console.log(points);
  if(generateReport) {
    return [points, ansReport];
  } else {
    return points;
  }
}

app.post("/analytics/*", function(req, res) {
  var t = req.body;
  if("object" != typeof t) {t = JSON.parse(t);}
  console.log("Received new analytics hitmark! ");
  var TransBuffer = Buffer.from(t.pack);
  var Analytics = JSON.parse(TransBuffer.toString());

  var UUID = Analytics.uuid;
  var STMP = Analytics.stamp;
  var LEAS = Analytics.lease;

  var AnFile = fs.readFileSync('./UsageAnalytics.json', {root: __dirname});
  AnFile = JSON.parse(AnFile);

  AnFile[LEAS] = AnFile[LEAS] || {};
  AnFile[LEAS][UUID] = AnFile[LEAS][UUID] || {};
  if(AnFile[LEAS][UUID][STMP]) {
    for(let i=0; i<Analytics.clicks.length;i++) {
      AnFile[LEAS][UUID][STMP].clicks.push(Analytics.clicks[i]);
    }
    for(let i=0; i<Analytics.actions.length;i++) {
      AnFile[LEAS][UUID][STMP].actions.push(Analytics.actions[i]);
    }
  } else {
    AnFile[LEAS][UUID][STMP] = {
      clicks: Analytics.clicks,
      actions: Analytics.actions
    }
  }

  fs.writeFileSync('./UsageAnalytics.json', JSON.stringify(AnFile, null, 4), {root: __dirname})

  res.send("OK")
});

app.get('/', function(req, res) {
  res.send("Test Caplet Backend API v3. Have a good day!");
  //res.sendFile('./SocketTest.html', {root: __dirname});
});

httpsServer.listen(8080, () => {
    console.log('HTTPS Server running on port 8080 redirecting 443');
});
