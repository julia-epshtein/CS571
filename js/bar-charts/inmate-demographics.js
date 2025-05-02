// Configuration
const config = {
  width: 500,
  height: 400,
  margin: 30,
  colors: ["#eff3ff","#c6dbef","#9ecae1","#6baed6","#3182bd","#08519c"].reverse()
};

// Group ethnic groups by race
const ethnicityGroups = {
  'Black': ['Black'],
  'White': ['White'],
  'Hispanic': ['Hispanic', 'Mexican', 'Salvadorian', 'Puerto Rican', 'Guatemalan', 'Cuban', 'Columbian', 'Nicaraguan'],
  'Asian': ['Other Asian', 'Chinese', 'Cambodian', 'Korean', 'Indian', 'Japanese', 'Thai', 'Vietnamese', 'Filipino'],
  'Pacific Islander': ['Pacific Islander', 'Samoan', 'Hawaiian', 'Guamanian'],
  'Other': ['Other', 'American Indian', 'Laotian', 'Jamaican', 'Unknown']
};

function initVisualization() {
  setupSVG();
  loadData();
}

// Prepare the SVG container for bars (not a centered g any more)
function setupSVG() {
  const svg = d3.select("#pie-chart")
    .append("svg")
      .attr("width", config.width)
      .attr("height", config.height)
    .append("g")
      .attr("transform", `translate(${config.margin}, ${config.margin})`)
      .attr("class", "bar-chart-svg");

  // build legend container
  d3.select("#chart-container")
    .append("div")
      .attr("id", "legend");
}

// Load, process, and draw
function loadData() {
  d3.csv("data/demographics.csv").then(data => {
    const processed = processData(data);
    renderVisualization(processed);
    renderLegend(processed.barData);
    renderSummary(processed.total);
  });
}

// Aggregate into barData + total
function processData(data) {
  const counts = new Map();
  Object.keys(ethnicityGroups).forEach(g => counts.set(g, 0));

  const raw = d3.rollup(data, v => v.length, d => d.Ethnicity);
  for (const [eth, cnt] of raw) {
    let placed = false;
    for (const [group, members] of Object.entries(ethnicityGroups)) {
      if (members.includes(eth)) {
        counts.set(group, counts.get(group) + cnt);
        placed = true;
        break;
      }
    }
    if (!placed) counts.set('Other', counts.get('Other') + cnt);
  }

  const barData = Array.from(counts, ([group, count]) => ({
      group,
      count,
      percentage: (count / data.length * 100).toFixed(1) + '%'
    }))
    .filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count);

  return { barData, total: data.length };
}

// Draw axes + bars + labels + tooltip
function renderVisualization({ barData }) {
  const svg = d3.select(".bar-chart-svg");
  const innerWidth  = config.width  - config.margin * 2;
  const innerHeight = config.height - config.margin * 2;

  // scales
  const x = d3.scaleBand()
      .domain(barData.map(d => d.group))
      .range([0, innerWidth])
      .padding(0.2);

  const y = d3.scaleLinear()
      .domain([0, d3.max(barData, d => d.count)])
      .nice()
      .range([innerHeight, 0]);

  const color = d3.scaleOrdinal()
      .domain(barData.map(d => d.group))
      .range(config.colors);

  // axes
  svg.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
        .attr("transform", "rotate(-40)")
        .attr("text-anchor", "end");

  svg.append("g")
      .call(d3.axisLeft(y));

  // tooltip
  const tooltip = d3.select("body")
    .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  // bars
  svg.selectAll(".bar")
    .data(barData)
    .enter()
    .append("rect")
      .attr("class", "bar")
      .attr("x",     d => x(d.group))
      .attr("y",     d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => innerHeight - y(d.count))
      .attr("fill",  d => color(d.group))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`
          <strong>${d.group}</strong><br/>
          Count: ${d.count.toLocaleString()}<br/>
          ${d.percentage}
        `)
        .style("left", `${event.pageX + 10}px`)
        .style("top",  `${event.pageY - 25}px`);
      })
      .on("mouseout", () => {
        tooltip.transition().duration(300).style("opacity", 0);
      });

  // value labels
  svg.selectAll(".label")
    .data(barData)
    .enter()
    .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.group) + x.bandwidth() / 2)
      .attr("y", d => y(d.count) - 5)
      .attr("text-anchor", "middle")
      .text(d => d.percentage);
}

// Legend using the same colors & percentages
function renderLegend(barData) {
  const color = d3.scaleOrdinal()
      .domain(barData.map(d => d.group))
      .range(config.colors);

  const legend = d3.select("#legend");
  legend.html("");  

  barData.forEach(d => {
    const item = legend.append("div").attr("class", "legend-item");
    item.append("div")
        .attr("class", "legend-color")
        .style("background-color", color(d.group));
    item.append("span")
        .attr("class", "legend-text")
        .text(`${d.group}: ${d.percentage}`);
  });
}

// Summary below chart
function renderSummary(total) {
  d3.select("#summary")
    .append("p")
    .text(`Total inmates: ${total.toLocaleString()}`);
}

initVisualization();
