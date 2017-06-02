var elastic = require('elasticsearch');
var fs = require('fs');
var async = require('async');
var config = require('pelias-config').generate();

var getPopulation = require('./src/population');
var getRecordDensity = require('./src/recordDensity');
var parseAggs = require('./src/aggregationParser');

if (!config || !config.hasOwnProperty('esclient')) {
  throw new Error('Configuration must include an esclient block');
}

var client = new elastic.Client({
  host: config.esclient.hosts[0].host + ':' + config.esclient.hosts[0].port
});

var data = {};

async.waterfall(
  [
    getPopulation.bind(null, client, data),
    getRecordDensity.bind(null, client, data),
    parseAggs.bind(null, data)
  ],
  function (err) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    var output = [[
      'ISO3', 'name', 'population',
      'total_records', 'address_records', 'venue_records', 'street_records',
      'openstreetmap', 'openaddresses', 'geonames', 'whosonfirst' //, 'regions'
    ].join(', ')];

    Object.keys(data).forEach(function (key) {

      output.push([
        key, data[key].name,
        data[key].population,
        data[key].records.total,
        data[key].records.address,
        data[key].records.venue,
        data[key].records.street,
        data[key].records.openstreetmap,
        data[key].records.openaddresses,
        data[key].records.geonames,
        data[key].records.whosonfirst,
        //JSON.stringify(data[key].records.regions)
      ].join(','));
    });

    fs.writeFileSync('countries_data.csv', output.join('\n'));
    fs.writeFileSync('countries_data.json', JSON.stringify(data, null, 2));

    fs.writeFileSync('countries_data.js', 'var countryData = ' + JSON.stringify(data, null, 2) + ';');

    console.log('Done!');
  }
);
