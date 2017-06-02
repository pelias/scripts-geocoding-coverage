module.exports = function getPopulation(client, data, callback) {
  client.search({
      index: 'pelias',
      body: {
        "query": {
          "filtered": {
            "query": {
              "bool": {
                "must": [
                  {
                    "match": {
                      "layer": "region"
                    }
                  }
                ]
              }
            }
          }
        },
        "size": 500000,
        "fields": ["population", "parent.country_a", "parent.region", "parent.region_a"]
      }
    },
    function (err, results) {
      if (err || !result.hasOwnProperty('hits') || !results.hits.hasOwnProperty('hits')) {
        throw new Error('Failed to execute region population', err);
      }

      results.hits.hits.forEach(function (hit) {

        if (!hit.fields.hasOwnProperty('parent.country_a') ||
            !hit.fields.hasOwnProperty('parent.region_a') ||
            !hit.fields.hasOwnProperty('parent.region') ||
            !hit.fields.hasOwnProperty('population')) {

          console.log('bad region data:', hit.fields);
          return;
        }

        var iso3 = hit.fields['parent.country_a'][0];
        var abbr = hit.fields['parent.region_a'][0];
        var name = hit.fields['parent.region'][0];
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
      callback(client, data);
    });
};