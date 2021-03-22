const IPFS = require('ipfs-http-client');

const ipfs = new IPFS({ 
    host: 'ipfs.infura.io', 
    port: 5001, 
    protocol: 'https',
    headers: {'Access-Control-Allow-Origin': '*'}
});

export default ipfs;