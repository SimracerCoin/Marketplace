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

//app.use(cors());
app.use(express.json({limit: '1KB', extended: true}));

app.post('/api/metatags', (req, res) => {
	let data = req.body;

	knex('metatags').where({id: data.id}).andWhere({category: data.category}).first().then(metatag => {
		if(!metatag) {
		  knex('metatags').insert(data)
		  .then(() => {res.send({id: data.id, category: data.category})})
		  .catch(err => {console.error("Impossible to insert data on metatags cache: ", err); res.send(500).end();});
		} else {
			res.send({id: data.id, category: data.category});
		}
	  });
});

var lastUpdate = Date.now();
app.get('/api/lastupdate', (req,res) => {
	res.send(lastUpdate.toString());
});
app.put('/api/lastupdate', (req, res) => {
	lastUpdate = Date.now();
	res.status(204).send();
});

const cachedHTML = [];
app.get('/item/:category/:id', (req, res) => {

	if(cachedHTML[req.path]) {
		return res.send(cachedHTML[req.path]);
	}

	if(!isNaN(req.params.id) && ["carskins", "carsetup", "momentnfts", "ownership"].includes(req.params.category)) {
		fs.readFile(INDEX, 'utf8', (err, htmlData) => {
			if (err) {
				console.error('Error during file reading', err);
				return res.status(404).end();
			}

			//let sUrl = [];
			//if((sUrl = req.path.split('/')).length === 4) {
			knex('metatags').where({id: req.params.id}).andWhere({category: req.params.category}).first().then(metatag => {
				const fullUrl = 'https://' + req.get('host') + req.path;

				if(metatag) {	
					htmlData = htmlData
						.replace(/__TITLE__/g, metatag.title ?? "Simthunder "  +  ({"carskins": "skin", "carsetup": "setup", "momentnfts": "moment NFT", "ownership": "ownership NFT"}[req.params.category]) + " asset")
						.replace(/__DESCRIPTION__/g, metatag.description ?? "")
						.replace(/__IMAGE__/g, metatag.image ?? "https://simthunder.com/assets/img/logo-fb.png")
						.replace(/__URL__/g, fullUrl);

						cachedHTML[req.path] = htmlData;
				}

				res.send(htmlData);
			});
			//}
		});
	}
});

app.get('*', function (req, res) {
	res.sendFile(INDEX);
});

app.use(helmet());
http.createServer(app).listen(PORT);