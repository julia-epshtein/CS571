// Configuration
const ethnicityBarConfig = {
    width: 450,
    height: 400,
    margin: { top: 30, right: 30, bottom: 70, left: 60 },
    colors: {
        'White': '#FFF1C9',
        'Black': '#2b0b3f',
        'Hispanic': '#57167e',
        'Asian': '#f7b7a3',
        'Other': '#ea5f89'
    }
};

const ethnicityGroups = {
  'Black': ['Black'],
  'White': ['White'],
  'Hispanic': ['Hispanic', 'Mexican', 'Salvadorian', 'Puerto Rican', 'Guatemalan', 'Cuban', 'Columbian', 'Nicaraguan'],
  'Asian': ['Other Asian', 'Chinese', 'Cambodian', 'Korean', 'Indian', 'Japanese', 'Thai', 'Vietnamese', 'Filipino'],
  'Other': ['Other', 'American Indian', 'Laotian', 'Jamaican', 'Unknown', 'Pacific Islander', 'Samoan', 'Hawaiian', 'Guamanian']
};

function initEthnicityBarChart() {
  setupBarSVG();
  loadEthnicityData();
}

function setupBarSVG() {
  d3.select("#bars-chart")
    .append("svg")
    .attr("width", ethnicityBarConfig.width)
    .attr("height", ethnicityBarConfig.height)
    .append("g")
    .attr("transform", `translate(${ethnicityBarConfig.margin.left},${ethnicityBarConfig.margin.top})`)
    .attr("class", "ethnicity-bar-chart-svg");
    
  d3.select("#legend");
}

function loadEthnicityData() {
  d3.csv("data/demographics.csv").then(data => {
    const processedData = processEthnicityData(data);
    renderEthnicityBarChart(processedData.chartData);
    renderEthnicityLegend(processedData.chartData);
    renderEthnicitySummary(processedData.total);
  });
}

function processEthnicityData(data) {
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

  const chartData = Array.from(groupedCounts, ([group, count]) => ({
    group,
    count,
    percentage: (count / data.length * 100).toFixed(1)
  })).filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    chartData,
    total: data.length
  };
}

function renderEthnicityBarChart({ chartData }) {
  const svg = d3.select(".ethnicity-bar-chart-svg");
  const width = ethnicityBarConfig.width - ethnicityBarConfig.margin.left - ethnicityBarConfig.margin.right;
  const height = ethnicityBarConfig.height - ethnicityBarConfig.margin.top - ethnicityBarConfig.margin.bottom;

  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  const x = d3.scaleBand()
    .domain(chartData.map(d => d.group))
    .range([0, width])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end")
    .style("fill", "white");

  svg.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"))
    .selectAll("text")
    .style("fill", "white");
    
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .text("Percent of prison population");

  svg.selectAll(".bar")
    .data(chartData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.group))
    .attr("y", d => y(d.percentage))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.percentage))
    .attr("fill", d => ethnicityBarConfig.colors[d.group])
    .on("mouseover", (event, d) => {
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.9);
      tooltip.html(`
        <div style="margin-bottom: 4px; font-weight: 700;">${d.group}</div>
        <div>Count: ${d.count.toLocaleString()}</div>
        <div>${d.percentage}%</div>
      `)
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY - 30}px`);
    })
    .on("mouseout", () => {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });

  svg.selectAll(".label")
    .data(chartData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => x(d.group) + x.bandwidth() / 2)
    .attr("y", d => y(d.percentage) - 5)
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-size", "12px")
    .text(d => `${d.percentage}%`);
}

function renderEthnicityLegend(chartData) {
  const legend = d3.select("#legend");
  legend.html("");  

  chartData.forEach(d => {
    const item = legend.append("div").attr("class", "legend-item");

    item.append("div")
      .attr("class", "legend-color")
      .style("background-color", ethnicityBarConfig.colors[d.group]);

    item.append("span")
      .attr("class", "legend-text")
      .text(`${d.group}: ${d.percentage}%`);
  });
}

function renderEthnicitySummary(total) {
  d3.select("#summary")
    .append("p")
    .text(`Total inmates: ${total.toLocaleString()}`);
}

document.addEventListener("DOMContentLoaded", function() {
  initEthnicityBarChart();
});