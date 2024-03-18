const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const use_eip_1559 = process.env.REACT_APP_USE_EIP_1559 === "true";

const web3 = require('web3');

export default class UIHelper {

  static defaultGasLimit = 7500000;
  static simsElements = ["iRacing", "F12020", "rFactor", "Assetto Corsa"];

  static scrollToTop = () => {
    // scroll to top
    document.body.scrollTop = 0;            // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
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

  static hideSpinning = () => {
    const elem = document.getElementById("wait-div");
    if(elem) {
      elem.parentNode.removeChild(elem);
    }
  }

  static transactionOnConfirmation = (message, redirect = "/") => {
    const elem = document.getElementById("wait-div");
    if(elem) {
      elem.parentNode.removeChild(elem);
    }
    alert(message);

    if (redirect)
      window.location.href = redirect;
  }

  static transactionOnError = (error) => {
    const elem = document.getElementById("wait-div");
    if(elem) {
      elem.parentNode.removeChild(elem);
    }
    alert("Something wrong. Please try again.");
    console.error(error);
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

  static fetchSRCPriceVsUSD = async (contract_address = '0x16587cf43f044aba0165ffa00acf412631194e4b', vs_currency = 'usd') => {
    
    try {
      //'0x16587cf43f044aba0165ffa00acf412631194e4b','usd'
      const uri = 'https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=' + contract_address +'&vs_currencies=' +  vs_currency;
      const priceUSD = await fetch(uri);
      const priceObj = await priceUSD.json();
      const key = Object.keys(priceObj);
      return Number(priceObj[key]['usd']); 
    } catch(err) {
      console.error(err);
      return 1;
    }
  }


  //using gas station
  static calculateGasUsingStation = async (fromAccount) => {
   const convertGwei2Wei = (input) =>  {
    console.log("convert " + input + " (gwei) to (wei) => " + web3.utils.toBN(Number(input) * 1000000000) );
    return web3.utils.toBN(Number(input) * 1000000000);
  }

  let gas = {
      gasLimit: UIHelper.defaultGasLimit,
      from: fromAccount
  };

  if(use_eip_1559) {
    try {
        const response = await fetch('https://gasstation.polygon.technology/v2');
        const feesData = await response.json();
        //use "fast" instead of "standard"
        if(feesData && feesData.fast) {
          console.log('gassatation data: ', feesData);

          gas.maxFeePerGas = convertGwei2Wei(feesData.fast.maxFee);
          gas.maxPriorityFeePerGas = convertGwei2Wei(feesData.fast.maxPriorityFee);
        }
    } catch (error) {
      console.log("gasstation error: ", error);

      gas.maxFeePerGas = convertGwei2Wei(40); //40 gwei
      gas.maxPriorityFeePerGas = convertGwei2Wei(40);
    }
  }

  return gas;
}
//PUT this on some other file in the future
  static addDaysToDate = (date, days) => {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Extracts teh number of days from the string auction option
   * @param {*} string one of ["1 day", "3 days", "7 days", "1 month", "3 month", "6 month"];
   * @returns 
   */
  static extractDaysFromAuctionString = (string) => {
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

  static async callWithRetry(callObject, options = {}) {
    const maxAttempts = 10;
    let result, attempt = 0;

    const sleep = (milliseconds) => {
      return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
    
    do {
      try {
        result = await callObject.call(options);
      } catch(err) {
        console.error(`Attempt ${attempt + 1} failed: ${err.message}`);
        await sleep(1000 * (attempt+1));
      }
    } while(!result && ++attempt < maxAttempts);
  
    if(maxAttempts === attempt)
      throw new Error("Exceeded maximum retries");
  
    return result;
  }

 
}