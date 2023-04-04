"use strict";

const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const app = express();
const knex = require('./db');

require('dotenv').config();

const PORT = process.env.PORT || 80;
const INDEX = path.join(__dirname, '..', 'build', 'index.html'); // Initialization.

const httpServer = http.createServer(app);/* https.createServer({
	key: fs.readFileSync('/etc/letsencrypt/live/simthunder.com/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/simthunder.com/cert.pem'),
	ca: fs.readFileSync('/etc/letsencrypt/live/simthunder.com/chain.pem')
}, app); // define routes and socket
*/
app.use(express.static(
	path.join(__dirname, '..','build'), 
	{ maxAge: '30d' }
));

app.use(express.json());

app.post('/api/metatags', (req, res) => {
	let data = req.body;

	knex('metatags').where({id: data.id}).andWhere({category: data.category}).first().then(metatag => {
		if(!metatag) {
		  knex('metatags').insert(data)
		  .then(() => {res.send({id: data.id, category: data.category})})
		  .catch(err => {console.error("Impossible to insert data on metatags cache: ", err); res.send(500).end();});
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
					var fullUrl = 'https://' + req.get('host') + req.originalUrl;
					htmlData = htmlData
						.replace(/__TITLE__/g, metatag.title ?? "Simthunder "  +  ({"carskins": "skin", "carsetup": "setup", "momentnfts": "moment NFT", "ownership": "ownership NFT"}[metatag.category]) + " asset")
						.replace(/__DESCRIPTION__/g, metatag.description)
						.replace(/__IMAGE__/g, metatag.image ?? "https://simthunder.com/assets/img/logo-fb.png")
						.replace("__URL__", fullUrl);
				} 

				res.send(htmlData);
				return;
			});
		}
	});
});

httpServer.listen(PORT);