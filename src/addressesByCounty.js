var fs = require('fs');

module.exports = function getRecordDensity(client, data, callback) {

  client.search({
    requestTimeout: Infinity,
    index: 'pelias',
    body: {
      query: {
        match_all: {}
      },
      "aggs": {
        "countries": {
          "terms": {
            "field": "parent.country_a",
            "size": 500
          },
          "aggs": {
            "sources": {
              "terms": {
                "field": "source",
                "size": 100
              }
            },
            "layers": {
              "terms": {
                "field": "layer"
              }
            },
            "regions": {
              "terms": {
                "field": "parent.region_id",
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

    fs.writeFileSync('aggregation-results.json', JSON.stringify(results.aggregations, null, 2));
    console.log('Total countries: ', results.aggregations.countries.buckets.length);

    callback(null, results.aggregations);
  });
};