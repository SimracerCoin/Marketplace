const { create } = require('ipfs-http-client');

//import { create } from 'ipfs-http-client';
//import { Buffer } from 'buffer';

require('dotenv').config();

const projectID = process.env.REACT_APP_INFURA_IPFS_PROJECT_ID;
const apiSecret = process.env.REACT_APP_INFURA_IPFS_API_SECRET;

const auth = 'Basic ' + Buffer.from(projectID + ':' + apiSecret).toString('base64');

module.exports = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: auth,
    },
});