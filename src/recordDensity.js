var fs = require('fs');

module.exports = function getRecordDensity(client, data, callback) {

  client.search({
    requestTimeout: Infinity,
    index: 'pelias',
    body: {
      "size": 0,
      "aggs": {
        //"records_without_parent" : {
        //  "missing" : { "field" : "parent" }
        //},
        "countries": {
          "terms": {
            "field": "parent.country_a",
            "missing": "unknown",
            "size": 500
          },
          "aggs": {
            "sources": {
              "terms": {
                "field": "source",
                "missing": "unknown",
                "size": 100
              }
            },
            "layers": {
              "terms": {
                "field": "layer",
                "missing": "unknown",
                "size": 100
              }
            },
            "regions": {
              "terms": {
                "field": "parent.region_id",
                "missing": "unknown",
                "size": 100000
              },
              "aggs": {
                "region": {
                  "top_hits": {
                    "size": 1,
                    "_source": {
                      "include": ["parent.region"]
                    }
                  }
                },
                //"layers": {
                //  "terms": {
                //    "field": "layer",
                //    "size": 100
                //  },
                //  "aggs": {
                //    "sources": {
                //      "terms": {
                //        "field": "source",
                //        "size": 100
                //      }
                //    }
                //  }
                //}
              }
            }
          }
        }
      }
    }
  }, function (err, results) {

    if (err) {
      console.log(JSON.stringify(err, null, 2));
      throw err;
    }

    fs.writeFileSync('record-density-results.json', JSON.stringify(results, null, 2));
    console.log('Total countries: ', results.aggregations.countries.buckets.length);

    callback(null, results.aggregations);
  });
};