module.exports = function getPopulation(client, data, callback) {
  client.search({
      index: 'pelias',
      body: {
        "query": {
          "filtered": {
            "query": {
              "bool": {
                "must" : [
                  { "term" : { "layer" : "country" } },
                  { "term" : { "source" : "whosonfirst" } }
                ]
              }
            }
          }
        },
        "size": 500,
        "fields": ["population", "parent.country_a", "parent.country"]
      }
    },
    function (err, results) {
      if (err || !results.hasOwnProperty('hits') || !results.hits.hasOwnProperty('hits')) {
        console.log(err.message);
        throw new Error('Failed to execute country population', err);
      }

      results.hits.hits.forEach(function (hit) {

        if (!hit.fields.hasOwnProperty('parent.country_a') ||
            !hit.fields.hasOwnProperty('parent.country') ||
            !hit.fields.hasOwnProperty('population')) {

          console.log('bad country data:', hit.fields);
          return;
        }

        var iso3 = hit.fields['parent.country_a'][0];
        var name = hit.fields['parent.country'][0];
        var population = hit.fields.population[0];

        if (data.hasOwnProperty(iso3) &&
          data[iso3].hasOwnProperty('population') &&
          data[iso3].population !== population) {
          console.log('oops, this one already exists', hit.fields, data[iso3]);

          data[iso3].population = Math.max(data[iso3].population, population);
          return;
        }
        data[iso3] = {
          name: name,
          population: population
        };
      });
      callback();
    });
};