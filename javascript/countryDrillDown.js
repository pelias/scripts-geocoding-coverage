function setupCountryDrillDown() {
  // populate dropdown country selector
  var countrySelect = document.getElementById('countrySelect');

  var countryNames = [];
  Object.keys(countryData).forEach(function (iso3) {
    var country = countryData[iso3];
    countryNames.push(country.name + ' (' + iso3 + ')');
  });

  countrySelect.addEventListener('awesomplete-selectcomplete', function (e) {
    console.log('selection changed to ', e.text.label);

    // the end of the string contains the ISO3 code of the country
    var iso3 = e.text.label.substr(-4,3);
    populateCountryDrillDown(iso3, e.text.label);
  });

  new Awesomplete(countrySelect, {list: countryNames});

  //resetCountrySelection();
  var query = location.search.substr(1);
  var params = {};
  query.split("&").forEach(function(part) {
    var item = part.split("=");
    params[item[0]] = decodeURIComponent(item[1]);
  });

  if (params.hasOwnProperty('country') && params.country.length === 3) {
    populateCountryDrillDown(params.country);
  }
  else {
    populateCountryDrillDown('USA', 'United States (USA)');
  }
}

function resetCountrySelection(force) {
  console.log('foo');
  var elem = document.getElementById("countrySelect");
  if (force || elem && elem.value === '' && window.detailsTable) {
    window.detailsTable.search();

    var drillDownDiv = document.getElementById('countryDrillDown');
    if (drillDownDiv) {
      drillDownDiv.style.visibility = 'hidden';
    }
  }

  console.log('bar');

  if (force) {
    elem.value = '';
  }
}

function populateCountryDrillDown(iso3, fullName) {
  fullName = fullName || (countryData[iso3].name + ' (' + iso3 + ')');
  document.getElementById("countrySelect").value = fullName;
  window.detailsTable.search(fullName);

  document.getElementById('countryDrillDown').style.visibility = 'visible';

  populateCountrySourcesChart(iso3);
  populateCountryLayersChart(iso3);
  populateCountryAdminChart(iso3);
  populateCountryDetails(iso3);

}

function populateCountrySourcesChart(iso3) {
  var country = countryData[iso3];

  var labels = ['OpenStreetMap', 'OpenAddresses', 'Geonames', 'Who\'s On First'];
  var colors = ['#6ea0a4', '#d4645c', '#d3c756', '#635A4A'];

  var data = [
    (country.records.openstreetmap || 0) / country.records.total,
    (country.records.openaddresses || 0)/ country.records.total,
    (country.records.geonames || 0) / country.records.total,
    (country.records.whosonfirst || 0) / country.records.total
  ];

  var oldCanvas = document.getElementById('countrySources');
  var tableRow = document.getElementById('countrySourcesData');

  tableRow.removeChild(oldCanvas);

  var canvas = document.createElement('canvas');
  canvas.id = 'countrySources';
  tableRow.appendChild(canvas);

  var ctx = canvas.getContext('2d');

  window.countrySourcesChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors
      }]
    },
    options: {
      animation: {
        animateScale: true
      },
      legend: {
        labels:{
          padding: 10
        },
        position: 'top',
        fullWidth: false,
        onClick: null //disable clicking on legends
      }
    }
  });
}

function populateCountryLayersChart(iso3) {
  var country = countryData[iso3];

  var labels = [
    'address',
    'venue',
    'other (coarse)'
  ];
  var colors = [
    '#d4645c',
    '#6ea0a4',
    '#d3c756'
  ];

  var data = [];
  data.push((country.records['address'] || 0) / country.records.total);
  data.push((country.records['venue'] || 0) / country.records.total);

  var coarseLayers = [
    'country',
    'macroregion',
    'region',
    'macrocounty',
    'county',
    'localadmin',
    'locality',
    'borough',
    'neighbourhood'
  ];
  var coarseTotal = 0;
  coarseLayers.forEach(function (layer) {
    coarseTotal += (country.records[layer] || 0);
  });

  data.push( coarseTotal / country.records.total);

  var oldCanvas = document.getElementById('countryLayers');
  var tableRow = document.getElementById('countryLayersData');

  tableRow.removeChild(oldCanvas);

  var canvas = document.createElement('canvas');
  canvas.id = 'countryLayers';
  tableRow.appendChild(canvas);

  var ctx = canvas.getContext('2d');

  window.countryLayersChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors
      }]
    },
    options: {
      animation: {
        animateScale: false
      },
      legend: {
        labels:{
          padding: 10
        },
        position: 'top',
        fullWidth: false,
        onClick: null //disable clicking on legends
      }
    }
  });
}

function populateCountryAdminChart(iso3) {
  var country = countryData[iso3];

  var labels = [
    'country',
    'macroregion',
    'region',
    'macrocounty',
    'county',
    'localadmin',
    'locality',
    'borough',
    'neighbourhood'
  ];

  var totalCoarse = 0;
  labels.forEach(function (layer) {
    totalCoarse += (country.records[layer] || 0);
  });

  var data = [];
  labels.forEach(function (layer) {
    data.push(country.records[layer] || 0);
  });

  var oldCanvas = document.getElementById('countryAdmin');
  var tableRow = document.getElementById('countryAdminData');

  tableRow.removeChild(oldCanvas);

  var canvas = document.createElement('canvas');
  canvas.id = 'countryAdmin';
  tableRow.appendChild(canvas);

  var ctx = canvas.getContext('2d');

  window.countryAdminChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'records',
        data: data,
        backgroundColor: '#6ea0a4'
      }]
    },
    options: {
      legend: {
        display: true,
        position: 'top',
        fullWidth: false
      }
    }
  });
}

function populateCountryDetails(iso3) {
  var country = countryData[iso3];

  document.getElementById('country-osm-records').innerText = country.records.openstreetmap || 0;
  document.getElementById('country-oa-records').innerText = country.records.openaddresses || 0;
  document.getElementById('country-gn-records').innerText = country.records.geonames || 0;
  document.getElementById('country-wof-records').innerText = country.records.whosonfirst || 0;
  document.getElementById('country-addresses').innerText = country.records.address || 0;
  document.getElementById('country-venues').innerText = country.records.venue || 0;

  document.getElementById('country-admin').innerText = (country.records.country || 0)
                                                     + (country.records.macroregion || 0)
                                                     + (country.records.region || 0)
                                                     + (country.records.macrocounty || 0)
                                                     + (country.records.county || 0)
                                                     + (country.records.localadmin || 0)
                                                     + (country.records.locality || 0)
                                                     + (country.records.borough || 0)
                                                     + (country.records.neighbourhood || 0);

  document.getElementById('country-country').innerText = country.records.country || 0;
  document.getElementById('country-macroregion').innerText = country.records.macroregion || 0;
  document.getElementById('country-region').innerText = country.records.region || 0;
  document.getElementById('country-macrocounty').innerText = country.records.macrocounty || 0;
  document.getElementById('country-county').innerText = country.records.county || 0;
  document.getElementById('country-localadmin').innerText = country.records.localadmin || 0;
  document.getElementById('country-locality').innerText = country.records.locality || 0;
  document.getElementById('country-borough').innerText = country.records.borough || 0;
  document.getElementById('country-neighbourhood').innerText = country.records.neighbourhood || 0;

}
