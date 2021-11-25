mapboxgl.accessToken = 'pk.eyJ1Ijoic21yaXRpMjgzIiwiYSI6ImNrcjVhN3BiMzBnZmEycW52OWFxcXUzZHAifQ.oyMlJO9J7_e9wBXG9KLNXw';

var map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/mapbox/light-v10', // use a base map without any data
//   style: 'https://studio.mapbox.com/tilesets/smriti283.2cqog2ia/#0.27/0/-74'
  center: [-73.93, 40.72],
  zoom: 11,
});

map.on('load', function() {  
  map.addSource('census_id', {
    type: 'geojson',
    data: 'https://raw.githubusercontent.com/smriti283/Datasets/main/NYCcensus_exploded.json',
//     data: 'https://raw.githubusercontent.com/smriti283/Datasets/main/NYC%20Taxi%20Zones.zip.geojson',
    promoteId: 'census_id',
  });
  
  map.addLayer({
    id: 'census_id',
    source: 'census_id',
    type: 'fill',
    paint: {
      'fill-opacity': 0.9,
      'fill-outline-color': '#444',
      'fill-color': '#ffffff',
    },
  });

  map.on('click', 'census_id', function(e) {
    var states = map.queryRenderedFeatures(e.point, {
      layers: ['census_id']
    });
    
    if (states.length > 0) {
         var feat = states[0].properties.NTAName;
         var location = e.lngLat;
      
    } 
     
    new mapboxgl.Popup()
      .setLngLat(location)
      .setHTML(feat)
      .addTo(map);

  });

  // Change the cursor to a pointer when the mouse is over the places layer.
  map.on('mouseenter', 'census_id', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  // Change it back to a pointer when it leaves.
  map.on('mouseleave', 'census_id', () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
  });  
  
  
  d3.csv('https://raw.githubusercontent.com/claugomzz/iot-capstone/main/Final%20Datasets/beacon_counts_by_census.csv')
    .then(beacons => {
    let data        = beacons.filter(d => d.count>0),
        bybeac      = Array.from(d3.group(data, d => d.uuid_comp).entries()),
        total = bybeac.map(([uuid_comp, group]) => d3.sum(group, d => d.count)),
        uuid =  bybeac.map(d => d[0]),
        byZone = Object.fromEntries(
          bybeac.map(([uuid, group]) => [uuid, Object.fromEntries(
            d3.map(group, d => [d.census_id, +d.count]))])),
    
        countzero = Array.from(d3.map(data, d => d.census_id).entries()),
        czero = countzero.map(d => d[1]);
//         console.log(czero);
    
        traces = [{
          x: total,
        y: uuid.map(d => (d.length<37)?d:(d.slice(0,8)+'...')),
          orientation: 'h',
          type: 'bar',
          marker: {
            color: 'LightGray',
            line: {
              color: 'black',
              width: 0.5,
            }
          },
          
          width:0.3,
          
        }],
        layout = {
          title: ' No. of Beacons',
          width: 700,
          bargap:0,
//           hovermode: 'closest',
          xaxis: {
            title: 'Number of beacon signals received',
          },
          margin: {l: 250},
          yaxis: {
            title: {text: 'Unique UUIDs/ Manufacturing Company Names', standoff: 0},
            ticks: 'outside',
            autorange: 'reversed',
            categoryorder:'total descending',
            tickfont: {
               size : 9,
            },
          },
        },
          
        
        chart = document.getElementById('chart');

    Plotly.newPlot(chart, traces, layout);
    
 //from here
    
//     chart.on('plotly_click', function(traces){
// // //       var pn='',
// //           tn = traces.points[0].graph_objs;
// //           console.log(tn);
// // //           console.log(traces.points[0].fullData.marker.color);
// // //           colors=[];
// // //       for(var i=0; i < traces.points.length; i++){
// // //         pn = traces.points[i].pointIndex;
// // //         tn = traces.points[i].curveNumber;
// // //         colors = traces.points[i].traces.marker.color;
// // //       };
// // //       console.log(traces.graph_objects.Bar[tn]);
// //       colors = '#C54C82';

// //       var update = {'marker':{color: colors, size:16}};
// // //       console.log(update);
// //       Plotly.restyle('chart', update, traces.points[0].label.graph_objects);
//          var bar = traces.d3.selectAll('.ygrid').filter('.crisp').filter(function(d,i) {return i==1})
//          line.style("stroke", "rgb(255,0,0)")
//          line.style("stroke-width", "10px")
//     });
    
    
  //till here 
    
    chart.on('plotly_click', event => {
      // In order to change color, we need to update all
      // item colors, and give the specific one a different color
      
      let uuidhover = event.points[0].pointIndex, // index of the data element
          perTZ = bybeac[uuidhover][1];
          console.log(perTZ);
      setZone(perTZ);
    });

//     var CLEAN = Object.fromEntries(czero.map(x => [x,0]));
    
    function setZone(perTZ) {
      
      for (i=0; i<= czero.length; i++){
        map.setFeatureState({
          source: 'census_id',
          id: czero[i],
        },{
          count: null,
        });

      }

      perTZ.forEach(d => {
        map.setFeatureState({
          source: 'census_id',
          id: d.census_id,
        },{
          count: +d.count,
//           allcount: [id,count],
        });
      });
      
//       console.log(perTZ);
      let steps  = 7,
          maxV   = d3.max(perTZ.map(d => d.count)),
          domain = d3.range(0, maxV, maxV/steps),
          colors = d3.schemeReds[steps],
          filter = new Array();
//           console.log(colors);
//           console.log(domain.slice(1));
      domain.slice(1).forEach((v, k) => {
        filter.push(['<', ['feature-state', 'count'], v]);
        filter.push(colors[k]);
//         console.log(filter);
      });
      
      filter.push(colors[colors.length-1]);

      filter = [
        'case',
        ['==', ['feature-state', 'count'], null], 'rgba(0,0,0,0)',
        ...filter,
      ];
       
      map.setPaintProperty('census_id', 'fill-color', filter);
      //from here
//       map.on('click', 'census_id', function(e) {
//          var states = map.queryRenderedFeatures(e.point, {
//            layers: ['census_id']
//          });
//         var counts = 

//          if (states.length > 0) {
//            var feat = states[0].properties.NTAName;
//            var location = e.lngLat;

//          } 

//          new mapboxgl.Popup()
//            .setLngLat(location)
//            .setHTML(feat)
//            .addTo(map);

//        });
      //till here
    }
 
  
  });  
});
    
    
    
    
    
    
    
    
    
