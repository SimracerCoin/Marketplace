const ethers = require('ethers');
const axios = require('axios');

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default class UIHelper {

  static defaultGasLimit = 500000;


  static getProvider = async function(rpc_uri) {
    return new ethers.providers.JsonRpcProvider({url: rpc_uri });
  }

  static showSpinning = function (textToDisplay) {
    var elem1 = document.createElement('div');
    elem1.style.top = window.scrollY + 'px';
    elem1.className = 'spinner-outer';
    elem1.id = 'wait-div';
    
    var elem2 = document.createElement('div');
    elem2.className = 'spinner';
    elem1.appendChild(elem2);

    var elem3 = document.createElement('div');
    elem3.className = 'h-100 d-flex justify-content-center align-items-center spinner-msg';

    var text = document.createTextNode(textToDisplay ? textToDisplay : "Wait for the transaction to be confirmed...");

    elem3.appendChild(text);
    elem1.appendChild(elem3);
    document.body.appendChild(elem1);

    if (!document.onscroll)
      document.addEventListener('scroll', function (e) {
        let elem = document.getElementById('wait-div');
        if(elem)
          elem.style.top = window.scrollY + 'px';

        document.onscroll = true;
      });
  }

  static hiddeSpinning = function() {
    const elem = document.getElementById("wait-div");
    if(elem) {
      elem.parentNode.removeChild(elem);
    }
  }

  static transactionOnConfirmation = function (message, redirect = "/") {
    document.body.removeChild(document.getElementById('wait-div'));
    alert(message);

    if (redirect)
      window.location.href = redirect;
  }

  static transactionOnError = function (error) {
    const elem = document.getElementById("wait-div");
    if(elem) {
      elem.parentNode.removeChild(elem);
    }
    alert("Something wrong. Please try again.");
    console.log(error);
  }

  /**
   * 
   * curl -X 'GET' \
  'https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0x16587cf43f044aba0165ffa00acf412631194e4b&vs_currencies=usd' \
  -H 'accept: application/json'

  https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0x16587cf43f044aba0165ffa00acf412631194e4b&vs_currencies=usd

  {
  "0x16587cf43f044aba0165ffa00acf412631194e4b": {
    "usd": 0.0178802
  }
  }
   */

  static fetchSRCPriceVsUSD = async function(contract_address = '0x16587cf43f044aba0165ffa00acf412631194e4b', vs_currency = 'usd') {
    
    //'0x16587cf43f044aba0165ffa00acf412631194e4b','usd'
    const uri = 'https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=' + contract_address +'&vs_currencies=' +  vs_currency;
    return fetch(uri);
  }


  //using gas station
//https://github.com/ethers-io/ethers.js/issues/2828
//workaround for "transaction underpriced" error
static calculateGasUsingStation = async function(gasLimit, fromAccount) {

   const convertGwei2Wei = (input) =>  {
    console.log("convert " + input + " (gwei) to (wei) => " + ethers.BigNumber.from(input * 1000000000) );
    return ethers.BigNumber.from(input * 1000000000);
  }

  let gas = {
      gasLimit: Number(Math.trunc(gasLimit * 1.1)),   //this would add extra 10% if needed
      from: fromAccount,
      maxFeePerGas: Number(ethers.BigNumber.from(40000000000)), //40 gwei
      maxPriorityFeePerGas: Number(ethers.BigNumber.from(40000000000))
  };

  try {
      const {data} = await axios({
          method: 'get',
          url: 'https://gasstation-mainnet.matic.network/v2'
      });
      console.log('gassatation data: ', data);

      return { 
        gasLimit: Number(Math.trunc(gasLimit * 1.1)),
        from: fromAccount,
        maxPriorityFeePerGas : Number(convertGwei2Wei( Math.trunc(data.fast.maxPriorityFee * 1.1))),
        maxFeePerGas : Number(convertGwei2Wei( Math.trunc(data.fast.maxFee * 1.1)))
      }

  } catch (error) {
    
    return gas;
  }
  
}
//PUT this on some other file in the future
  static addDaysToDate = function (date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Extracts teh number of days from the string auction option
   * @param {*} string one of ["1 day", "3 days", "7 days", "1 month", "3 month", "6 month"];
   * @returns 
   */
  static extractDaysFromAuctionString = function (string) {
    if(string === "1 day") {
      return 1;
      
    } else if(string === "3 days") {
       return 3;
    }
    else if(string === "7 days") {
      return 7;
    }
    else if(string === "1 month") {
      return 30;
    }
    else if(string === "3 month") {
      return 90;
    }
    else if(string === "6 month") {
      return 180;
    }
    return 1;
  }

  static formaDateAsString(date) {
    let splited = date.split("-");
    if(splited.length !== 3) {
      return date; //not touch it
    }
    const year = splited[0];
    const month = Number(splited[1]);
    const day = splited[2];
    return monthNames[month -1] + " " + day + ", " + year;
  }  

 
}