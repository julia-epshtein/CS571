// minority-map.js

// Configuration for the Minority Map visualization
const minorityMapConfig = {
    width: 700,
    height: 700,
    projection: d3.geoMercator(),
    // Using a red scheme to indicate intensity of % minority
    colors: d3.schemeReds[9]
  };
  
  let geoDataMinority = null;
  let demographicData = {}; // Will store the demographic stats keyed by county
  
  // Initialize the minority map
  function initMinorityMap() {
    setupMinorityMapSVG();
    loadDemographicData();
  }
  
  // Set up the SVG container and tooltip for the minority map
  function setupMinorityMapSVG() {
    d3.select("#minority-map").html("");
  
    d3.select("#minority-map")
      .append("svg")
      .attr("width", minorityMapConfig.width)
      .attr("height", minorityMapConfig.height)
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
      d3.csv("data/minority-map _dataset/asian.csv", d3.autoType),
      d3.csv("data/minority-map _dataset/hispanic.csv", d3.autoType),
      d3.csv("data/minority-map _dataset/black.csv", d3.autoType),
      d3.csv("data/minority-map _dataset/asian.csv", d3.autoType),
      d3.csv("data/minority-map _dataset/indian.csv", d3.autoType)
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
  
  // Process the CSVs to merge data by county and compute % minority
  function processDemographicData(whiteData, hispanicData, blackData, asianData, american_indianData) {
    // Collect unique county names from all files
    const counties = new Set();
    whiteData.forEach(d => counties.add(d.County));
    hispanicData.forEach(d => counties.add(d.County));
    blackData.forEach(d => counties.add(d.County));
    asianData.forEach(d => counties.add(d.County));
    american_indianData.forEach(d => counties.add(d.County));
  
    counties.forEach(county => {
      const whitePop = getPopulationForCounty(whiteData, county);
      const hispanicPop = getPopulationForCounty(hispanicData, county);
      const blackPop = getPopulationForCounty(blackData, county);
      const asianPop = getPopulationForCounty(asianData, county);
      const american_indianPop = getPopulationForCounty(american_indianData, county);
  
      // Sum all non‑white populations (minority groups)
      const minorityPop = (hispanicPop || 0) + (blackPop || 0) + (asianPop || 0) + (american_indianPop || 0);
      const totalPop = (whitePop || 0) + minorityPop;
  
      // Calculate % minority (if totalPop > 0)
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
    const record = dataArray.find(d => d.County && d.County.toLowerCase() === countyName.toLowerCase());
    return record ? +record.Population : 0;
  }
  
  function renderMinorityMap(geoData, dataByCounty) {
    const svg = d3.select("#minority-map svg g");
    svg.selectAll("*").remove();
  
    minorityMapConfig.projection.fitSize([minorityMapConfig.width, minorityMapConfig.height], geoData);
    const path = d3.geoPath().projection(minorityMapConfig.projection);
  
    const percentages = [];
    for (const county in dataByCounty) {
      const pct = dataByCounty[county].pctMinority;
      if (!isNaN(pct)) {
        percentages.push(pct);
      }
    }
    const colorScale = d3.scaleQuantile()
      .domain(percentages)
      .range(minorityMapConfig.colors);
  
    svg.selectAll("path")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", "county")
      .attr("fill", d => {
        const countyName = d.properties.name;
        const countyData = dataByCounty[countyName];
        if (!countyData) return "#eee";
        return isNaN(countyData.pctMinority) ? "#eee" : colorScale(countyData.pctMinority);
      })
      .on("mouseover", function(event, d) {
        const countyName = d.properties.name;
        const countyData = dataByCounty[countyName];
        d3.select(this)
          .style("stroke", "#000")
          .style("stroke-width", "1.5px");
  
        const tooltip = d3.select(".minority-tooltip");
        tooltip.transition().duration(200).style("opacity", 0.9);
  
        let tooltipContent = `<strong>${countyName}</strong>`;
        if (countyData) {
          tooltipContent += `<br>% Minority: ${countyData.pctMinority.toFixed(1)}%`;
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
        d3.select(".minority-tooltip").transition().duration(500).style("opacity", 0);
      });
  
    createMinorityLegend(colorScale);
  }
  
  function createMinorityLegend(colorScale) {
    d3.select("#minority-legend-container").html("");
  
    const legendContainer = d3.select("#minority-legend-container")
      .append("div")
      .attr("class", "legend");
  
    const thresholds = colorScale.quantiles();
    legendContainer.append("div")
      .text("% Minority:")
      .style("font-weight", "bold");
  
    thresholds.forEach((threshold, i) => {
      const item = legendContainer.append("div")
        .attr("class", "legend-item");
  
      item.append("div")
        .attr("class", "legend-color")
        .style("background-color", minorityMapConfig.colors[i]);
  
      let label;
      if (i === 0) {
        label = `< ${Math.round(threshold)}`;
      } else {
        label = `${Math.round(thresholds[i - 1])} - ${Math.round(threshold)}`;
      }
      item.append("div")
        .attr("class", "legend-label")
        .text(label);
    });
  
    const lastItem = legendContainer.append("div")
      .attr("class", "legend-item");
    lastItem.append("div")
      .attr("class", "legend-color")
      .style("background-color", minorityMapConfig.colors[minorityMapConfig.colors.length - 1]);
    lastItem.append("div")
      .attr("class", "legend-label")
      .text(`> ${Math.round(thresholds[thresholds.length - 1])}`);
  }
  
  document.addEventListener("DOMContentLoaded", function() {
    initMinorityMap();
  });
  