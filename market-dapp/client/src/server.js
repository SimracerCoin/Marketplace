"use strict";

const express = require('express');
const path = require('path');
const http = require('http');
const fs = require('fs');
const app = express();
const knex = require('./db');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');

require('dotenv').config();

const PORT = process.env.PORT || 80;
const INDEX = path.join(__dirname, '..', 'build', 'index.html'); // Initialization.
const IPFS_GATEWAY = process.env.IPFS_GATEWAY;
const PROJECT_ID = process.env.REACT_APP_INFURA_IPFS_PROJECT_ID;
const SECRET_KEY = process.env.REACT_APP_INFURA_IPFS_API_SECRET;

// Create the basic authentication header
const authHeader = `Basic ${Buffer.from(`${PROJECT_ID}:${SECRET_KEY}`).toString('base64')}`;

app.use(express.static(
	path.join(__dirname, '..', 'build'), 
	{ maxAge: '30d' }
));

app.use(cors());
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
app.get('/api/lastupdate', (req, res) => res.send(lastUpdate.toString()));
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

app.get('/ipfs/:cid', async (req, res) => {
	const { cid } = req.params;
	// Get the domain that made the request
	const origin = req.headers.origin || req.headers.referer || 'Unknown';

	try {
		const response = await axios.get(`${IPFS_GATEWAY}/${cid}`, {
			headers: {
			  'Authorization': authHeader,
			  'Origin': origin,
			  'User-Agent': 'Node.js (linux; x64)',
			},
			responseType: 'stream'
		  });

		// Set appropriate headers
		res.setHeader('Content-Type', response.headers['content-type']);
		res.setHeader('Content-Length', response.headers['content-length']);

		 // Set cache control headers
		 res.setHeader('Cache-Control', 'public, max-age=2592000'); // Cache for 30d
		 res.setHeader('ETag', cid); // Use CID as ETag

		// Pipe the data to the response
		response.data.pipe(res);
	} catch (error) {
		console.error('Error fetching file from IPFS:', error);
		res.status(500).send('Error fetching file from IPFS');
	}
});

app.get('*', (req, res) => res.sendFile(INDEX));

app.use(helmet());
http.createServer(app).listen(PORT);