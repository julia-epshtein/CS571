document.addEventListener('DOMContentLoaded', function() {
    // Load data
    d3.csv("data/all_years/measures_all_years.csv", d3.autoType).then(function(data) {
      // Process data to get averages per year
      const processedData = processData(data);
      
      // Create both charts
      const rateChart = createRateChart(processedData);
      const costChart = createCostChart(processedData);
      
      // Store references to both charts
      const charts = { rateChart, costChart };
      
      // Add overlay rectangles for better mouse detection
      addOverlayRectangles(charts);
      
      // Set up event listeners on overlay rectangles
      rateChart.svg.select(".overlay")
        .on("mouseenter", function() {
          // Show crosshairs on both charts when entering either chart
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
          // Show crosshairs on both charts when entering either chart
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
  
  function processData(data) {
    // Group data by year and calculate averages
    const groupedByYear = d3.group(data, d => d.Year);
    
    const processed = Array.from(groupedByYear, ([year, values]) => {
      const avgRate = d3.mean(values, d => d['Total adult imprisonments per 100,000/population age 18-69']);
      const avgCost = d3.mean(values, d => d['Total imprisonment costs (millions of dollars)']);
      
      return {
        year: year,
        avgRate: avgRate,
        avgCost: avgCost
      };
    });
    
    // Sort by year
    return processed.sort((a, b) => a.year - b.year);
  }
  
  function createRateChart(data) {
    // Set up dimensions
    const margin = {top: 20, right: 30, bottom: 40, left: 60};
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select("#rate-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([0, width]);
    
    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.avgRate) * 0.9, d3.max(data, d => d.avgRate) * 1.1])
      .range([height, 0]);
    
    // Add grid lines (both horizontal and vertical)
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
      );
    
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickSize(-height)
        .tickFormat("")
      );
    
    // Add axes
    svg.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));
    
    svg.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(y));
    
    // Add X axis label
    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .style("text-anchor", "middle")
      .text("Year");
    
    // Add Y axis label
    svg.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .text("Rate per 100,000");
    
    // Create line generator
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.avgRate))
      .curve(d3.curveMonotoneX);
    
    // Add the line path
    svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line)
      .attr("stroke", "#e41a1c");
    
    // Add circles for data points
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
    
    // Add tooltip
    const tooltip = d3.select("#rate-chart").append("div")
      .attr("class", "tooltip-above")
      .style("opacity", 0);
    
    return { svg, x, y, width, height, margin, focus, tooltip, data };
  }
  
  function createCostChart(data) {
    // Set up dimensions
    const margin = {top: 20, right: 30, bottom: 40, left: 60};
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select("#cost-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([0, width]);
    
    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.avgCost) * 0.9, d3.max(data, d => d.avgCost) * 1.1])
      .range([height, 0]);
    
    // Add grid lines (both horizontal and vertical)
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
      );
    
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickSize(-height)
        .tickFormat("")
      );
    
    // Add axes
    svg.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));
    
    svg.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(y));
    
    // Add X axis label
    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .style("text-anchor", "middle")
      .text("Year");
    
    // Add Y axis label
    svg.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .text("Cost (Millions $)");
    
    // Create line generator
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
  
  // Function to add overlay rectangles for better mouse tracking
  function addOverlayRectangles({ rateChart, costChart }) {
    // Add an overlay rectangle to rate chart for better mouse detection
    rateChart.svg.append("rect")
      .attr("class", "overlay")
      .attr("width", rateChart.width)
      .attr("height", rateChart.height)
      .style("fill", "none")
      .style("pointer-events", "all");
    
    // Add an overlay rectangle to cost chart for better mouse detection
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
    
    // Update rate chart
    const rateX = rateChart.x(year);
    // For y-position, use the interpolated value for smooth curve following
    const rateY = rateChart.y(interpolatedRate);
    
    rateChart.focus.select(".crosshair-line")
      .attr("transform", `translate(${rateX},0)`);
    
    rateChart.focus.select(".crosshair-circle")
      .attr("transform", `translate(${rateX},${rateY})`);
    
    rateChart.tooltip
      .html(`Year: ${year.toFixed(1)}<br/>Rate: ${interpolatedRate.toFixed(1)}`)
      .style("left", (rateX + rateChart.margin.left) + "px")
      .style("top", (rateY + rateChart.margin.top) + "px")
      .style("opacity", 1);
    
    // Update cost chart
    const costX = costChart.x(year);
    const costY = costChart.y(interpolatedCost);
    
    costChart.focus.select(".crosshair-line")
      .attr("transform", `translate(${costX},0)`);
    
    costChart.focus.select(".crosshair-circle")
      .attr("transform", `translate(${costX},${costY})`);
    
    costChart.tooltip
      .html(`Year: ${year.toFixed(1)}<br/>Cost: $${interpolatedCost.toFixed(1)}M`)
      .style("left", (costX + costChart.margin.left) + "px")
      .style("top", (costY + costChart.margin.top) + "px")
      .style("opacity", 1);
  }
  
  function hideCrosshair({ rateChart, costChart }) {
    rateChart.focus.style("opacity", 0);
    costChart.focus.style("opacity", 0);
    rateChart.tooltip.style("opacity", 0);
    costChart.tooltip.style("opacity", 0);
  }