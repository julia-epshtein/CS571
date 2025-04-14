// Configuration
const barConfig = {
  width: 900,
  height: 500,
  margin: { top: 50, right: 50, bottom: 100, left: 60 },
  colors: ["#6baed6", "#54278f"]
};

// Initialization
function initVisualization() {
  console.log("Starting initialization of visualization");
  setupSVG();
  loadData();
}

// SVG container
function setupSVG() {
  console.log("Setting up SVG container");
  const svg = d3
    .select("#bar-chart")
    .append("svg")
    .attr("width", barConfig.width)
    .attr("height", barConfig.height)
    .style("background-color", "black");  

  console.log("SVG container created successfully");

  svg
    .append("g")
    .attr("class", "chart-container")
    .attr(
      "transform",
      `translate(${barConfig.margin.left}, ${barConfig.margin.top})`
    );
}

// Load and process data
function loadData() {
  console.log("Starting data loading");

  d3.csv("data/preprocessed/sentence_length_distribution.csv")
    .then(data => {
      console.log("Data loaded successfully", data);
      
      const processedData = data.map(d => ({
        bin: d["Sentence Length Bin"],
        "Second Striker": +d["Second Striker"],
        "Third Striker": +d["Third Striker"]
      }));
      
      renderChart(processedData);
    })
    .catch((error) => {
      const errorMsg = `Failed to load data: ${error.message}`;
      console.error(errorMsg, error);
      alert(errorMsg);
    });
}

// Render 
function renderChart(data) {
  console.log("Starting chart rendering with", data.length, "data points");

  const svg = d3.select("#bar-chart svg .chart-container");
  if (svg.empty()) {
    console.error("Chart container not found. Check if setupSVG() ran successfully.");
    return;
  }

  svg.selectAll("*").remove();

  const chartWidth = barConfig.width - barConfig.margin.left - barConfig.margin.right;
  const chartHeight = barConfig.height - barConfig.margin.top - barConfig.margin.bottom;

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
    .range(barConfig.colors);

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
      `translate(${chartWidth / 2}, ${chartHeight + barConfig.margin.bottom - 20})`
    )
    .style("text-anchor", "middle")
    .style("fill", "white")  
    .text("Sentence Length (months)");

  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - barConfig.margin.left)
    .attr("x", 0 - chartHeight / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("fill", "white")  
    .text("Percentage of Cases (%)");

  // Tooltip 
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
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

  console.log("Chart rendering completed successfully");
}

document.addEventListener("DOMContentLoaded", function () {
  initVisualization();
});
