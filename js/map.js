// Configuration
const mapConfig = {
  width: 700,
  height: 700,
  projection: d3.geoMercator(),
  colors: d3.schemeBlues[9]
};

let countyData = null;
let inmateData = null;
let currentGeoData = null;
let processedCountyStats = null;

// Initialize map
function initMap() {
  setupMapSVG();
  loadData();
}

// SVG container for map
function setupMapSVG() {
  d3.select("#map")
    .append("svg")
    .attr("width", mapConfig.width)
    .attr("height", mapConfig.height)
    .append("g")
    .attr("class", "map-container");

  // Tooltip
  d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
}

// Load and process data
function loadData() {
  Promise.all([
    d3.json("https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/california-counties.geojson"),
    d3.csv("data/preprocessed/merged_inmate_data.csv", d3.autoType)
  ]).then(([geoData, data]) => {
    countyData = geoData;
    inmateData = data;
    currentGeoData = geoData;
    updateMap();
  }).catch(error => {
    console.error("Error loading data:", error);
  });
}

// Inmate count by county
function updateMap() {
  const processedData = processInmateData(inmateData);
  processedCountyStats = processedData;
  renderMap(currentGeoData, processedData);
}

// Process inmate data to get sentencing count by county
function processInmateData(data) {
  const countyStats = {};

  // Group data by county
  const byCounty = d3.group(data, d => d['Sentencing County']);

  byCounty.forEach((inmates, county) => {
    if (!county || county === "") return;

    const count = inmates.length;

    countyStats[county] = {
      count,
      countyName: county
    };
  });

  return countyStats;
}

function renderMap(geoData, countyStats) {
  const svg = d3.select("#map svg g");

  svg.selectAll("*").remove();

  mapConfig.projection.fitSize([mapConfig.width, mapConfig.height], geoData);
  const path = d3.geoPath().projection(mapConfig.projection);

  // Extracting count values for color scale domain
  const counts = Object.values(countyStats).map(d => d.count).filter(d => !isNaN(d));
  const colorScale = d3.scaleQuantile().domain(counts).range(mapConfig.colors);

  svg.selectAll("path")
    .data(geoData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "county")
    .attr("fill", d => {
      const countyName = d.properties.name;
      const countyData = countyStats[countyName];
      if (!countyData) return "#eee";
      return isNaN(countyData.count) ? "#eee" : colorScale(countyData.count);
    })
    .on("mouseover", function(event, d) {
      const countyName = d.properties.name;
      const countyData = countyStats[countyName];

      d3.select(this)
        .style("stroke", "#000")
        .style("stroke-width", "1.5px");

      const tooltip = d3.select(".tooltip");
      tooltip.transition().duration(200).style("opacity", 0.9);

      let tooltipContent = `<strong>${countyName}</strong>`;
      if (countyData) {
        tooltipContent += `<br>Inmates: ${countyData.count.toLocaleString()}`;
      } else {
        tooltipContent += "<br>No data available";
      }

      tooltip.html(tooltipContent)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this)
        .style("stroke", "#fff")
        .style("stroke-width", "0.5px");
      d3.select(".tooltip").transition().duration(500).style("opacity", 0);
    });

  createLegend(colorScale);
}

function roundToHundred(num) {
  return Math.round(num / 100) * 100;
}

function createLegend(colorScale) {
  const legendContainer = d3.select("#legend-container");
  legendContainer.html("");

  const legend = legendContainer.append("div").attr("class", "legend");
  const thresholds = colorScale.quantiles();

  legend.append("div")
    .text("Inmates:")
    .style("font-weight", "bold");

  thresholds.forEach((threshold, i) => {
    const item = legend.append("div").attr("class", "legend-item");
    item.append("div")
      .attr("class", "legend-color")
      .style("background-color", mapConfig.colors[i + 1]);

    let label;
    if (i === 0) {
      label = `< ${roundToHundred(threshold)}`;
    } else {
      label = `${roundToHundred(thresholds[i - 1])} - ${roundToHundred(threshold)}`;
    }

    item.append("div")
      .attr("class", "legend-label")
      .text(label);
  });

  const lastItem = legend.append("div").attr("class", "legend-item");
  lastItem.append("div")
    .attr("class", "legend-color")
    .style("background-color", mapConfig.colors[mapConfig.colors.length - 1]);

  lastItem.append("div")
    .attr("class", "legend-label")
    .text(`> ${Math.ceil(thresholds[thresholds.length - 1])}`);
}

function displayCountyDetails(countyName, countyData) {
  const detailsContainer = d3.select("#county-details");

  if (!countyData) {
    detailsContainer.html(`
      <h3>${countyName}</h3>
      <p>No data available for this county</p>
    `);
    return;
  }

  const countyInmates = countyData.inmates || [];
  const offenseCategories = {};
  countyInmates.forEach(inmate => {
    const category = inmate['Offense Category_current'] || 'Unknown';
    offenseCategories[category] = (offenseCategories[category] || 0) + 1;
  });

  const sortedCategories = Object.entries(offenseCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  let categoriesHTML = '';
  if (sortedCategories.length > 0) {
    categoriesHTML = `
      <h4>Top Offense Categories</h4>
      <ul style="text-align: left; padding-left: 20px;">
        ${sortedCategories.map(([category, count]) =>
          `<li>${category}: ${count} (${((count / countyInmates.length) * 100).toFixed(1)}%)</li>`
        ).join('')}
      </ul>
    `;
  }

  detailsContainer.html(`
    <h3>${countyName}</h3>
    <p><strong>Total Inmates:</strong> ${countyData.count.toLocaleString()}</p>
    ${categoriesHTML}
  `);
}

// Start map
initMap();
Configuration
