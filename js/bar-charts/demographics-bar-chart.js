// Configuration
const demographicsConfig = {
  width: 400, 
  height: 300, 
  margin: { top: 10, right: 60, bottom: 20, left: 80 },
  barHeight: 30,
  barPadding: 15,
  colors: {
    'Black': '#cb4f1b', 
    'Latino': '#cb4f1b',
    'White': '#cb4f1b',
    'Other': '#cb4f1b'
  },
  barWidth: 220, 
  maxBarLength: 220 
};


const ethnicityGroups = {
  'Black': ['Black'],
  'White': ['White'],
  'Latino': ['Hispanic', 'Mexican', 'Salvadorian', 'Puerto Rican', 'Guatemalan', 'Cuban', 'Columbian', 'Nicaraguan'],
  'Other': ['Other Asian', 'Chinese', 'Cambodian', 'Korean', 'Indian', 'Japanese', 'Thai', 'Vietnamese', 'Filipino', 'Other', 'American Indian', 'Laotian', 'Jamaican', 'Unknown', 'Pacific Islander', 'Samoan', 'Hawaiian', 'Guamanian'],
};


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


  const y = d3.scaleBand()
    .domain(barData.map(d => d.group))
    .range([0, height])
    .padding(0.3);
    
  const barWidth = demographicsConfig.barWidth;

  svg.selectAll(".bar-background")
    .data(barData)
    .enter()
    .append("rect")
    .attr("class", "bar-background")
    .attr("y", d => y(d.group))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", width)
    .attr("fill", "#fcfcfc")
    .attr("opacity", 0.08);

  svg.append("g")
    .attr("class", "category-labels")
    .selectAll("text")
    .data(barData)
    .enter()
    .append("text")
    .attr("x", -10)
    .attr("y", d => y(d.group) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .style("fill", "white")
    .style("font-size", "14px")
    .text(d => d.group);

  svg.selectAll(".domain").style("stroke", "none");
  svg.selectAll(".tick line").style("stroke", "none");
  svg.selectAll(".tick text").style("display", "none");

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
    .attr("width", d => {
      const maxPercentage = d3.max(barData, d => parseFloat(d.percentage));
      return (parseFloat(d.percentage) / maxPercentage) * demographicsConfig.maxBarLength;
    })
    .attr("fill", d => demographicsConfig.colors[d.group])
    .attr("rx", 2) 
    .attr("ry", 2) 
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
    .attr("x", d => {
      return 60; 
    })
    .attr("y", d => y(d.group) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(d => d.percentage + "%");
    
}

document.addEventListener("DOMContentLoaded", initDemographicsVisualization);