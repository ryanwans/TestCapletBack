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
  
  // console.log(Data);
  // Data = JSON.parse(Data);
  console.log(Data);
  Data = atob(Data.data);
  console.log(Data);
  

  // var Data = JSON.parse(atob(JSON.parse(req.body).data));

  /* Query Database */
 console.log("authenticator hit mark");
 res.json({
    auth: true,
    method: 'teacher'
 });
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
