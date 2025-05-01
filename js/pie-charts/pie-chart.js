// Configuration
const config = {
    width: 450,
    height: 400,
    margin: 40,
    colors: {
        'White': '#FFF1C9',
        'Black': '#2b0b3f',
        'Hispanic': '#57167e',
        'Asian': '#f7b7a3',
        'Other': '#ea5f89'
    }
};

// Group ethnic groups by race
const ethnicityGroups = {
  'Black': ['Black'],
  'White': ['White'],
  'Hispanic': ['Hispanic', 'Mexican', 'Salvadorian', 'Puerto Rican', 'Guatemalan', 'Cuban', 'Columbian', 'Nicaraguan'],
  'Asian': ['Other Asian', 'Chinese', 'Cambodian', 'Korean', 'Indian', 'Japanese', 'Thai', 'Vietnamese', 'Filipino'],
  'Other': ['Other', 'American Indian', 'Laotian', 'Jamaican', 'Unknown', 'Pacific Islander', 'Samoan', 'Hawaiian', 'Guamanian']
};

function initVisualization() {
  setupSVG();
  loadData();
}

// Container
function setupSVG() {
  const radius = Math.min(config.width, config.height) / 2 - config.margin;

  d3.select("#pie-chart")
      .append("svg")
      .attr("width", config.width)
      .attr("height", config.height)
      .append("g")
      .attr("transform", `translate(${config.width / 2}, ${config.height / 2})`)
      .attr("class", "pie-chart-svg");

  d3.select("#chart-container").append("div").attr("id", "legend");
}

// Load and process data
function loadData() {
  d3.csv("data/demographics.csv").then(data => {
      const processedData = processData(data);
      renderVisualization(processedData);
      renderLegend(processedData.pieData);
      renderSummary(processedData.total);
  });
}

// Process raw CSV data w/ grouping
function processData(data) {
  const groupedCounts = new Map();
  Object.keys(ethnicityGroups).forEach(group => {
      groupedCounts.set(group, 0);
  });

  const originalCounts = d3.rollup(data, v => v.length, d => d.Ethnicity);

  originalCounts.forEach((count, ethnicity) => {
      let foundGroup = false;
      for (const [group, members] of Object.entries(ethnicityGroups)) {
          if (members.includes(ethnicity)) {
              groupedCounts.set(group, groupedCounts.get(group) + count);
              foundGroup = true;
              break;
          }
      }
      if (!foundGroup) {
          groupedCounts.set('Other', groupedCounts.get('Other') + count);
      }
  });

  const pieData = Array.from(groupedCounts, ([group, count]) => ({
      group,
      count,
      percentage: (count / data.length * 100).toFixed(1) + '%'
  })).filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count);

  return {
      pieData,
      total: data.length
  };
}

// Pie chart
function renderVisualization({ pieData }) {
  const svg = d3.select(".pie-chart-svg");
  const radius = Math.min(config.width, config.height) / 2 - config.margin;

  const color = d => config.colors[d.group] || '#ea5f89'; 

  const pie = d3.pie()
      .value(d => d.count)
      .sort(null);

  const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

  // Tooltip 
  const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  // arcs
  const arcs = svg.selectAll(".arc")
      .data(pie(pieData))
      .enter()
      .append("g")
      .attr("class", "arc");

  arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data))
      .attr("stroke", "white")
      .style("stroke-width", 2)
      .on("mouseover", (event, d) => {
          tooltip.transition()
              .duration(200)
              .style("opacity", 0.9);
          tooltip.html(`
              <div style="margin-bottom: 4px; font-weight: 700;">${d.data.group}</div>
              <div>Count: ${d.data.count.toLocaleString()}</div>
              <div>${d.data.percentage}</div>
          `)
              .style("left", `${event.pageX + 15}px`)
              .style("top", `${event.pageY - 30}px`);
      })
      .on("mouseout", () => {
          tooltip.transition()
              .duration(500)
              .style("opacity", 0);
      });
}

// legend
function renderLegend(pieData) {
  const color = d => config.colors[d.group] || '#ea5f89'; 

  const legend = d3.select("#legend");
  legend.html("");  

  pieData.forEach(d => {
      const item = legend.append("div").attr("class", "legend-item");

      item.append("div")
          .attr("class", "legend-color")
          .style("background-color", color(d));

      item.append("span")
          .attr("class", "legend-text")
          .text(`${d.group}: ${d.percentage}`);
  });
}

// summary
function renderSummary(total) {
  d3.select("#summary")
      .append("p")
      .text(`Total inmates: ${total.toLocaleString()}`);
}

initVisualization();