var Ethereum = require('./ethereum');
var Writer = require('./writers/psql');
var TokenScrapper = require('./utils/token_scraper');
var config = require('./config');

writer = new Writer({
   user: config.DAPPBOARD_PSQL_USER,
 host: config.DAPPBOARD_PSQL_HOST,
  database: config.DAPPBOARD_PSQL_DB,
  password:  config.DAPPBOARD_PSQL_PASSWORD,
  port: 5432,
  
});

var eth = new Ethereum.Provider(Ethereum.ProviderType.WS, config.DAPPBOARD_NODE_URL);
var scraper = new TokenScrapper(eth, writer);

var scrapMissingTokens = async function(eth, writer) {
  // We query all token addresses that are not in the token table
  var query = `
  SELECT token_transfers.token_address FROM token_transfers WHERE token_address NOT IN (
      SELECT tokens.address from tokens GROUP BY tokens.address
  ) GROUP BY token_transfers.token_address LIMIT 10000;
  `;
  var missingContracts = await writer.executeAsync(query);
  for (var i = 0; i < missingContracts.length; i++) {
    var contract = missingContracts[i].token_address;
    scraper.scrape(contract)
  }
/*  setTimeout(function() {
      scrapMissingTokens(eth, writer);
    },
    40000)*/
}

scrapMissingTokens(eth, writer);
