var colors = {
  great: '#125056',
  good: '#478388',
  meh: '#6E9FA4',
  bad: '#A3C7CA',
  none: 'lightGray'
}; // teals

var fillOpacity = 0.8;

document.map_overall_score = {};

function createMap() {
  var map = L.map('map').setView([30, 0], 1);

  var layer = Tangram.leafletLayer({
    maxZoom: 18,
    minZoom: 1,
    scene: 'https://raw.githubusercontent.com/tangrams/refill-style/gh-pages/refill-style.yaml',
    attribution: '| <a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | <a href="http://www.openstreetmap.org/about" target="_blank">&copy; OSM contributors',
  });

  layer.addTo(map);

  map.attributionControl.addAttribution('Mapzen data &copy; <a href="https://mapzen.com">Mapzen</a>');

  document.map_overall_score.map = map;

  addInfoBox();
  addSearch();
  fillData();
}

function addInfoBox() {
  // control that shows state info on hover
  document.map_overall_score.info = L.control();

  document.map_overall_score.info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
  };

  document.map_overall_score.info.update = function (props) {
    this._div.innerHTML = '<h4>Address Coverage</h4>' + (props ?
      '<b>' + props.name + '</b><br />' + props.people_per_address + ' ppl/addr'
        : 'Hover over a country');
  };

  document.map_overall_score.info.addTo(document.map_overall_score.map);
}

function addSearch() {
  // geocoder
  document.map_overall_score.geocoder = L.control.geocoder('search-hQHkoy8').addTo(document.map_overall_score.map);
}

// get color depending on population density value
function getColor(d) {
  if (d > 500) {
    return colors.none;
  } else if (d > 300) {
    return colors.bad;
  } else if (d > 100) {
    return colors.meh;
  } else if (d > 50) {
    return colors.good;
  } else {
    return colors.great;
  }
}

function style(feature) {
  var country = countryData[feature.id];
  if (!country) {
    return {
      weight: 1,
      opacity: 0.7,
      color: 'gray',
      //dashArray: '1',
      fillOpacity: fillOpacity,
      fillColor: colors.none
    };
  }

  country.people_per_address = (country.population > 0 && country.records.address > 0) ?
    (country.population / country.records.address) : 9999999;

  //feature.name = country.name;
  feature.properties.people_per_address = country.people_per_address.toFixed(2);

  //console.log(feature.id, country.name, country.people_per_address);

  return {
    weight: 1,
    opacity: 0.7,
    color: 'gray',
    //dashArray: '1',
    fillOpacity: fillOpacity,
    fillColor: getColor(country.people_per_address)
  };
}

function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 5,
    color: '#FFF',
    dashArray: '',
    fillOpacity: fillOpacity
  });

  if (!L.Browser.ie && !L.Browser.opera) {
    layer.bringToFront();
  }

  document.map_overall_score.info.update(layer.feature.properties);
}

function resetHighlight(e) {
  document.map_overall_score.geojson.resetStyle(e.target);
  document.map_overall_score.info.update();
}

function zoomToFeature(e) {
  document.map_overall_score.map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: highlightFeature,
    dblclick: zoomToFeature
  });
}

function fillData() {
  document.map_overall_score.geojson = L.geoJson(country_shapes, {
    style: style,
    onEachFeature: onEachFeature
  }).addTo(document.map_overall_score.map);


  var legend = L.control({position: 'bottomleft'});

  legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend');

    var labels = [];

    labels.push('<i style="background:' + colors.great + '"></i> <b> <50 </b>');
    labels.push('<i style="background:' + colors.good + '"></i> <b> <100 </b>');
    labels.push('<i style="background:' + colors.meh + '"></i> <b> <300 </b>');
    labels.push('<i style="background:' + colors.bad + '"></i> <b> <500 </b>');
    labels.push('<i style="background:' + colors.none + '"></i> <b> >500 </b>');

    div.innerHTML = labels.join('<br>');
    return div;
  };

  legend.addTo(document.map_overall_score.map);
}