import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';

const projectID = process.env.REACT_APP_INFURA_IPFS_PROJECT_ID;
const apiSecret = process.env.REACT_APP_INFURA_IPFS_API_SECRET;

const auth = 'Basic ' + Buffer.from(projectID + ':' + apiSecret).toString('base64');

const ipfs = create({ 
    host: 'ipfs.infura.io', 
    port: 5001, 
    protocol: 'https',
    headers: {
        authorization: auth
    }
});

export default ipfs;