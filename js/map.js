const mapConfig = {
  width: 500,    
  height: 500,  
  projection: d3.geoMercator(),
  colors: d3.schemeReds[9],
  yearRange: [2009, 2016]
};

let countyData = null;
let measuresData = null;
let currentGeoData = null;
let processedCountyStats = null;
let currentYear = 2009; 

function initMap() {
  setupMapSVG();
  setupYearControls();
  loadData();
}

function setupMapSVG() {
  const svg = d3.select("#map")
    .append("svg")
    .attr("width", mapConfig.width)
    .attr("height", mapConfig.height)
    .style("background-color", "black") 
    .append("g")
    .attr("class", "map-container");

  d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
}

// Filter by year
function setupYearControls() {
  const controlsContainer = d3.select("#map")
    .append("div")
    .attr("class", "year-controls")
    .style("position", "absolute")
    .style("top", "10px")
    .style("right", "10px")
    .style("background", "rgba(0,0,0,0.7)")
    .style("padding", "8px")
    .style("border-radius", "5px")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "5px");

  // Previous year button
  controlsContainer
    .append("button")
    .attr("id", "prev-year")
    .text("◀")
    .style("background", "none")
    .style("border", "1px solid white")
    .style("color", "white")
    .style("cursor", "pointer")
    .style("border-radius", "3px")
    .on("click", () => {
      if (currentYear > mapConfig.yearRange[0]) {
        currentYear--;
        updateYearDisplay();
        updateMap();
      }
    });

  // Add year label
  controlsContainer
    .append("span")
    .attr("id", "year-label")
    .style("color", "white")
    .style("font-weight", "bold")
    .style("min-width", "60px")
    .style("text-align", "center")
    .text(`Year: ${currentYear}`);

  // Add next year button
  controlsContainer
    .append("button")
    .attr("id", "next-year")
    .text("▶")
    .style("background", "none")
    .style("border", "1px solid white")
    .style("color", "white")
    .style("cursor", "pointer")
    .style("border-radius", "3px")
    .on("click", () => {
      if (currentYear < mapConfig.yearRange[1]) {
        currentYear++;
        updateYearDisplay();
        updateMap();
      }
    });
}

function updateYearDisplay() {
  d3.select("#year-label").text(`Year: ${currentYear}`);
}

// Load and process data
function loadData() {
  Promise.all([
    d3.json("https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/california-counties.geojson"),
    d3.csv("data/all_years/measures_all_years.csv", d3.autoType)
  ]).then(([geoData, data]) => {
    countyData = geoData;
    measuresData = data;
    currentGeoData = geoData;
    updateMap();
  }).catch(error => {
    console.error("Error loading data:", error);
  });
}

// Update map based on current year
function updateMap() {
  const processedData = processCountyData(measuresData, currentYear);
  processedCountyStats = processedData;
  renderMap(currentGeoData, processedData);
}

// Process county data for the specified year
function processCountyData(data, year) {
  const countyStats = {};

  // Filter data for the current year
  const yearData = data.filter(d => d.Year === year);
  
  // Group by county
  yearData.forEach(county => {
    if (!county.County || county.County === "") return;
    
    const imprisonmentRate = county['Total adult imprisonments per 100,000/population age 18-69'];
    
    if (!isNaN(imprisonmentRate)) {
      countyStats[county.County] = {
        rate: imprisonmentRate,
        countyName: county.County,
        year: year,
        // Store other relevant measures that might be useful for tooltips
        totalPopulation: county['Total population'],
        minorityRate: county['Percent of felony imprisonments/minority share of county population'],
        adultImprisonments: county['Total adult imprisonments']
      };
    }
  });

  return countyStats;
}

function renderMap(geoData, countyStats) {
  const svg = d3.select("#map svg g");

  svg.selectAll("*").remove();

  mapConfig.projection.fitSize([mapConfig.width, mapConfig.height], geoData);
  const path = d3.geoPath().projection(mapConfig.projection);

  // Get imprisonment rates for color scale domain
  const rates = Object.values(countyStats).map(d => d.rate).filter(d => !isNaN(d));
  const colorScale = d3.scaleQuantile().domain(rates).range(mapConfig.colors);

  svg.selectAll("path")
    .data(geoData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "county")
    .attr("fill", d => {
      const countyName = d.properties.name;
      const countyData = countyStats[countyName];
      if (!countyData) return "#333"; // Dark gray for counties with no data
      return isNaN(countyData.rate) ? "#333" : colorScale(countyData.rate);
    })
    .on("mouseover", function(event, d) {
      const countyName = d.properties.name;
      const countyData = countyStats[countyName];

      d3.select(this)
        .style("stroke", "#fff") 
        .style("stroke-width", "1.5px");

      const tooltip = d3.select(".tooltip");
      tooltip.transition().duration(200).style("opacity", 0.9);

      let tooltipContent = `<strong>${countyName} (${currentYear})</strong>`;
      if (countyData) {
        tooltipContent += `<br>Imprisonment Rate: ${countyData.rate.toFixed(1)} per 100,000`;
        if (countyData.adultImprisonments) {
          tooltipContent += `<br>Total Imprisonments: ${countyData.adultImprisonments.toLocaleString()}`;
        }
        if (countyData.totalPopulation) {
          tooltipContent += `<br>Population: ${countyData.totalPopulation.toLocaleString()}`;
        }
        if (countyData.minorityRate) {
          tooltipContent += `<br>Minority Imprisonment Index: ${countyData.minorityRate.toFixed(2)}`;
        }
      } else {
        tooltipContent += "<br>No data available";
      }

      tooltip.html(tooltipContent)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
        
      // Also update the county details section if it exists
      if (d3.select("#county-details").size() > 0) {
        displayCountyDetails(countyName, countyData);
      }
    })
    .on("mouseout", function() {
      d3.select(this)
        .style("stroke", "#eee") 
        .style("stroke-width", "0.5px");
      d3.select(".tooltip").transition().duration(500).style("opacity", 0);
    });

  createLegend(colorScale);
  }

function roundToNearest(num, nearest) {
  return Math.round(num / nearest) * nearest;
}

function createLegend(colorScale) {
  const legendContainer = d3.select("#legend-container");
  legendContainer.html("");

  const legend = legendContainer.append("div").attr("class", "legend");
  const thresholds = colorScale.quantiles();

  legend.append("div")
    .text("Imprisonment Rate (per 100,000):")
    .style("font-weight", "bold")
    .style("color", "white");  

  thresholds.forEach((threshold, i) => {
    const item = legend.append("div").attr("class", "legend-item");
    item.append("div")
      .attr("class", "legend-color")
      .style("background-color", mapConfig.colors[i + 1]);

    let label;
    if (i === 0) {
      label = `< ${roundToNearest(threshold, 10).toFixed(0)}`;
    } else {
      label = `${roundToNearest(thresholds[i - 1], 10).toFixed(0)} - ${roundToNearest(threshold, 10).toFixed(0)}`;
    }

    item.append("div")
      .attr("class", "legend-label")
      .text(label)
      .style("color", "white");  
  });

  const lastItem = legend.append("div").attr("class", "legend-item");
  lastItem.append("div")
    .attr("class", "legend-color")
    .style("background-color", mapConfig.colors[mapConfig.colors.length - 1]);

  lastItem.append("div")
    .attr("class", "legend-label")
    .text(`> ${roundToNearest(thresholds[thresholds.length - 1], 10).toFixed(0)}`)
    .style("color", "white");  
}

function displayCountyDetails(countyName, countyData) {
  const detailsContainer = d3.select("#county-details");

  if (!countyData) {
    detailsContainer.html(`
      <h3>${countyName} (${currentYear})</h3>
      <p>No data available for this county</p>
    `);
    return;
  }

  detailsContainer.html(`
    <h3>${countyName} (${currentYear})</h3>
    <p><strong>Imprisonment Rate:</strong> ${countyData.rate.toFixed(1)} per 100,000 adults</p>
    ${countyData.adultImprisonments ? `<p><strong>Total Imprisonments:</strong> ${countyData.adultImprisonments.toLocaleString()}</p>` : ''}
    ${countyData.totalPopulation ? `<p><strong>Population:</strong> ${countyData.totalPopulation.toLocaleString()}</p>` : ''}
    ${countyData.minorityRate ? `<p><strong>Minority Imprisonment Index:</strong> ${countyData.minorityRate.toFixed(2)}</p>` : ''}
  `);
}

initMap();