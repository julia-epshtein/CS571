// Configuration
const demographicsConfig = {
    width: 800,
    height: 500,
    margin: { top: 80, right: 100, bottom: 150, left: 120 },
    barHeight: 50,
    barPadding: 30,
    colors: {
      'Latino': '#cb4f1b', 
      'Black': '#cb4f1b',   
      'White': '#cb4f1b',    
      'Asian / Other': '#cb4f1b',   
    }
  };
  
  const ethnicityGroups = {
    'Black': ['Black'],
    'White': ['White'],
    'Latino': ['Hispanic', 'Mexican', 'Salvadorian', 'Puerto Rican', 'Guatemalan', 'Cuban', 'Columbian', 'Nicaraguan'],
    'Asian / Other': ['Other Asian', 'Chinese', 'Cambodian', 'Korean', 'Indian', 'Japanese', 'Thai', 'Vietnamese', 'Filipino', 'Other', 'American Indian', 'Laotian', 'Jamaican', 'Unknown', 'Pacific Islander', 'Samoan', 'Hawaiian', 'Guamanian'],
  };
  
  // Initialization
  function initDemographicsVisualization() {
    setupDemographicsSVG();
    loadDemographicsData();
  }
  
  // SVG container
  function setupDemographicsSVG() {
    d3.select("#bar-chart")
      .append("svg")
      .attr("width", demographicsConfig.width)
      .attr("height", demographicsConfig.height)
      .style("background-color", "black") // Black background
      .append("g")
      .attr("transform", `translate(${demographicsConfig.margin.left}, ${demographicsConfig.margin.top})`)
      .attr("class", "demographics-bar-svg");
  }
  
  // Load and process data
  function loadDemographicsData() {
    d3.csv("data/demographics.csv").then(data => {
      const processedData = processDemographicsData(data);
      renderDemographicsVisualization(processedData);
      renderDemographicsLegend(processedData);
    });
  }
  
  function processDemographicsData(data) {
    // Create a map to count each ethnicity group
    const groupCounts = {};
    
    // Initialize counts for each group
    Object.keys(ethnicityGroups).forEach(group => {
      groupCounts[group] = 0;
    });
    
    // Count each ethnicity
    data.forEach(d => {
      const ethnicity = d.Ethnicity;
      let foundGroup = false;
      
      // Find which group this ethnicity belongs to
      for (const [group, ethnicities] of Object.entries(ethnicityGroups)) {
        if (ethnicities.includes(ethnicity)) {
          groupCounts[group]++;
          foundGroup = true;
          break;
        }
      }
      
      // If not found in any specific group, count as 'Other'
      if (!foundGroup) {
        groupCounts['Other']++;
      }
    });
    
    // Convert to array and calculate percentages
    const barData = Object.entries(groupCounts).map(([group, count]) => ({
      group,
      count,
      percentage: (count / data.length * 100).toFixed(1)
    })).sort((a, b) => b.count - a.count); // Sort by count descending
    
    return {
      barData,
      total: data.length
    };
  }
  
  // Render visualization - HORIZONTAL bar chart
  function renderDemographicsVisualization({ barData, total }) {
    const svg = d3.select(".demographics-bar-svg");
    const width = demographicsConfig.width - demographicsConfig.margin.left - demographicsConfig.margin.right;
    const height = barData.length * (demographicsConfig.barHeight + demographicsConfig.barPadding);
  
    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("class", "chart-title")
      .style("fill", "white")
      .style("font-size", "28px")
      .style("font-weight", "bold")
      .text("Percent of People in Prison");
  
    // Y scale for groups (horizontal axis labels)
    const y = d3.scaleBand()
      .domain(barData.map(d => d.group))
      .range([0, height])
      .padding(0.1);
      
    // X scale for values (horizontal bar lengths)
    const xMax = d3.max(barData, d => d.count);
    const x = d3.scaleLinear()
      .domain([0, xMax * 1.1]) // Add 10% padding
      .range([0, width]);
  
    // Add y-axis (groups on left)
    svg.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "white")
      .style("font-size", "16px");
  
    // Remove axis lines
    svg.selectAll(".domain").style("stroke", "none");
    svg.selectAll(".tick line").style("stroke", "none");
  
    // Create tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background-color", "#111")
      .style("border", "1px solid #333")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("color", "white")
      .style("font-size", "14px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 10);
  
    // Create bars - HORIZONTAL orientation
    svg.selectAll(".bar")
      .data(barData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => y(d.group))
      .attr("x", 0)
      .attr("height", y.bandwidth())
      .attr("width", d => x(d.count))
      .attr("fill", d => demographicsConfig.colors[d.group])
      .on("mouseover", function(event, d) {
        d3.select(this).style("opacity", 0.8);
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip.html(`
          <div style="font-weight: bold; margin-bottom: 5px;">${d.group}</div>
          <div>Count: ${d.count.toLocaleString()}</div>
          <div>${d.percentage}%</div>
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).style("opacity", 1);
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
  
    // Add percentage labels inside bars
    svg.selectAll(".percent-label")
      .data(barData)
      .enter()
      .append("text")
      .attr("class", "percent-label")
      .attr("x", d => Math.min(x(d.count) / 2, 50))
      .attr("y", d => y(d.group) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(d => d.percentage + "%");
    
    // Add count labels on the right end of bars
    svg.selectAll(".count-label")
      .data(barData)
      .enter()
      .append("text")
      .attr("class", "count-label")
      .attr("x", d => x(d.count) + 10)
      .attr("y", d => y(d.group) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("fill", "white")
      .style("font-size", "14px")
      .text(d => d.count.toLocaleString());
  }
  
  // Render legend
  function renderDemographicsLegend({ barData }) {
    const svg = d3.select("svg");
    const legendY = demographicsConfig.height - 60;
    
    // Create legend group
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${demographicsConfig.margin.left}, ${legendY})`);
    
    const legendWidth = demographicsConfig.width - demographicsConfig.margin.left - demographicsConfig.margin.right;
    const legendItemWidth = legendWidth / barData.length;
    
    // Add legend items
    barData.forEach((d, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(${i * legendItemWidth}, 0)`);
      
      // Add color square
      legendItem.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", demographicsConfig.colors[d.group]);
      
      // Add text
      legendItem.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .style("fill", "white")
        .style("font-size", "14px")
        .text(`${d.group}: ${d.percentage}%`);
    });
  }
  
  document.addEventListener("DOMContentLoaded", initDemographicsVisualization);