// app file BRRUHHHHHH
const app = require('express')();
var btoa = require('btoa'),
    atob = require('atob'),
    fs = require('fs')
    bp = require('body-parser');

app.use(bp.json());
app.use(bp.urlencoded({
    extended: true
}));

app.use(function(req, res, next) {
  res.setHeader("RW-Auth", btoa(Date.now()+"-XXX-1"));
  next();
});

app.get('/a3/l/q/a/l', function(req, res) {
  var Stamp   = req.query.stamp;
  var Form    = req.query.form;
  
  var Data = atob(req.body);
  Data = JSON.parse(Data);
  Data = atob(Data.data);
  console.log(Data);
  
  /* Query Database */
 
 res.json({
    auth: true
 });
});

app.listen(8080, () => {
    console.log("app is listening on port 8080");
});
