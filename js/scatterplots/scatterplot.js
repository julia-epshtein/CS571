const scatterplotConfig = {
    width: 1100,
    height: 800,
    margin: { top: 60, right: 20, bottom: 40, left: 80 },
    yearRange: [2009, 2016],
    pointRadius: 6,
    transitionDuration: 1000
  };
  
  let scatterplotData = null;
  let currYear = 2009;
  let xScale, yScale, colorScale;
  let svg, chartG, xAxisG, yAxisG;
  
  function initScatterplot() {
    setupScatterplotSVG();
    loadScatterplotData();
  }
  
  function setupScatterplotSVG() {
    const container = d3.select("#scatterplot-container");
    
    // title
    container.append("h2")
      .attr("class", "scatterplot-title")
      .text("Poverty Rate vs. Imprisonment Rate by County");
    
    // year display
    container.append("div")
      .attr("class", "scatterplot-year")
      .attr("id", "scatterplot-year-display")
      .text(`Year: ${currYear}`);
    
    // SVG
    svg = container.append("svg")
      .attr("id", "scatterplot")
      .attr("width", scatterplotConfig.width)
      .attr("height", scatterplotConfig.height);
    
    // main chart group
    chartG = svg.append("g")
      .attr("transform", `translate(${scatterplotConfig.margin.left}, ${scatterplotConfig.margin.top})`);
    
    // axes groups
    xAxisG = chartG.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${getChartHeight()})`);
    
    yAxisG = chartG.append("g")
      .attr("class", "y axis");
    
    // axis labels
    chartG.append("text")
      .attr("class", "axis-label")
      .attr("x", getChartWidth() / 2)
      .attr("y", getChartHeight() + scatterplotConfig.margin.bottom + 20) 
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("font-family", "'Inter', sans-serif")
      .text("Adult Poverty Rate (%)");
    
    chartG.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -getChartHeight() / 2)
      .attr("y", -scatterplotConfig.margin.left + 15) 
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("font-family", "'Inter', sans-serif")
      .text("Imprisonments per 100,000 Adults");
    
    // tooltip
    container.append("div")
      .attr("class", "scatterplot-tooltip")
      .attr("id", "scatterplot-tooltip");
    
    // controls
    const controls = container.append("div")
      .attr("class", "scatterplot-controls")
      .style("position", "absolute")
      .style("top", "10px")
      .style("right", "10px")
      .style("background", "black")
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
    
    const prevButton = controls.append("button")
      .attr("id", "scatterplot-prev-year")
      .text("❮")
      .style("background", "none")
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
    
    // Next year button
    const nextButton = controls.append("button")
      .attr("id", "scatterplot-next-year")
      .text("❯")
      .style("background", "none")
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
    
    // Update year 
    d3.select("#scatterplot-year-display").text(`Year: ${currYear}`);
    d3.select("#scatterplot-year-label").text(`${currYear}`);
    
    // Update arrow colors
    updateArrowColors();
    
    // Filter data for current year
    const yearData = scatterplotData.filter(d => d.Year === currYear);
    
    // Get poverty column name for this year
    const povertyCol = getPovertyColumnForYear(currYear);
    const imprisonmentCol = "Total adult imprisonments per 100,000/population age 18-69";
    
    // Process data for year
    const processedData = yearData
    .filter(d => d[povertyCol] !== null && !isNaN(d[povertyCol]) && 
                 d[imprisonmentCol] !== null && !isNaN(d[imprisonmentCol]) &&
                 d.County)
    .map(d => ({
      county: d.County,
      povertyRate: +d[povertyCol] * 100, 
      imprisonmentRate: +d[imprisonmentCol],
      totalPopulation: d['Total population'],
      adultImprisonments: d['Total adult imprisonments']
    }));
        
    updateScales(processedData, povertyCol, imprisonmentCol);
    
    updatePoints(processedData);
    
    updateRegressionLine(processedData);
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
    // Get extents
    const xExtent = d3.extent(data, d => d.povertyRate);
    const yExtent = d3.extent(data, d => d.imprisonmentRate);
    
    // Update x scale
    xScale = d3.scaleLinear()
      .domain([Math.max(0, xExtent[0] - 2), xExtent[1] + 2])
      .range([0, getChartWidth()]);
    
    // Update y scale
    yScale = d3.scaleLinear()
      .domain([Math.max(0, yExtent[0] - 50), yExtent[1] + 50])
      .range([getChartHeight(), 0]);
    
    // Update color scale
    const counties = [...new Set(data.map(d => d.county))];
    colorScale = d3.scaleOrdinal()
      .domain(counties)
      .range(d3.schemeTableau10);
    
    // Update axes with larger tick labels
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
    const points = chartG.selectAll(".point")
      .data(data, d => d.county);
    
    // Remove old points
    points.exit()
      .transition()
      .duration(scatterplotConfig.transitionDuration)
      .attr("r", 0)
      .remove();
    
    // Update existing points
    points.transition()
      .duration(scatterplotConfig.transitionDuration)
      .attr("cx", d => xScale(d.povertyRate))
      .attr("cy", d => yScale(d.imprisonmentRate))
      .attr("fill", d => colorScale(d.county));
    
    // Add new points
    points.enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", d => xScale(d.povertyRate))
      .attr("cy", d => yScale(d.imprisonmentRate))
      .attr("r", 0)
      .attr("fill", d => colorScale(d.county))
      .attr("opacity", 0.8)
      .on("mouseover", showTooltip)
      .on("mouseout", hideTooltip)
      .transition()
      .duration(scatterplotConfig.transitionDuration)
      .attr("r", scatterplotConfig.pointRadius);
  }
  
  function updateRegressionLine(data) {
    // Calculate regression coefficients
    const regression = linearRegression(data.map(d => [d.povertyRate, d.imprisonmentRate]));
    
    // Generate line data
    const lineData = [
      { x: d3.min(data, d => d.povertyRate), y: regression.predict(d3.min(data, d => d.povertyRate)) },
      { x: d3.max(data, d => d.povertyRate), y: regression.predict(d3.max(data, d => d.povertyRate)) }
    ];
    
    // Update or create the line
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
    
    tooltip.transition()
      .duration(200)
      .style("opacity", 0.9);
    
    tooltip.html(`
      <strong>${d.county}</strong><br>
      Poverty Rate: ${d.povertyRate.toFixed(1)}%<br>
      Imprisonment Rate: ${d.imprisonmentRate.toFixed(1)} per 100,000<br>
      ${d.adultImprisonments ? `Total Imprisonments: ${d.adultImprisonments.toLocaleString()}<br>` : ''}
      ${d.totalPopulation ? `Population: ${d.totalPopulation.toLocaleString()}` : ''}
    `)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");
  }
  
  function hideTooltip() {
    d3.select("#scatterplot-tooltip")
      .transition()
      .duration(500)
      .style("opacity", 0);
  }
  
  function updateArrowColors() {
    // Previous button color
    if (currYear <= scatterplotConfig.yearRange[0]) {
      d3.select("#scatterplot-prev-year").style("color", "#444"); 
    } else {
      d3.select("#scatterplot-prev-year").style("color", "white"); 
    }
    
    // Next button color
    if (currYear >= scatterplotConfig.yearRange[1]) {
      d3.select("#scatterplot-next-year").style("color", "#444"); 
    } else {
      d3.select("#scatterplot-next-year").style("color", "white"); 
    }
  }
  
  initScatterplot();