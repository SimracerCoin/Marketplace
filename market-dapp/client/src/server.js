"use strict";

const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 443;
const INDEX = path.join(__dirname, '../build', 'index.html'); // Initialization.

const httpsServer = https.createServer({
	key: fs.readFileSync('/etc/letsencrypt/live/simthunder.com/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/simthunder.com/cert.pem'),
	ca: fs.readFileSync('/etc/letsencrypt/live/simthunder.com/chain.pem')
}, app); // define routes and socket

app.use(express.static(path.join(__dirname, '../build')));

app.get('*', function (req, res) {
  res.sendFile(INDEX);
});

httpsServer.listen(PORT);

// ========================================== //
// =========== LISTEN PORT 80 =============== //
const http_app = express();

/*http_app.use('/', express.static(path.join(__dirname, '../dist/'), {
  dotfiles: 'allow'
}));*/ //let requestHandler = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

http_app.get('*', function (req, res) {
	res.redirect('https://' + req.headers.host + req.url);
}); // have it listen on 80

http.createServer(http_app).listen(80); // set up a route to redirect http to https
// ========================================== //
