const minorityMapConfig = {
  width: 500,
  height: 500,
  projection: d3.geoMercator(),
  colors: d3.schemeReds[6],
};

let geoDataMinority = null;
let demographicData = {}; 

function initMinorityMap() {
  setupMinorityMapSVG();
  loadDemographicData();
}

function setupMinorityMapSVG() {
  d3.select("#minority-map").html("");

  d3.select("#minority-map")
    .append("svg")
    .attr("width", minorityMapConfig.width)
    .attr("height", minorityMapConfig.height)
    .style("background-color", "#1F2937") 
    .append("g")
    .attr("class", "map-container");

  if (d3.select("body").select(".minority-tooltip").empty()) {
    d3.select("body")
      .append("div")
      .attr("class", "minority-tooltip tooltip")
      .style("opacity", 0);
  }
}

function loadDemographicData() {
  Promise.all([
    d3.json("https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/california-counties.geojson"),
    d3.csv("data/minority-map_dataset/white.csv", d3.autoType),
    d3.csv("data/minority-map_dataset/hispanic.csv", d3.autoType),
    d3.csv("data/minority-map_dataset/black.csv", d3.autoType),
    d3.csv("data/minority-map_dataset/asian.csv", d3.autoType),
    d3.csv("data/minority-map_dataset/indian.csv", d3.autoType)
  ])
  .then(([geoData, whiteData, hispanicData, blackData, asianData, american_indianData]) => {
    geoDataMinority = geoData;
    processDemographicData(whiteData, hispanicData, blackData, asianData, american_indianData);
    renderMinorityMap(geoDataMinority, demographicData);
  })
  .catch(error => {
    console.error("Error loading demographic data:", error);
  });
}

function processDemographicData(whiteData, hispanicData, blackData, asianData, american_indianData) {
  const isCounty = d => d.County && !['California', 'United States'].includes(d.County);

  const counties = new Set();
  whiteData.filter(isCounty).forEach(d => counties.add(d.County));
  hispanicData.filter(isCounty).forEach(d => counties.add(d.County));
  blackData.filter(isCounty).forEach(d => counties.add(d.County));
  asianData.filter(isCounty).forEach(d => counties.add(d.County));
  american_indianData.filter(isCounty).forEach(d => counties.add(d.County));

  counties.forEach(county => {
    const whitePop = getPopulationForCounty(whiteData, county);
    const hispanicPop = getPopulationForCounty(hispanicData, county);
    const blackPop = getPopulationForCounty(blackData, county);
    const asianPop = getPopulationForCounty(asianData, county);
    const american_indianPop = getPopulationForCounty(american_indianData, county);

    const minorityPop = (hispanicPop || 0) + (blackPop || 0) + (asianPop || 0) + (american_indianPop || 0);
    const totalPop = (whitePop || 0) + minorityPop;

    const pctMinority = totalPop > 0 ? (minorityPop / totalPop) * 100 : 0;

    demographicData[county] = {
      white: whitePop || 0,
      hispanic: hispanicPop || 0,
      black: blackPop || 0,
      asian: asianPop || 0,
      american_indian: american_indianPop || 0,
      total: totalPop,
      pctMinority: pctMinority
    };
  });
}

function getPopulationForCounty(dataArray, countyName) {
  const normalizedCountyName = countyName.replace(/ County$/i, '').trim().toLowerCase();
  
  const record = dataArray.find(d => {
    if (!d.County) return false;
    const normalizedDataCounty = d.County.replace(/ County$/i, '').trim().toLowerCase();
    return normalizedDataCounty === normalizedCountyName;
  });
  
  if (!record) return 0;
  
  if (record['People (White)']) return +record['People (White)'];
  if (record['People (API)']) return +record['People (API)'];
  if (record['People (Black)']) return +record['People (Black)'];
  if (record['People (Hispanic)']) return +record['People (Hispanic)'];
  if (record['People (AI/AN)']) return +record['People (AI/AN)'];
  
  return 0;
}

function renderMinorityMap(geoData, dataByCounty) {
  const svg = d3.select("#minority-map svg g");
  svg.selectAll("*").remove();

  minorityMapConfig.projection.fitSize([minorityMapConfig.width, minorityMapConfig.height], geoData);
  const path = d3.geoPath().projection(minorityMapConfig.projection);

  // Create threshold scale with fixed bins
  const colorScale = d3.scaleThreshold()
    .domain([10, 20, 30, 40, 50]) 
    .range(minorityMapConfig.colors.slice(0, 6)); 

  svg.selectAll("path")
    .data(geoData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "county")
    .attr("fill", d => {
      const countyName = d.properties.name;
      const countyData = Object.entries(dataByCounty).find(([name, data]) => {
        return name.toLowerCase().includes(countyName.toLowerCase()) || 
               countyName.toLowerCase().includes(name.toLowerCase());
      });
      
      if (!countyData || isNaN(countyData[1].pctMinority)) return "#eee";
      return colorScale(countyData[1].pctMinority);
    })
    .on("mouseover", function(event, d) {
      const countyName = d.properties.name;
      const countyData = Object.entries(dataByCounty).find(([name, data]) => {
        return name.toLowerCase().includes(countyName.toLowerCase()) || 
               countyName.toLowerCase().includes(name.toLowerCase());
      });

      d3.select(this)
        .style("stroke", "#fff") 
        .style("stroke-width", "1.5px");

      const tooltip = d3.select(".minority-tooltip");
      tooltip.transition().duration(200).style("opacity", 0.9);

      let tooltipContent = `<strong style="color: white;">${countyName}</strong>`;
      if (countyData) {
        tooltipContent += `<br style="color: white;">% Minority: ${countyData[1].pctMinority.toFixed(1)}%`;
        tooltipContent += `<br>White: ${countyData[1].white.toLocaleString()}`;
        tooltipContent += `<br>Hispanic: ${countyData[1].hispanic.toLocaleString()}`;
        tooltipContent += `<br>Black: ${countyData[1].black.toLocaleString()}`;
        tooltipContent += `<br>Asian: ${countyData[1].asian.toLocaleString()}`;
        tooltipContent += `<br>American Indian: ${countyData[1].american_indian.toLocaleString()}`;
      } else {
        tooltipContent += "<br>No data available";
      }

      tooltip.html(tooltipContent)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this)
        .style("stroke", "#eee")  
        .style("stroke-width", "0.5px");
      d3.select(".minority-tooltip").transition().duration(500).style("opacity", 0);
    });

  createMinorityLegend(colorScale);
}

function createMinorityLegend(colorScale) {
  d3.select("#minority-legend-container").html("");

  const legendContainer = d3.select("#minority-legend-container")
    .append("div")
    .attr("class", "minority-legend");

  legendContainer.append("div")
    .text("% Minority:")
    .style("font-weight", "bold")
    .style("color", "white"); 

  const row = legendContainer.append("div")
    .attr("class", "legend-items-row");

  const bins = [
    { range: "0-10%", color: minorityMapConfig.colors[0] },
    { range: "10-20%", color: minorityMapConfig.colors[1] },
    { range: "20-30%", color: minorityMapConfig.colors[2] },
    { range: "30-40%", color: minorityMapConfig.colors[3] },
    { range: "40-50%", color: minorityMapConfig.colors[4] },
    { range: "50%+", color: minorityMapConfig.colors[5] }
  ];

  bins.forEach(bin => {
    const item = row.append("div")
      .attr("class", "minority-legend-item");

    item.append("div")
      .attr("class", "legend-color")
      .style("background-color", bin.color);

    item.append("div")
      .attr("class", "legend-label")
      .text(bin.range)
      .style("color", "white"); 
  });
}


document.addEventListener("DOMContentLoaded", function() {
  initMinorityMap();
});