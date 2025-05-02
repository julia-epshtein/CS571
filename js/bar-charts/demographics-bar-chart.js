// Configuration
const demographicsConfig = {
    width: 600,
    height: 400,
    margin: { top: 30, right: 30, bottom: 100, left: 60 },
    colors: {
      'White': '#FFF1C9',
      'Black': '#2b0b3f',
      'Hispanic': '#57167e',
      'Asian': '#f7b7a3',
      'Other': '#ea5f89'
    }
  };
  
  // Ethnicity group mappings
  const ethnicityGroups = {
    'Black': ['Black'],
    'White': ['White'],
    'Hispanic': ['Hispanic', 'Mexican', 'Salvadorian', 'Puerto Rican', 'Guatemalan', 'Cuban', 'Columbian', 'Nicaraguan'],
    'Asian': ['Other Asian', 'Chinese', 'Cambodian', 'Korean', 'Indian', 'Japanese', 'Thai', 'Vietnamese', 'Filipino'],
    'Other': ['Other', 'American Indian', 'Laotian', 'Jamaican', 'Unknown', 'Pacific Islander', 'Samoan', 'Hawaiian', 'Guamanian']
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
        .style("background-color", "black")
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
        percentage: (count / data.length * 100).toFixed(1) + '%'
    })).sort((a, b) => b.count - a.count);
    
    return {
        barData,
        total: data.length
    };
  }
  
  // Render visualization
  function renderDemographicsVisualization({ barData }) {
    const svg = d3.select(".demographics-bar-svg");
    const width = demographicsConfig.width - demographicsConfig.margin.left - demographicsConfig.margin.right;
    const height = demographicsConfig.height - demographicsConfig.margin.top - demographicsConfig.margin.bottom;
  
    const color = d3.scaleOrdinal()
        .domain(barData.map(d => d.group))
        .range(barData.map(d => demographicsConfig.colors[d.group]));
  
    // X axis
    const x = d3.scaleBand()
        .range([0, width])
        .domain(barData.map(d => d.group))
        .padding(0.2);
        
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end")
        .style("fill", "white");
    
    // Y axis
    const y = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.count)])
        .range([height, 0]);
        
    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("fill", "white");
  
    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("color", "white");
  
    // Bars
    svg.selectAll("bars")
        .data(barData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.group))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", d => color(d.group))
        .attr("stroke", "white")
        .style("stroke-width", 1)
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`
                <div style="margin-bottom: 4px; font-weight: 700; color: white;">${d.group}</div>
                <div style="color: white;">Count: ${d.count.toLocaleString()}</div>
                <div style="color: white;">${d.percentage}</div>
            `)
                .style("left", `${event.pageX + 15}px`)
                .style("top", `${event.pageY - 30}px`);
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
        
    // Add percentage labels on top of bars
    svg.selectAll(".label")
        .data(barData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.group) + x.bandwidth() / 2)
        .attr("y", d => y(d.count) - 5)
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .text(d => d.percentage);
  }
  
  // Render legend
  function renderDemographicsLegend({ barData }) {
    const color = d3.scaleOrdinal()
        .domain(barData.map(d => d.group))
        .range(barData.map(d => demographicsConfig.colors[d.group]));
  
    const legend = d3.select("#legend");
    legend.html("");
  
    barData.forEach(d => {
        const item = legend.append("div")
            .attr("class", "legend-item");
  
        item.append("div")
            .attr("class", "legend-color")
            .style("background-color", color(d.group));
  
        item.append("span")
            .attr("class", "legend-text")
            .style("color", "white")
            .text(`${d.group}: ${d.percentage}`);
    });
  }
  
  document.addEventListener("DOMContentLoaded", initDemographicsVisualization);