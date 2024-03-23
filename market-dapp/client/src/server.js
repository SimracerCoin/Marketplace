"use strict";

const express = require('express');
const path = require('path');
const http = require('http');
const fs = require('fs');
const app = express();
const knex = require('./db');
const cors = require('cors');
const helmet = require('helmet');

require('dotenv').config();

const PORT = process.env.PORT || 80;
const INDEX = path.join(__dirname, '..', 'build', 'index.html'); // Initialization.

app.use(express.static(
	path.join(__dirname, '..', 'build'), 
	{ maxAge: '30d' }
));

app.use(cors());
app.use(helmet());
app.use(express.json({limit: '1KB', extended: true}));

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

app.get('/item/:category/:id', (req, res) => {
	fs.readFile(INDEX, 'utf8', (err, htmlData) => {
		if (err) {
            console.error('Error during file reading', err);
            res.status(404).end();
			return;
        }

		//let sUrl = [];
		//if((sUrl = req.path.split('/')).length === 4) {
		knex('metatags').where({id: req.params.id}).andWhere({category: req.params.category}).first().then(metatag => {
			const fullUrl = 'https://' + req.get('host') + req.originalUrl;

			if(metatag) {	
				htmlData = htmlData
					.replace(/__TITLE__/g, metatag.title ?? "Simthunder "  +  ({"carskins": "skin", "carsetup": "setup", "momentnfts": "moment NFT", "ownership": "ownership NFT"}[req.params.category]) + " asset")
					.replace(/__DESCRIPTION__/g, metatag.description ?? "")
					.replace(/__IMAGE__/g, metatag.image ?? "https://simthunder.com/assets/img/logo-fb.png")
					.replace("__URL__", fullUrl);
			} else {
				htmlData = htmlData
					.replace(/__TITLE__/g, "Simthunder "  +  ({"carskins": "skin", "carsetup": "setup", "momentnfts": "moment NFT", "ownership": "ownership NFT"}[req.params.category]) + " asset")
					.replace(/__DESCRIPTION__/g, "")
					.replace(/__IMAGE__/g, "https://simthunder.com/assets/img/logo-fb.png")
					.replace("__URL__", fullUrl);
			}

			res.send(htmlData);
			return;
		});
		//}
	});
});

http.createServer(app).listen(PORT);