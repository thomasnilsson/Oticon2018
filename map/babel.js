// configuration
const colorVariable = 'population';
const geoIDVariable = 'id';
const format = d3.format(',');

let numberFormatter = x => parseInt(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Set tooltips
const tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(d => `<strong>Country: </strong><span class='details'>${d.properties.name}<br></span>
  <strong>Using Latest Firmware: </strong><span class='details'>${parseInt(d.population)}%<br></span>
  <strong>Devices: </strong><span class='details'>${numberFormatter(d.devices)}</span>`);

  

tip.direction(function(d) {
  if (d.properties.name === 'Antarctica') return 'n';
  // Americas
  if (d.properties.name === 'Greenland') return 's';
  if (d.properties.name === 'Canada') return 'e';
  if (d.properties.name === 'USA') return 'e';
  if (d.properties.name === 'Mexico') return 'e';
  // Europe
  if (d.properties.name === 'Iceland') return 's';
  if (d.properties.name === 'Norway') return 's';
  if (d.properties.name === 'Sweden') return 's';
  if (d.properties.name === 'Finland') return 's';
  if (d.properties.name === 'Russia') return 'w';
  // Asia
  if (d.properties.name === 'China') return 'w';
  if (d.properties.name === 'Japan') return 's';
  // Oceania
  if (d.properties.name === 'Indonesia') return 'w';
  if (d.properties.name === 'Papua New Guinea') return 'w';
  if (d.properties.name === 'Australia') return 'w';
  if (d.properties.name === 'New Zealand') return 'w';
  // otherwise if not specified
  return 'n';
})

tip.offset(function(d) { // [top, left]
  if (d.properties.name === 'Antarctica') return [0, 0];
  // Americas
  if (d.properties.name === 'Greenland') return [10, -10];
  if (d.properties.name === 'Canada') return [24, -28];
  if (d.properties.name === 'USA') return [-5, 8];
  if (d.properties.name === 'Mexico') return [12, 10];
  if (d.properties.name === 'Chile') return [0, -15];
  // Europe
  if (d.properties.name === 'Iceland') return [15, 0];
  if (d.properties.name === 'Norway') return [10, -28];
  if (d.properties.name === 'Sweden') return [10, -8];
  if (d.properties.name === 'Finland') return [10, 0];
  if (d.properties.name === 'France') return [-9, 66];
  if (d.properties.name === 'Italy') return [-8, -6];
  if (d.properties.name === 'Russia') return [5, 385];
  // Africa
  if (d.properties.name === 'Madagascar') return [-10, 10];
  // Asia
  if (d.properties.name === 'China') return [-16, -8];
  if (d.properties.name === 'Mongolia') return [-5, 0];
  if (d.properties.name === 'Pakistan') return [-10, 13];
  if (d.properties.name === 'India') return [-11, -18];
  if (d.properties.name === 'Nepal') return [-8, 1];
  if (d.properties.name === 'Myanmar') return [-12, 0];
  if (d.properties.name === 'Laos') return [-12, -8];
  if (d.properties.name === 'Vietnam') return [-12, -4];
  if (d.properties.name === 'Japan') return [5, 5];
  // Oceania
  if (d.properties.name === 'Indonesia') return [0, -5];
  if (d.properties.name === 'Papua New Guinea') return [-5, -10];
  if (d.properties.name === 'Australia') return [-15, 0];
  if (d.properties.name === 'New Zealand') return [-15, 0];
  // otherwise if not specified
  return [-10, 0];
})

const parentWidth = d3.select('body').node().getBoundingClientRect().width;
const margin = {top: 0, right: 0, bottom: 0, left: 0};
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const color = d3.scaleQuantile()
  .range([
    'rgb(247,251,255)',
    'rgb(222,235,247)', 
    'rgb(198,219,239)', 
    'rgb(158,202,225)',
    'rgb(107,174,214)',
    'rgb(66,146,198)',
    'rgb(33,113,181)',
    'rgb(8,81,156)',
    'rgb(8,48,107)',
    'rgb(3,19,43)'
  ]);


const svg = d3.select('body')
  .select("#worldMap")
  .append('svg')
  .attr('width', width)
  .attr('height', height)
  .append('g')
  .attr('class', 'map');

const projection = d3.geoRobinson()
  .scale(148)
  .rotate([352, 0, 0])
  .translate( [width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

svg.call(tip);

queue()
  .defer(d3.json, 'map/world_countries.json')
  .defer(d3.tsv, 'map/world_population.tsv')
  .await(ready);

function ready(error, geography, data) {
  data.forEach(d => {
    d[colorVariable] = Math.random() * 100;
  })

  const colorVariableValueByID = {};

  data.forEach(d => { colorVariableValueByID[d[geoIDVariable]] = d[colorVariable]; });
  // for (key in data){
  //   data[key]['devices'] = 100
  // }
  // data.forEach(d => console.log(d.devices))
  geography.features.forEach(d => { d[colorVariable] = colorVariableValueByID[d.id] });
  geography.features.forEach(d => d["devices"] = Math.random() * 100000)

  // calculate ckmeans clusters
  // then use the max value of each cluster
  // as a break
  const numberOfClasses = color.range().length - 1;
  const ckmeansClusters = ss.ckmeans(data.map(d => d[colorVariable]), numberOfClasses);
  const ckmeansBreaks = ckmeansClusters.map(d => d3.min(d));
  console.log('numberOfClasses', numberOfClasses);
  console.log('ckmeansClusters', ckmeansClusters);
  console.log('ckmeansBreaks', ckmeansBreaks);

  // set the domain of the color scale based on our data
  color
    .domain(ckmeansBreaks);

  svg.append('g')
    .attr('class', 'countries')
    .selectAll('path')
    .data(geography.features)
    .enter().append('path')
      .attr('d', path)
      .style('fill', d => {
        if (typeof colorVariableValueByID[d.id] !== 'undefined') {
          return color(colorVariableValueByID[d.id])
        } 
        return 'white'
      })
      .style('fill-opacity',0.8)
      .style('stroke', d => {
          if (d[colorVariable] !== 0) {
          return 'white';
        } 
        return 'lightgray';
      })
      .style('stroke-width', 1)
      .style('stroke-opacity', 0.5)
      // tooltips
      .on('mouseover',function(d){
        tip.show(d);
        d3.select(this)
          .style('fill-opacity', 1)
          .style('stroke-opacity', 1)
          .style('stroke-width', 2)
      })
      .on('mouseout', function(d){
        tip.hide(d);
        d3.select(this)
          .style('fill-opacity', 0.8)
          .style('stroke-opacity', 0.5)
          .style('stroke-width', 1)
      });

  svg.append('path')
    .datum(topojson.mesh(geography.features, (a, b) => a.id !== b.id))
    .attr('class', 'names')
    .attr('d', path);
}