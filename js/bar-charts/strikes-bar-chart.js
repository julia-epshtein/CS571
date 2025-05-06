const strikesBarConfig = {
  width: 900,
  height: 500,
  margin: { top: 50, right: 100, bottom: 100, left: 90 },
  colors: ["#265882", "#7c2e71"]
};

function initStrikesVisualization() {
  setupStrikesSVG();
  loadStrikesData();
}

// SVG container
function setupStrikesSVG() {
  
  d3.select("#strikes-bar-chart").html("");
  
  const svg = d3
    .select("#strikes-bar-chart")
    .append("svg")
    .attr("width", strikesBarConfig.width)
    .attr("height", strikesBarConfig.height)
    .style("background-color", "black");  

  svg
    .append("g")
    .attr("class", "strikes-chart-container")
    .attr(
      "transform",
      `translate(${strikesBarConfig.margin.left}, ${strikesBarConfig.margin.top})`
    );
}

// Load and process data
function loadStrikesData() {

  d3.csv("data/preprocessed/sentence_length_distribution.csv")
    .then(data => {
      
      const processedData = data.map(d => ({
        bin: d["Sentence Length Bin"],
        "Second Striker": +d["Second Striker"],
        "Third Striker": +d["Third Striker"]
      }));
      
      renderStrikesChart(processedData);
    })
    .catch((error) => {
      const errorMsg = `Failed to load strikes data: ${error.message}`;
      console.error(errorMsg, error);
      alert(errorMsg);
    });
}

// Render 
function renderStrikesChart(data) {

  const svg = d3.select("#strikes-bar-chart svg .strikes-chart-container");
  if (svg.empty()) {
    console.error("Strikes chart container not found. Check if setupStrikesSVG() ran successfully.");
    return;
  }

  svg.selectAll("*").remove();

  const chartWidth = strikesBarConfig.width - strikesBarConfig.margin.left - strikesBarConfig.margin.right;
  const chartHeight = strikesBarConfig.height - strikesBarConfig.margin.top - strikesBarConfig.margin.bottom;

  // Get bins and strike types
  const bins = data.map(d => d.bin);
  const strikeTypes = ["Second Striker", "Third Striker"];

  // scales
  const x0 = d3
    .scaleBand()
    .domain(bins)
    .range([0, chartWidth])
    .paddingInner(0.1);

  const x1 = d3
    .scaleBand()
    .domain(strikeTypes)
    .range([0, x0.bandwidth()])
    .padding(0.05);

  const maxPercentage = d3.max(data, d => Math.max(d["Second Striker"], d["Third Striker"]));
  const y = d3
    .scaleLinear()
    .domain([0, maxPercentage * 1.1])
    .nice()
    .range([chartHeight, 0]);

  const color = d3
    .scaleOrdinal()
    .domain(strikeTypes)
    .range(strikesBarConfig.colors);

  // axes
  svg
    .append("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(0,10)")
    .style("fill", "white"); 

  svg
    .append("g")
    .attr("class", "axis y-axis")
    .call(d3.axisLeft(y).tickFormat(d => `${d}%`))
    .selectAll("text")
    .style("fill", "white"); 

  svg.selectAll(".domain")
    .style("stroke", "white");  

  // axis labels
  svg
    .append("text")
    .attr("class", "axis-label")
    .attr(
      "transform",
      `translate(${chartWidth / 2}, ${chartHeight + strikesBarConfig.margin.bottom - 20})`
    )
    .style("text-anchor", "middle")
    .style("fill", "white")  
    .text("Sentence Length (months)");

  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - strikesBarConfig.margin.left)
    .attr("x", 0 - chartHeight / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("fill", "white")  
    .text("Percentage of Cases (%)");

  // Tooltip 
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "strikes-tooltip tooltip")
    .style("opacity", 0);

  // bars
  const bars = svg
    .selectAll(".bin-group")
    .data(bins)
    .enter()
    .append("g")
    .attr("class", "bin-group")
    .attr("transform", d => `translate(${x0(d)}, 0)`);

  bars
    .selectAll(".bar")
    .data(d => {
      return strikeTypes.map(strikeType => ({
        strikeType,
        percentage: data.find(item => item.bin === d)[strikeType],
        bin: d
      }));
    })
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x1(d.strikeType))
    .attr("y", d => y(d.percentage))
    .attr("width", x1.bandwidth())
    .attr("height", d => chartHeight - y(d.percentage))
    .attr("fill", d => color(d.strikeType))
    .on("mouseover", function (event, d) {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(`
          <div style="margin-bottom: 4px; font-weight: 700;">${d.strikeType}</div>
          <div>Sentence Length: ${d.bin} months</div>
          <div>Percentage: ${d.percentage.toFixed(1)}%</div>
        `)
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY - 30}px`);
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // legend
  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${chartWidth - 150}, -30)`);

  strikeTypes.forEach((type, i) => {
    const legendItem = legend
      .append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendItem
      .append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(type));

    legendItem
      .append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(type)
      .style("font-size", "12px")
      .style("fill", "white"); 
  });
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing strikes visualization");
  setTimeout(initStrikesVisualization, 100);
});