// Configuration
const demographicsConfig = {
    width: 800,
    height: 500,
    margin: { top: 80, right: 100, bottom: 150, left: 120 },
    barHeight: 50,
    barPadding: 30,
    colors: {
      'Black': '#293a54',
      'Latino': '#293a54',
      'White': '#293a54',
      'Other': '#293a54'
    }
  };
  
  const ethnicityGroups = {
    'Black': ['Black'],
    'White': ['White'],
    'Latino': ['Hispanic', 'Mexican', 'Salvadorian', 'Puerto Rican', 'Guatemalan', 'Cuban', 'Columbian', 'Nicaraguan'],
    'Other': ['Other Asian', 'Chinese', 'Cambodian', 'Korean', 'Indian', 'Japanese', 'Thai', 'Vietnamese', 'Filipino', 'Other', 'American Indian', 'Laotian', 'Jamaican', 'Unknown', 'Pacific Islander', 'Samoan', 'Hawaiian', 'Guamanian'],
  };
  
  // Initialization
  function initDemographicsVisualization() {
    setupDemographicsSVG();
    loadDemographicsData();
  }
  
  function setupDemographicsSVG() {
    d3.select("#bar-chart")
      .append("svg")
      .attr("width", demographicsConfig.width)
      .attr("height", demographicsConfig.height)
      .style("background-color", "black")
      .append("g")
      .attr("transform", `translate(${demographicsConfig.margin.left}, ${demographicsConfig.margin.top})`)
      .attr("class", "demographics-bar-svg");
  }
  
  function loadDemographicsData() {
    d3.csv("data/demographics.csv").then(data => {
      const processedData = processDemographicsData(data);
      renderDemographicsVisualization(processedData);
    });
  }
  
  function processDemographicsData(data) {
    const groupCounts = {};
    
    Object.keys(ethnicityGroups).forEach(group => {
      groupCounts[group] = 0;
    });
    
    data.forEach(d => {
      const ethnicity = d.Ethnicity;
      let foundGroup = false;
      
      for (const [group, ethnicities] of Object.entries(ethnicityGroups)) {
        if (ethnicities.includes(ethnicity)) {
          groupCounts[group]++;
          foundGroup = true;
          break;
        }
      }
      
      if (!foundGroup) {
        groupCounts['Asian / Other']++;
      }
    });
    
    const barData = Object.entries(groupCounts).map(([group, count]) => ({
      group,
      count,
      percentage: (count / data.length * 100).toFixed(1)
    })).sort((a, b) => {
      const order = { 'Black': 0, 'Latino': 1, 'White': 2, 'Asian / Other': 3 };
      return order[a.group] - order[b.group];
    });
    
    return {
      barData,
      total: data.length
    };
  }
  
  function renderDemographicsVisualization({ barData, total }) {
    const svg = d3.select(".demographics-bar-svg");
    const width = demographicsConfig.width - demographicsConfig.margin.left - demographicsConfig.margin.right;
    const height = barData.length * (demographicsConfig.barHeight + demographicsConfig.barPadding);
  
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("class", "chart-title")
      .style("fill", "white")
      .style("font-size", "28px")
      .style("font-weight", "bold")
      .style("font-family", "'Inter', sans-serif")
      .text("Percent of People in Prison");
  
    const y = d3.scaleBand()
      .domain(barData.map(d => d.group))
      .range([0, height])
      .padding(0.1);
      
    const xMax = d3.max(barData, d => d.count);
    const x = d3.scaleLinear()
      .domain([0, xMax * 1.1])
      .range([0, width]);
  
    svg.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "white")
      .style("font-size", "16px");
  
    svg.selectAll(".domain").style("stroke", "none");
    svg.selectAll(".tick line").style("stroke", "none");
  
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
  
  document.addEventListener("DOMContentLoaded", initDemographicsVisualization);