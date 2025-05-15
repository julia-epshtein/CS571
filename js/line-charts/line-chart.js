document.addEventListener('DOMContentLoaded', function() {
  // Define chart dimensions centrally
  const chartWidth = 700;
  const chartHeight = 500;
  const margin = {top: 20, right: 50, bottom: 60, left: 70}; 
  const width = chartWidth - margin.left - margin.right;
  const height = chartHeight - margin.top - margin.bottom;

  // Load data
  d3.csv("data/all_years/measures_all_years.csv", d3.autoType).then(function(data) {
    const processedData = processData(data);

    // Pass dimensions and margin to chart creation functions
    const rateChart = createRateChart(processedData, width, height, margin);
    const costChart = createCostChart(processedData, width, height, margin);

    const charts = { rateChart, costChart };

    addOverlayRectangles(charts);

    rateChart.svg.select(".overlay")
      .on("mouseenter", function() {
        rateChart.focus.style("opacity", 1);
        costChart.focus.style("opacity", 1);
      })
      .on("mousemove", function(event) {
        const [xPos] = d3.pointer(event);
        updateCrosshair(xPos, charts);
      })
      .on("mouseleave", function() {
        hideCrosshair(charts);
      });

    costChart.svg.select(".overlay")
      .on("mouseenter", function() {
        rateChart.focus.style("opacity", 1);
        costChart.focus.style("opacity", 1);
      })
      .on("mousemove", function(event) {
        const [xPos] = d3.pointer(event);
        updateCrosshair(xPos, charts);
      })
      .on("mouseleave", function() {
        hideCrosshair(charts);
      });

  }).catch(function(error) {
    console.error("Error loading the data:", error);
  });
});

const reforms = {
  2009: "Three Strikes Law in full effect",
  2011: "Public Safety Realignment Act (AB 109)",
  2012: "Proposition 36 reformed Three Strikes Law",
  2014: "Proposition 47 reduced some felonies to misdemeanors",
  2016: "Proposition 57 expanded parole eligibility"
};

function processData(data) {
  // Group data by year and calculate averages
  const groupedByYear = d3.group(data, d => d.Year);

  const processed = Array.from(groupedByYear, ([year, values]) => {
    const avgRate = d3.mean(values, d => d['Total adult imprisonments per 100,000/population age 18-69']);
    const avgCost = d3.mean(values, d => d['Total imprisonment costs (millions of dollars)']);

    return {
      year: +year,
      avgRate: avgRate,
      avgCost: avgCost,
      reform: reforms[year] || ""
    };
  });

  // Sort by year and make sure no duplicates
  return processed
    .sort((a, b) => a.year - b.year)
    .filter((item, index, self) => 
      index === self.findIndex(t => t.year === item.year)
    );
}

function createRateChart(data, width, height, margin) {
  d3.select("#rate-chart").html("");

  const chartWidth = width + margin.left + margin.right;
  const chartHeight = height + margin.top + margin.bottom;

  // SVG
  const svg = d3.select("#rate-chart")
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("viewBox", `0 0 ${chartWidth} ${chartHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // scales
  const x = d3.scaleLinear()
    .domain([d3.min(data, d => d.year) - 0.5, d3.max(data, d => d.year) + 0.5])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([d3.min(data, d => d.avgRate) * 0.9, d3.max(data, d => d.avgRate) * 1.1])
    .range([height, 0]);

  // grid lines
  svg.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat("")
    );

  // x-axis
  svg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .tickFormat(d3.format("d"))
      .ticks(data.length) 
      .tickValues(data.map(d => d.year)));

  // y-axis
  svg.append("g")
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(y));

  // axis labels 
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("font-family", "'Inter', sans-serif")
    .text("Year");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 15)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("font-family", "'Inter', sans-serif")
    .text("Rate per 100,000");

  // line generator
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.avgRate))
    .curve(d3.curveMonotoneX);

  // line path
  svg.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line)
    .attr("stroke", "#e41a1c");

  // circles for data points
  svg.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.avgRate))
    .attr("r", 4)
    .attr("fill", "#e41a1c");

  // Add crosshair elements
  const focus = svg.append("g")
    .attr("class", "focus")
    .style("opacity", 0);

  focus.append("line")
    .attr("class", "crosshair-line")
    .attr("y1", 0)
    .attr("y2", height);

  focus.append("circle")
    .attr("class", "crosshair-circle")
    .attr("r", 5);

  // tooltip
  const tooltip = d3.select("#rate-chart").append("div")
    .attr("class", "tooltip-above")
    .style("opacity", 0);

  return { svg, x, y, width, height, margin, focus, tooltip, data };
}

function createCostChart(data, width, height, margin) {
  d3.select("#cost-chart").html("");
  
  const chartWidth = width + margin.left + margin.right;
  const chartHeight = height + margin.top + margin.bottom;

  // SVG
  const svg = d3.select("#cost-chart")
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("viewBox", `0 0 ${chartWidth} ${chartHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // scales 
  const x = d3.scaleLinear()
    .domain([d3.min(data, d => d.year) - 0.5, d3.max(data, d => d.year) + 0.5])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([d3.min(data, d => d.avgCost) * 0.9, d3.max(data, d => d.avgCost) * 1.1])
    .range([height, 0]);

  // grid lines 
  svg.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat("")
    );

  // x-axis 
  svg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .tickFormat(d3.format("d"))
      .ticks(data.length) 
      .tickValues(data.map(d => d.year))); 

  // y-axis
  svg.append("g")
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(y));

  // X axis label
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("font-family", "'Inter', sans-serif")
    .text("Year");

  // Y axis label 
  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 15)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("font-family", "'Inter', sans-serif")
    .text("Cost (Millions $)");

  // line generator
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.avgCost))
    .curve(d3.curveMonotoneX);

  // Add the line path
  svg.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line)
    .attr("stroke", "#377eb8");

  // Add circles for data points
  svg.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.avgCost))
    .attr("r", 4)
    .attr("fill", "#377eb8");

  // Add crosshair elements
  const focus = svg.append("g")
    .attr("class", "focus")
    .style("opacity", 0);

  focus.append("line")
    .attr("class", "crosshair-line")
    .attr("y1", 0)
    .attr("y2", height);

  focus.append("circle")
    .attr("class", "crosshair-circle")
    .attr("r", 5);

  // Add tooltip
  const tooltip = d3.select("#cost-chart").append("div")
    .attr("class", "tooltip-above")
    .style("opacity", 0);

  return { svg, x, y, width, height, margin, focus, tooltip, data };
}

function addOverlayRectangles({ rateChart, costChart }) {
  rateChart.svg.append("rect")
    .attr("class", "overlay")
    .attr("width", rateChart.width)
    .attr("height", rateChart.height)
    .style("fill", "none")
    .style("pointer-events", "all");

  costChart.svg.append("rect")
    .attr("class", "overlay")
    .attr("width", costChart.width)
    .attr("height", costChart.height)
    .style("fill", "none")
    .style("pointer-events", "all");
}

function updateCrosshair(xPos, { rateChart, costChart }) {
  // Show crosshairs
  rateChart.focus.style("opacity", 1);
  costChart.focus.style("opacity", 1);

  // Find the closest data point using the rate chart's x scale
  const bisectYear = d3.bisector(d => d.year).left;
  const year = rateChart.x.invert(xPos);
  const i = bisectYear(rateChart.data, year, 1);

  // Get the two closest points for interpolation
  // Handle edge cases (beginning and end of data)
  let d0, d1;
  if (i === 0) {
    d0 = rateChart.data[0];
    d1 = rateChart.data[1];
  } else if (i >= rateChart.data.length) {
    d0 = rateChart.data[rateChart.data.length - 2];
    d1 = rateChart.data[rateChart.data.length - 1];
  } else {
    d0 = rateChart.data[i - 1];
    d1 = rateChart.data[i];
  }

  // Interpolate between the two closest points to get smooth movement
  // Calculate the interpolation factor (0-1) between the two points
  let t = 0;
  if (d1.year !== d0.year) { // Avoid division by zero
    t = (year - d0.year) / (d1.year - d0.year);
    // Restrict t to the range [0, 1]
    t = Math.max(0, Math.min(1, t));
  }

  // Interpolate values based on the factor t
  const interpolatedRate = d0.avgRate + t * (d1.avgRate - d0.avgRate);
  const interpolatedCost = d0.avgCost + t * (d1.avgCost - d0.avgCost);

  // Find the nearest actual data point for display
  const nearestIndex = Math.round(year) - rateChart.data[0].year;
  const nearestDataPoint = rateChart.data[Math.min(Math.max(0, nearestIndex), rateChart.data.length - 1)];

  // Update rate chart
  const rateX = rateChart.x(year);
  // For y-position, use the interpolated value for smooth curve following
  const rateY = rateChart.y(interpolatedRate);

  // Update crosshair line to extend from top to bottom
  rateChart.focus.select(".crosshair-line")
    .attr("transform", `translate(${rateX},0)`)
    .attr("y1", 0)
    .attr("y2", rateChart.height);

  // Update circle position to be exactly on the line
  rateChart.focus.select(".crosshair-circle")
    .attr("transform", `translate(${rateX},${rateY})`)
    .attr("r", 6)
    .attr("fill", "white")
    .attr("stroke", "#e41a1c")
    .attr("stroke-width", 2);

  // Update tooltip with actual data point value
  const nearestYear = Math.round(year);
  const reform = rateChart.data.find(d => d.year === nearestYear)?.reform || "";

  rateChart.tooltip
    .html(`<div class="tooltip-content">
            <strong>Year: ${nearestYear}</strong>
            <div style="margin-top: 6px;"><span style="color: #e41a1c; font-weight: 600;">Rate:</span> ${interpolatedRate.toFixed(1)} per 100,000</div>
            ${reform ? `<div style="margin-top: 6px;"><span style="color: #c89f65; font-weight: 600;">Reform:</span> ${reform}</div>` : ''}
          </div>`)
    .style("left", (rateX + rateChart.margin.left) + "px")
    .style("top", (rateY + rateChart.margin.top - 15) + "px")
    .style("opacity", 1);

  const costX = costChart.x(year);
  const costY = costChart.y(interpolatedCost);

  costChart.focus.select(".crosshair-line")
    .attr("transform", `translate(${costX},0)`)
    .attr("y1", 0)
    .attr("y2", costChart.height);

  costChart.focus.select(".crosshair-circle")
    .attr("transform", `translate(${costX},${costY})`)
    .attr("r", 6)
    .attr("fill", "white")
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2);

  const costNearestYear = Math.round(year);
  const costReform = costChart.data.find(d => d.year === costNearestYear)?.reform || "";

  costChart.tooltip
    .html(`<div class="tooltip-content">
            <strong>Year: ${costNearestYear}</strong>
            <div style="margin-top: 6px;"><span style="color: #1f77b4; font-weight: 600;">Cost:</span> $${interpolatedCost.toFixed(1)}M</div>
            ${costReform ? `<div style="margin-top: 6px;"><span style="color: #c89f65; font-weight: 600;">Reform:</span> ${costReform}</div>` : ''}
          </div>`)
    .style("left", (costX + costChart.margin.left) + "px")
    .style("top", (costY + costChart.margin.top - 15) + "px")
    .style("opacity", 1);
}

function hideCrosshair({ rateChart, costChart }) {
  rateChart.focus.style("opacity", 0);
  costChart.focus.style("opacity", 0);
  rateChart.tooltip.style("opacity", 0);
  costChart.tooltip.style("opacity", 0);
}