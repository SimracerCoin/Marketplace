"use strict";

const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const app = express();
const knex = require('./db');
const cors = require('cors');

require('dotenv').config();

const PORT = process.env.PORT || 443;
const INDEX = path.join(__dirname, '..', 'build', 'index.html'); // Initialization.

const httpsServer = PORT === 443 ? https.createServer({
	key: fs.readFileSync('/etc/letsencrypt/live/simthunder.com/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/simthunder.com/cert.pem'),
	ca: fs.readFileSync('/etc/letsencrypt/live/simthunder.com/chain.pem')
}, app) : http.createServer(app); // define routes and socket

app.use(express.static(
	path.join(__dirname, '..','build'), 
	{ maxAge: '30d' }
));

app.use(express.json());

app.post('/api/metatags', (req, res) => {
	let data = req.body;

	knex('metatags').where({id: data.id}).andWhere({category: data.category}).first().then(metatag => {
		console.log("add metatag to db");
		if(!metatag) {
		  knex('metatags').insert(data).then(() => {console.log("item added"); res.send({id: data.id, category: data.category})});
		}
	  });
});

app.get('*', (req, res) => {
	fs.readFile(INDEX, 'utf8', (err, htmlData) => {
		if (err) {
            console.error('Error during file reading', err);
            res.status(404).end();
			return;
        }

		console.error('params', req);
		let sUrl = [];
		if((sUrl = req.path.split('/')).length === 4) {
			knex('metatags').where({id: sUrl[3]}).andWhere({category: sUrl[2]}).first().then(metatag => {
				if(metatag) {
					htmlData = htmlData
						.replace("__TITLE__", metatag.title)
						.replace("__DESCRIPTION__", metatag.description)
						.replace("__IMAGE__", "https://simthunder.infura-ipfs.io/ipfs/" + metatag.image);
				} 

				res.send(htmlData);
				return;
			});
		}
	});
});

httpsServer.listen(PORT);

if(PORT === 443) {
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
} else {
	app.use(cors({
		origin: '*'
	}));
}