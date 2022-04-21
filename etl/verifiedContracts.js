var Ethereum = require('./ethereum');
var Writer = require('./writers/psql');
var config = require('./config');

const rp = require('request-promise');
const cheerio = require('cheerio');

writer = new Writer({
   user: config.DAPPBOARD_PSQL_USER,
 host: config.DAPPBOARD_PSQL_HOST,
  database: config.DAPPBOARD_PSQL_DB,
  password:  config.DAPPBOARD_PSQL_PASSWORD,
  port: 5432,
  
});

//console.log('https://mainnet.infura.io/v3/05d87185155f4ab2a5ec4779b95cbc46')
var eth = new Ethereum.Provider(Ethereum.ProviderType.WS, config.DAPPBOARD_NODE_URL);

const verifiedContractListURL = 'https://etherscan.io/contractsVerified/';
const getJsonABIURL = "https://api.etherscan.io/api?module=contract&action=getabi&address="

async function  getABIFromEtherscan(address) {
  console.log(getJsonABIURL + address)
  var abi = [];
  try {
    var getResult = await rp(getJsonABIURL + address);
    abi = JSON.parse(getResult).result;
  } catch (error) {

  }
  //console.log(getResult)
  return (abi)
}



async function scrapeVerifiedContracts() {
  for (var i = 2176; i >= 0; i--) {
    console.log("Current Page", i)
    var html = await rp(verifiedContractListURL + i);
    var $ = cheerio.load(html);
    var tags = $('.address-tag').toArray();
    for (tag of tags) {
      var address = $(tag).text();
      var abi = [];
      try {
        abi = JSON.parse(await getABIFromEtherscan(address));
      } catch (error) {

      }
      for (abiElem of abi) {
        if (abiElem.type == "event") {
          var topic_0 = eth.w3.eth.abi.encodeEventSignature(abiElem);
          writer.insert('meta_events', {
            topic: eth.normalizeHash(topic_0),
            name: abiElem.name,
            parameters: JSON.stringify(abiElem.inputs),
          });
        }
      }
    }  }


}

scrapeVerifiedContracts()
