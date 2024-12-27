"use strict";

const Web3 = require('web3');
const path = require('path');
const fs = require('fs');
const ipfs = require('../src/ipfs');
const knex = require('../src/db');

require('dotenv').config();

const NFT_AMOUNT = 5;

// Configure web3 with your Polygon provider
const ownerPrivateKey = process.env.PRIVATE_KEY;
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.REACT_APP_NETWORK_URL));

// Get the contract owner's address
const account = web3.eth.accounts.privateKeyToAccount(ownerPrivateKey);

const chainId = parseInt(process.env.REACT_APP_NETWORK_ID);
const contractJSON = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'src', 'SimracingMomentDrop.json'), 'utf8'));
const contractAddress = process.env.REACT_APP_DROPS.split(',')[0];

// Initialize the contract
const contract = new web3.eth.Contract(contractJSON.abi, contractAddress);

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const generateQueue = (videos) => {
    const typeToCopies = {
        UNIQUE: 1,
        Legendary: 3,
        Epic: 10,
        Special: 20,
        Common: 40,
    };

    let queue = [];

    videos.forEach((video) => {
        const { rarity } = video;
        const copies = typeToCopies[rarity];
        if (copies) {
            queue = queue.concat(Array(copies).fill(video));
        }
    });

    return shuffleArray(queue);
};

const groupQueue = (queue, groupSize) => {
    const groups = [];
    for (let i = 0; i < queue.length; i += groupSize) {
        groups.push(queue.slice(i, i + groupSize));
    }
    return groups;
};

const toJsonMetadata = (video) => {
    if (!video.animation_url || !video.image) {
        throw new Error('Invalid video object: missing required fields');
    }
    return {
        description: video.description,
        name: video.name,
        image: 'ipfs://' + video.image,
        animation_url: 'ipfs://' + video.animation_url,
        attributes: [
            { trait_type: 'series', value: video.series },
            { trait_type: 'date', value: video.date },
            { trait_type: 'simulator', value: video.simulator },
            { trait_type: 'rarity', value: video.rarity },
        ],
    };
};

const uploadToIpfs = async (metadata) => {
    try {
        const { path } = await ipfs.add(JSON.stringify(metadata));
        return path;
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw error;
    }
};

const dropId = 1;
const price = "1"; //SRC
const series = "Serie 1";
const packType = "Pack Type 1";

// Example usage:
const videos = [
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Unique', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Legendary', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Legendary', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Legendary', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Epic', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Epic', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Epic', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Epic', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Special', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Special', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Special', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Special', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Special', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Common', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Common', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Common', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Common', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Common', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series },
    { animation_url: 'QmY8YuChBo9o8kKKNgDmiaZ6KmEXnH4GAnGdvcH5bdhKcu', rarity: 'Common', description: 'Teste', name: 'Teste', image: 'QmRF5VBFdD4CaXjM9UwFkhifGaGXGzq1eq8VdzpRdfBtXN', date: '2024/12/09', simulator: 'F12020', series }
];

(async () => {
    try {
        console.log('Uploading videos to IPFS...');
        for (const video of videos) {
            video.metadata = await uploadToIpfs(toJsonMetadata(video));
        }

        console.log('Generating queue...');
        const queue = generateQueue(videos);
        const groupedQueue = groupQueue(queue, NFT_AMOUNT);

        console.log(`Deleting previous drop data (drop ID: ${dropId})...`);
        await knex('drops').del().where({ drop: dropId });

        console.log('Storing metadata in the database...');
        const dbInsertions = [];
        groupedQueue.forEach((pack, packId) => {
            pack.forEach((video, nftId) => {
                const record = {
                    drop: dropId,
                    pack: parseInt(packId) + 1,
                    moment: parseInt(packId) * NFT_AMOUNT + parseInt(nftId) + 1,
                    metadata: video.metadata,
                };
                dbInsertions.push(record);
            });
        });
        await knex('drops').insert(dbInsertions);

        
        console.log('Creating packs on-chain...');
        for (const packId of Object.keys(groupedQueue)) {

            // Create a transaction object
            const data = [NFT_AMOUNT, web3.utils.toWei(price), series, packType, [account.address], [100], [account.address], [100]];
            const tx = {
                from: account?.address,
                to: contractAddress,
                chainId,
                data: contract.methods.createPack(...data).encodeABI(),
                gasLimit: await contract.methods.createPack(...data).estimateGas({ from: account?.address }),
                gasPrice: Math.floor((await web3.eth.getGasPrice()) * 1.3)
            };

            // Sign the transaction
            const signedTx = await web3.eth.accounts.signTransaction(tx, ownerPrivateKey);
            console.log(`Transaction sent for pack ${parseInt(packId) + 1}: ${signedTx.transactionHash}`);
            
            // Send the transaction and wait for 2 confirmations
		    await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            console.log(`Pack ${parseInt(packId) + 1} created successfully.`);
        }
        console.log('All packs created successfully.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
    return;
})();
