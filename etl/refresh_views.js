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

var refreshViews = async function(eth, writer) {
  // We query all token addresses that are not in the token table
  var query = `
    REFRESH MATERIALIZED VIEW CONCURRENTLY token_transfers_daily ;
    REFRESH MATERIALIZED VIEW CONCURRENTLY token_transfers_summary ;
  `;
  var missingContracts = await writer.executeAsync(query);

/*  setTimeout(function() {
      scrapMissingTokens(eth, writer);
    },
    40000)*/
}

refreshViews(eth, writer);
