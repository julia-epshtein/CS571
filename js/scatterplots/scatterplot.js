const scatterplotConfig = {
  width: 1000, 
  height: 600, 
  margin: { top: 60, right: 20, bottom: 80, left: 80 },
  yearRange: [2009, 2016],
  pointRadius: 6,
  transitionDuration: 1000
};

let scatterplotData = null;
let currYear = 2009;
let xScale, yScale, colorScale;
let svg, chartG, xAxisG, yAxisG;

function initScatterplot() {
  const container = document.getElementById("scatterplot-container");
  if (container) {
    scatterplotConfig.width = Math.min(container.clientWidth, 1000);
  }

  setupScatterplotSVG();
  loadScatterplotData();

  window.addEventListener("resize", function() {
    if (container) {
      const newWidth = Math.min(container.clientWidth, 1000);
      if (newWidth !== scatterplotConfig.width) {
        scatterplotConfig.width = newWidth;
        svg.attr("width", scatterplotConfig.width)
           .attr("viewBox", `0 0 ${scatterplotConfig.width} ${scatterplotConfig.height}`);
        if (scatterplotData) updateScatterplot();
      }
    }
  });
}

function setupScatterplotSVG() {
  const container = d3.select("#scatterplot-container");
  
  // title
  container.append("h2")
    .attr("class", "scatterplot-title")
    .text("Poverty Rate vs. Imprisonment Rate by County");
  
  container.append("p")
    .attr("class", "scatterplot-subtitle")
    .style("text-align", "center")
    .style("margin-top", "20px")
    .style("margin-bottom", "10px")
    .text("Circle size = number of incarcerated people in the county");
  
  // svg
  svg = container.append("svg")
    .attr("id", "scatterplot")
    .attr("width", scatterplotConfig.width)
    .attr("height", scatterplotConfig.height)
    .attr("viewBox", `0 0 ${scatterplotConfig.width} ${scatterplotConfig.height}`); // NEW

  chartG = svg.append("g")
    .attr("transform", `translate(${scatterplotConfig.margin.left}, ${scatterplotConfig.margin.top})`);
  
  // axes
  xAxisG = chartG.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${getChartHeight()})`);
  
  yAxisG = chartG.append("g")
    .attr("class", "y axis");
  
  // labels
  chartG.append("text")
  .attr("class", "axis-label x-axis-label")
    .attr("x", getChartWidth() / 2)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "300")
    .style("font-family", "'Inter', sans-serif")
    .text("Adult Poverty Rate (%)");
  
  chartG.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -getChartHeight() / 2)
    .attr("y", -scatterplotConfig.margin.left + 20)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "300")
    .style("font-family", "'Inter', sans-serif")
    .text("Imprisonments per 100,000 Adults");
  
  // tooltip
  container.append("div")
    .attr("class", "scatterplot-tooltip")
    .attr("id", "scatterplot-tooltip")
    .style("position", "fixed")
    .style("background", "rgba(79, 75, 75, 0.95)")
    .style("color", "white")
    .style("padding", "12px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-family", "'Inter', sans-serif")
    .style("font-size", "16px")
    .style("opacity", 0)
    .style("z-index", 10000)
    .style("min-width", "200px")
    .style("border", "2px solid white")
    .style("box-shadow", "0 0 5px rgba(0,0,0,0.5)");
  
  // toggle
  const controls = container.append("div")
    .attr("class", "scatterplot-controls")
    .style("position", "absolute")
    .style("top", "10px")
    .style("right", "10px")
    .style("padding", "12px")
    .style("display", "flex")
    .style("align-items", "center")
    .style("border-radius", "4px");
  
  // Year label
  controls.append("span")
    .attr("id", "scatterplot-year-label")
    .style("color", "white")
    .style("font-weight", "bold")
    .style("font-size", "22px")
    .style("margin-right", "12px")
    .text(`${currYear}`);
  
  // Prev button 
  const prevButton = controls.append("button")
    .attr("id", "scatterplot-prev-year")
    .text("❮")
    .style("border", "none")
    .style("cursor", "pointer")
    .style("font-size", "24px")
    .style("padding", "0")
    .style("margin-right", "8px")
    .style("line-height", "1")
    .style("color", currYear <= scatterplotConfig.yearRange[0] ? "#444" : "white")
    .on("click", () => {
      if (currYear > scatterplotConfig.yearRange[0]) {
        currYear--;
        updateScatterplot();
        updateArrowColors();
      }
    });
  
  // Next button 
  const nextButton = controls.append("button")
    .attr("id", "scatterplot-next-year")
    .text("❯")
    .style("border", "none")
    .style("cursor", "pointer")
    .style("font-size", "24px")
    .style("padding", "0")
    .style("line-height", "1")
    .style("color", currYear >= scatterplotConfig.yearRange[1] ? "#444" : "white")
    .on("click", () => {
      if (currYear < scatterplotConfig.yearRange[1]) {
        currYear++;
        updateScatterplot();
        updateArrowColors();
      }
    });
}

function getChartWidth() {
  return scatterplotConfig.width - scatterplotConfig.margin.left - scatterplotConfig.margin.right;
}

function getChartHeight() {
  return scatterplotConfig.height - scatterplotConfig.margin.top - scatterplotConfig.margin.bottom;
}

function loadScatterplotData() {
  d3.csv("data/all_years/measures_all_years.csv", d3.autoType).then(data => {
    scatterplotData = data;
    updateScatterplot();
  }).catch(error => {
    console.error("Error loading scatterplot data:", error);
  });
}

function updateScatterplot() {
  if (!scatterplotData) return;
  
  d3.select("#scatterplot-year-label").text(`${currYear}`);
  
  updateArrowColors();
  
  const yearData = scatterplotData.filter(d => d.Year === currYear);
  const povertyCol = getPovertyColumnForYear(currYear);
  const imprisonmentCol = "Total adult imprisonments per 100,000/population age 18-69";
  
  const processedData = yearData
    .filter(d => d[povertyCol] !== null && !isNaN(d[povertyCol]) && 
               d[imprisonmentCol] !== null && !isNaN(d[imprisonmentCol]) &&
               d.County)
    .map(d => ({
      county: d.County,
      povertyRate: +d[povertyCol] * 100, 
      imprisonmentRate: +d[imprisonmentCol],
      totalPopulation: +d['Total adult population incarcerated'] || 100,
      adultImprisonments: +d['Total adult imprisonments per 100,000/population age 18-69']
    }));
      
  updateScales(processedData, povertyCol, imprisonmentCol);
  updatePoints(processedData);
  updateRegressionLine(processedData);
  chartG.select(".x-axis-label")
        .attr("x", getChartWidth() / 2)
        .attr("y", getChartHeight() + scatterplotConfig.margin.bottom);
}

function getPovertyColumnForYear(year) {
  const povertyColumns = {
    2009: "Percent of adults ages 18-64 living in households with incomes below poverty guidelines, 5-year average",
    2010: "Percent of adults ages 18-64 living in households with incomes below poverty guidelines, 5-year average",
    2011: "Percent of adults ages 18-64 living in households with incomes below poverty guidelines, 5-year average",
    2012: "Percent of adults ages 18-64 living in households with incomes below poverty guidelines, 2010 Census",
    2013: "Percent of adults ages 18-64 living in households with incomes below poverty guidelines, 2010 Census",
    2014: "Percent of adults ages 18-64 living in households with incomes below poverty guidelines, 2010 Census",
    2015: "Percent of adults ages 18-64 living in households with incomes below poverty guidelines, 2011-2015 average",
    2016: "Percent of adults ages 18-64 living in households with incomes below poverty guidelines, 2011-2016 average"
  };
  
  return povertyColumns[year] || povertyColumns[2009];
}

function updateScales(data, povertyCol, imprisonmentCol) {
  const xExtent = d3.extent(data, d => d.povertyRate);
  const yExtent = d3.extent(data, d => d.imprisonmentRate);
  
  xScale = d3.scaleLinear()
    .domain([Math.max(0, xExtent[0] - 2), xExtent[1] + 2])
    .range([0, getChartWidth()]);
  
  yScale = d3.scaleLinear()
    .domain([Math.max(0, yExtent[0] - 50), yExtent[1] + 100])
    .range([getChartHeight(), 0]);
  
  const counties = [...new Set(data.map(d => d.county))];
  colorScale = d3.scaleOrdinal()
    .domain(counties)
    .range([
      "#00E5A0", // bright teal/green (Color #1)
      "#FF9500", // bright orange (Color #2)
      "#00D8FF", // bright cyan (Color #3)
      "#FF00E5", // bright magenta (Color #4)
    ]);
    
  const xAxis = d3.axisBottom(xScale).ticks(6);
  const yAxis = d3.axisLeft(yScale).ticks(6);
  
  xAxisG.transition()
    .duration(scatterplotConfig.transitionDuration)
    .call(xAxis)
    .selectAll("text")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("font-family", "'Inter', sans-serif")
    .attr("dy", "1em"); 
  
  yAxisG.transition()
    .duration(scatterplotConfig.transitionDuration)
    .call(yAxis)
    .selectAll("text")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("font-family", "'Inter', sans-serif");
}

function updatePoints(data) {
  const populationExtent = d3.extent(data, d => d.totalPopulation);
  const radiusScale = d3.scaleSqrt()
    .domain(populationExtent)
    .range([scatterplotConfig.pointRadius, scatterplotConfig.pointRadius * 5]);
  
  const points = chartG.selectAll(".point")
    .data(data, d => d.county);
  
  points.exit()
    .transition()
    .duration(scatterplotConfig.transitionDuration)
    .attr("r", 0)
    .remove();
  
  points.transition()
    .duration(scatterplotConfig.transitionDuration)
    .attr("cx", d => xScale(d.povertyRate))
    .attr("cy", d => yScale(d.imprisonmentRate))
    .attr("r", d => radiusScale(d.totalPopulation))
    .attr("fill", d => colorScale(d.county));
  
  points.enter()
    .append("circle")
    .attr("class", "point")
    .attr("cx", d => xScale(d.povertyRate))
    .attr("cy", d => yScale(d.imprisonmentRate))
    .attr("r", 0)
    .attr("fill", d => colorScale(d.county))
    .attr("opacity", 0.5)
    .attr("cursor", "pointer") 
    .on("mouseover", showTooltip)
    .on("mouseout", hideTooltip)
    .transition()
    .duration(scatterplotConfig.transitionDuration)
    .attr("r", d => radiusScale(d.totalPopulation));
}

function updateRegressionLine(data) {
  const regression = linearRegression(data.map(d => [d.povertyRate, d.imprisonmentRate]));
  
  const lineData = [
    { x: d3.min(data, d => d.povertyRate), y: regression.predict(d3.min(data, d => d.povertyRate)) },
    { x: d3.max(data, d => d.povertyRate), y: regression.predict(d3.max(data, d => d.povertyRate)) }
  ];
  
  const line = chartG.selectAll(".regression-line")
    .data([lineData]);
  
  line.enter()
    .append("path")
    .attr("class", "regression-line")
    .merge(line)
    .transition()
    .duration(scatterplotConfig.transitionDuration)
    .attr("d", d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
    );
}

function linearRegression(data) {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (const [x, y] of data) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return {
    slope,
    intercept,
    predict: x => slope * x + intercept
  };
}

function showTooltip(event, d) {
  const tooltip = d3.select("#scatterplot-tooltip");
  
  tooltip.html(`
    <div style="font-size: 16px; font-weight: bold; margin-bottom: 6px; text-align: center;">
      ${d.county}
    </div>
    <div style="font-size: 14px; line-height: 1.4;">
      <div style="margin-bottom: 4px;"><strong>Poverty:</strong> ${d.povertyRate.toFixed(1)}%</div>
      <div style="margin-bottom: 4px;"><strong>Imprisonment:</strong> ${d.imprisonmentRate.toFixed(1)}</div>
      ${d.totalPopulation ? `<div style="margin-bottom: 4px;"><strong>Population:</strong> ${d.totalPopulation.toLocaleString()}</div>` : ''}
    </div>
  `);
  
  const tooltipWidth = 200;
  const tooltipHeight = 130;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  let left = event.clientX + 20;
  let top = event.clientY - 20;
  
  if (left + tooltipWidth > windowWidth) {
    left = event.clientX - tooltipWidth - 20;
  }
  
  if (top + tooltipHeight > windowHeight) {
    top = event.clientY - tooltipHeight - 20;
  }
  
  tooltip
    .style("left", left + "px")
    .style("top", top + "px")
    .transition()
    .duration(200)
    .style("opacity", 1);
    
  const currentRadius = parseFloat(d3.select(event.target).attr("r"));
  
  d3.select(event.target)
    .transition()
    .duration(100)
    .attr("r", currentRadius * 1.3)
    .attr("stroke", "white")
    .attr("stroke-width", 3);
}

function hideTooltip() {
  d3.select("#scatterplot-tooltip")
    .transition()
    .duration(500)
    .style("opacity", 0);
    
  const yearData = scatterplotData.filter(d => d.Year === currYear);
  const povertyCol = getPovertyColumnForYear(currYear);
  const imprisonmentCol = "Total adult imprisonments per 100,000/population age 18-69";
  
  const processedData = yearData
    .filter(d => d[povertyCol] !== null && !isNaN(d[povertyCol]) && 
               d[imprisonmentCol] !== null && !isNaN(d[imprisonmentCol]) &&
               d.County)
    .map(d => ({
      county: d.County,
      povertyRate: +d[povertyCol] * 100, 
      imprisonmentRate: +d[imprisonmentCol],
      totalPopulation: +d['Total adult population incarcerated'] || 100
    }));
  
  const populationExtent = d3.extent(processedData, d => d.totalPopulation);
  const radiusScale = d3.scaleSqrt()
    .domain(populationExtent)
    .range([scatterplotConfig.pointRadius, scatterplotConfig.pointRadius * 5]);
  d3.selectAll(".point")
    .transition()
    .duration(100)
    .attr("r", d => radiusScale(d.totalPopulation))
    .attr("stroke", "none");
}

function updateArrowColors() {
  if (currYear <= scatterplotConfig.yearRange[0]) {
    d3.select("#scatterplot-prev-year").style("color", "#444"); 
  } else {
    d3.select("#scatterplot-prev-year").style("color", "white"); 
  }
  
  if (currYear >= scatterplotConfig.yearRange[1]) {
    d3.select("#scatterplot-next-year").style("color", "#444"); 
  } else {
    d3.select("#scatterplot-next-year").style("color", "white"); 
  }
}

initScatterplot();