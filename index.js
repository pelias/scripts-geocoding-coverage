const Promise = require('bluebird')
const elastic = require('elasticsearch');
const fs = require('fs');
const config = require('pelias-config').generate();
const sources = ['openaddresses', 'openstreetmap', 'geonames', 'whosonfirst']
const layers = ["address", "street", "venue", "locality", "neighbourhood", "localadmin", "postalcode", "county", "macrocounty", "region", "macroregion", "country", "macrohood", "borough", "dependency", "disputed"]

if (!config || !config.hasOwnProperty('esclient')) {
  throw new Error('Configuration must include an esclient block');
}

var client = Promise.promisifyAll(new elastic.Client({
  host: config.esclient.hosts[0].host + ':' + config.esclient.hosts[0].port
}));

// Get all countries
client.searchAsync({
  requestTimeout: Infinity,
  index: config.api.indexName,
  body: {
    "query": {
      "bool": {
        "must": [
          { "match": { "source": "whosonfirst" } },
          { "match": { "layer": "country" } }
          ]
      }
    },
    "size": 400
  }
}).then(results => {
  console.log(`Found ${results.hits.total} countries`)
  return results.hits.hits
}).map(hits => {
  return {
    name: hits._source.parent.country[0],
    code: hits._source.parent.country_a[0] || 'UNKNOWN',
    population: hits._source.population,
    records: {}
  }
}).then(countries => {
  // Sort countries by code and ensure that UNKNOWN is at the end
  return countries.sort((a, b) => {
    if (a.code === 'UNKNOWN') return 1
    if (b.code === 'UNKNOWN') return -1
    if (a.code < b.code) return -1
    if (a.code > b.code) return 1
    return 0
  })
}).map(country => {
  // Get number of elements by country and source
  return Promise.reduce(sources, (country, source) => {
    return client.searchAsync({
      requestTimeout: Infinity,
      index: config.api.indexName,
      body: {
        "query": {
          "bool": {
            "must": [
              { "match": { "parent.country": country.name } },
              { "match": { "source": source } }
              ]
          }
        },
        "size": 0
      }
    }).then(result => {
      country.records[source] = result.hits.total
      return country
    })
  }, country)
}).map(country => {
  // Get number of elements by country and layer
  return Promise.reduce(layers, (country, layer) => {
    return client.searchAsync({
      requestTimeout: Infinity,
      index: config.api.indexName,
      body: {
        "query": {
          "bool": {
            "must": [
              { "match": { "parent.country": country.name } },
              { "match": { "layer": layer } }
              ]
          }
        },
        "size": 0
      }
    }).then(result => {
      country.records[layer] = result.hits.total
      return country
    })
  }, country)
}).reduce((countries, country) => {
  // Format all entries
  const code = country.code
  countries[code] = countries[code] || { }
  countries[code].name = country.name
  countries[code].population = (countries[code].poupulation || 0) + country.population
  countries[code].records = countries[code].records || {}

  Object.keys(country.records).forEach(key => {
    if (!country.records[key]) return;
    countries[code].records.total = (countries[code].records.total || 0) + country.records[key]
    countries[code].records[key] = (countries[code].records[key] || 0) + country.records[key]
  })
  return countries
}, {}).then(countries => {

      var output = [[
        'ISO3', 'name', 'population',
        'total_records', 'address_records', 'venue_records', 'street_records',
        'openstreetmap', 'openaddresses', 'geonames', 'whosonfirst'
      ].join(', ')];

      Object.keys(countries).forEach(function (key) {

        output.push([
          key, countries[key].name,
          countries[key].population,
          countries[key].records.total,
          countries[key].records.address,
          countries[key].records.venue,
          countries[key].records.street,
          countries[key].records.openstreetmap,
          countries[key].records.openaddresses,
          countries[key].records.geonames,
          countries[key].records.whosonfirst
        ].join(','));
      });

      fs.writeFileSync('countries_data.csv', output.join('\n'));
      fs.writeFileSync('countries_data.json', JSON.stringify(countries, null, 2));
      fs.writeFileSync('countries_data.js', 'var countryData = ' + JSON.stringify(countries, null, 2) + ';');

      console.log('Done!');
});