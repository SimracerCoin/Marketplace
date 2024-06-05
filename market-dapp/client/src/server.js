"use strict";

const express = require('express');
const path = require('path');
const http = require('http');
const fs = require('fs');
const app = express();
const knex = require('./db');
const cors = require('cors');
const helmet = require('helmet');
const Web3 = require('web3');
const axios = require('axios');

require('dotenv').config();

const PORT = process.env.PORT || 80;
const INDEX = path.join(__dirname, '..', 'build', 'index.html'); // Initialization.

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

// Configure web3 with your Polygon provider
const ownerPrivateKey = process.env.PRIVATE_KEY;
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.REACT_APP_NETWORK_URL));

// Get the contract owner's address
const account = web3.eth.accounts.privateKeyToAccount(ownerPrivateKey);

const chainId = parseInt(process.env.REACT_APP_NETWORK_ID);
const use_eip_1559 = process.env.REACT_APP_USE_EIP_1559 === "true";
const confirmationsNeeded = parseInt(process.env.REACT_APP_NUMBER_CONFIRMATIONS_NEEDED);
const contractAddress = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'STMarketplace.json'), 'utf8'))?.address;

// Function to get gas price estimates from Polygon Gas Station
async function getGasPrice() {
	try {
	  const response = await axios.get('https://gasstation.polygon.technology/v2');
	  const { fast } = response.data;
  
	  const maxFeePerGas = web3.utils.toWei(fast.maxFee.toString(), 'gwei');
	  const maxPriorityFeePerGas = web3.utils.toWei(fast.maxPriorityFee.toString(), 'gwei');
  
	  return { maxFeePerGas, maxPriorityFeePerGas };
	} catch (error) {
	  console.error('Error fetching gas price:', error);
	  // Fallback values in case of error
	  return {
		maxFeePerGas: web3.utils.toWei('50', 'gwei'),
		maxPriorityFeePerGas: web3.utils.toWei('2', 'gwei')
	  };
	}
  }

app.post('/api/methods/:contract/:method', async (req, res) => {
	try {
		// Read contract ABI from the JSON file
		const abiPath = path.resolve(__dirname, req.params.contract + '.json');
		const contractJSON = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

		// Initialize the contract
		const contract = new web3.eth.Contract(contractJSON.abi, contractAddress);

		// Create a transaction object
		let tx = {
			from: account?.address,
			to: contractAddress,
			chainId,
			data: contract.methods[req.params.method](...req.body).encodeABI(),
      		gas: await contract.methods[req.params.method](...req.body).estimateGas({ from: account?.address })
		};

		if(use_eip_1559) {
			// Get gas price estimates
			tx = {...tx, ...await getGasPrice()};
		}
		console.log(tx);

		// Sign the transaction
		const signedTx = await web3.eth.accounts.signTransaction(tx, ownerPrivateKey);

		// Send the transaction and wait for 2 confirmations
		await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
			.once('confirmation', (confNumber, receipt) => {
				if (confNumber === confirmationsNeeded) {
					res.json({ success: true, receipt });
				}
			})
			.on('error', error => {
				console.error('Transaction error:', error);
				res.status(500).json({ success: false, error: error.message });
			});
	} catch (error) {
	  	res.status(500).json({ success: false, error: error.message });
	}
});

var lastUpdate = Date.now();
app.get('/api/lastupdate', (_, res) => res.send(lastUpdate.toString()));
app.put('/api/lastupdate', (_, res) => {
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

app.get('*', (_, res) => res.sendFile(INDEX));

app.use(helmet());
http.createServer(app).listen(PORT);