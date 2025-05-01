// Configuration
const sentenceConfig = {
  width: 400,
  height: 400,
  margin: 30,
  colors: ["#f2f0f7","#dadaeb","#bcbddc","#9e9ac8","#756bb1","#54278f"].reverse()
};

// Initialization
function initSentenceVisualization() {
  setupSentenceSVG();
  loadSentenceData();
}

// SVG container
function setupSentenceSVG() {
  const radius = Math.min(sentenceConfig.width, sentenceConfig.height) / 2 - sentenceConfig.margin;

  d3.select("#sentence-pie-chart")
      .append("svg")
      .attr("width", sentenceConfig.width)
      .attr("height", sentenceConfig.height)
      .style("background-color", "black") 
      .append("g")
      .attr("transform", `translate(${sentenceConfig.width / 2}, ${sentenceConfig.height / 2})`)
      .attr("class", "sentence-pie-svg");
}

// Load and process data
function loadSentenceData() {
  d3.csv("data/demographics.csv").then(data => {
      const processedData = processSentenceData(data);
      renderSentenceVisualization(processedData);
      renderSentenceLegend(processedData.pieData);
      renderSentenceSummary(processedData.total);
  });
}

function processSentenceData(data) {
  // count each unique sentence type
  const sentenceCounts = d3.rollup(
      data,
      v => v.length,
      d => d['Sentence Type']
  );

  // Convert to array and filter out "Other"
  const pieData = Array.from(sentenceCounts, ([type, count]) => ({
      type: type,
      count,
      percentage: (count / data.length * 100).toFixed(1) + '%'
  }))
  .filter(d => d.count > 0 && d.type !== 'Other')  
  .sort((a, b) => b.count - a.count);

  return {
      pieData,
      total: data.length
  };
}

// Render 
function renderSentenceVisualization({ pieData }) {
  const svg = d3.select(".sentence-pie-svg");
  const radius = Math.min(sentenceConfig.width, sentenceConfig.height) / 2 - sentenceConfig.margin;

  const color = d3.scaleOrdinal()
      .domain(pieData.map(d => d.type))
      .range(sentenceConfig.colors);

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
      .style("opacity", 0)
      .style("color", "white"); 

  // arcs
  const arcs = svg.selectAll(".arc")
      .data(pie(pieData))
      .enter()
      .append("g")
      .attr("class", "arc");

  arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.type))
      .attr("stroke", "white")  
      .style("stroke-width", 2)
      .on("mouseover", (event, d) => {
          tooltip.transition()
              .duration(200)
              .style("opacity", 0.9);
          tooltip.html(`
              <div style="margin-bottom: 4px; font-weight: 700; color: white;">${d.data.type}</div>
              <div style="color: white;">Count: ${d.data.count.toLocaleString()}</div>
              <div style="color: white;">${d.data.percentage}</div>
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
function renderSentenceLegend(pieData) {
  const color = d3.scaleOrdinal()
      .domain(pieData.map(d => d.type))
      .range(sentenceConfig.colors);

  const legend = d3.select("#sentence-legend");
  legend.html("");  

  const legendColumns = [];
  const itemsPerColumn = Math.ceil(pieData.length / 2);
  
  for (let i = 0; i < pieData.length; i += itemsPerColumn) {
      legendColumns.push(pieData.slice(i, i + itemsPerColumn));
  }

  const columnContainer = legend.append("div")
      .style("display", "flex")
      .style("gap", "20px");

  legendColumns.forEach(column => {
      const columnDiv = columnContainer.append("div");
      
      column.forEach(d => {
          const item = columnDiv.append("div").attr("class", "legend-item");

          item.append("div")
              .attr("class", "legend-color")
              .style("background-color", color(d.type));

          item.append("span")
              .attr("class", "legend-text")
              .style("color", "white") 
              .text(`${d.type}: ${d.percentage}`);
      });
  });
}

function renderSentenceSummary(total) {
  d3.select("#summary")
      .html(`<p style="color: white;">Total inmates analyzed: ${total.toLocaleString()}</p>`); 
}

document.addEventListener("DOMContentLoaded", initSentenceVisualization);
