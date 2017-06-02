var country = require('countryjs');
var fs = require('fs');
var _ = require('lodash');

module.exports = function (data, aggregations, callback) {

  var rows = ['iso3,name,records'];
  var aggs = {};

  aggregations.countries.buckets.forEach(function (bucket) {

    var iso3 = bucket.key.toUpperCase();
    var name = country.name(iso3, 'ISO3');

    data[iso3] = data[iso3] || {};
    data[iso3].records = {
      total: bucket.doc_count,
      regions: []
    };

    bucket.sources.buckets.forEach(function (source) {
      data[iso3].records[source.key] = source.doc_count;
    });

    bucket.layers.buckets.forEach(function (layer) {
      data[iso3].records[layer.key] = layer.doc_count;
    });

    bucket.regions.buckets.forEach(function (region) {
      data[iso3].records.regions.push({
        name: _.get(region.region.hits.hits[0]['_source'], 'parent.region[0]', 'unknown'),
        docs: region.doc_count });
    });

    aggs[iso3] = [iso3, name, bucket.doc_count];
    rows.push(aggs[iso3].join(', '));
  });

  fs.writeFileSync('aggregation-parser-results.csv', rows.join('\n'));

  callback();
};