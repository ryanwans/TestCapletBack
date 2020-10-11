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

app.post('/a3/l/q/a/l', function(req, res) {
  var Stamp   = req.query.stamp;
  var Form    = req.query.form;
  var Data    = req.body;

  // console.log(Data);
  // Data = JSON.parse(Data);
  Data = atob(Data.data);
  console.log(Data);

  // We can use a normal fs parse for user logins
  // becuase their aren't as many entries in said array
  var logs = fs.readFileSync('./bank/Users.json'), i=0, logged = [];
  logs = JSON.parse(logs);
  console.log(logs, Data)
  for(i=0; i<logs.length; i++) {
    console.log(Data["u"], logs[i].username);
    if(Data["u"] == logs[i].username) {
      logged = [
        true,
        i
      ]
    }
  }
  if(logged[0]) {
    res.json({
      auth: true,
      method: 'teacher',
      use: i
   });
  } else {
    res.json({
      auth: false,
      serr: false
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
