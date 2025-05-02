// sentence-bar-chart.js (modified to match inmate ethnicity chart style)

// Configuration
const sentenceConfig = {
  width: 800,
  height: 500,
  margin: { top: 80, right: 100, bottom: 150, left: 120 },
  barHeight: 50,
  barPadding: 30,
  colors: {
    'Black': '#cbca75',    
    'Latino': '#cbca75',    
    'White': '#cbca75',     
    'Asian / Other': '#cbca75'    
  }
};

// Initialization
function initSentenceVisualization() {
  setupSentenceSVG();
  loadSentenceData();
}

function setupSentenceSVG() {
  d3.select("#sentence-bar-chart")
    .append("svg")
    .attr("width", sentenceConfig.width)
    .attr("height", sentenceConfig.height)
    .style("background-color", "black") // Black background like the example
    .append("g")
    .attr("transform", `translate(${sentenceConfig.margin.left},${sentenceConfig.margin.top})`)
    .attr("class", "sentence-bar-svg");
}

// Load & process CSV
function loadSentenceData() {
  d3.csv("data/all_years/measures_all_years.csv").then(data => {
    // parse numeric Year
    data.forEach(d => d.Year = +d.Year);
    
    // pick the most recent year
    const latestYear = d3.max(data, d => d.Year);
    const row = data.find(d => d.Year === latestYear);
    
    // Extract values
    const latinoValue = +row["Latino imprisonments per 100,000 Latinos"];
    const blackValue = +row["Black imprisonments per 100,000 African Americans"];
    const whiteValue = +row["White, not Latino, imprisonments per 100,000 whites"];
    const asianValue = +row["Asian/other imprisonments per 100,000 asian/other population"];
    
    // Calculate total for percentages
    const total = latinoValue + blackValue + whiteValue + asianValue;
    
    // build the four‐bar dataset
    const barData = [
      {
        category: "Latino",
        value: latinoValue,
        percentage: ((latinoValue / total) * 100).toFixed(1)
      },
      {
        category: "Black",
        value: blackValue,
        percentage: ((blackValue / total) * 100).toFixed(1)
      },
      {
        category: "White",
        value: whiteValue,
        percentage: ((whiteValue / total) * 100).toFixed(1)
      },
      {
        category: "Asian / Other",
        value: asianValue,
        percentage: ((asianValue / total) * 100).toFixed(1)
      }
    ].sort((a, b) => b.value - a.value); // Sort by value descending
    
    renderSentenceVisualization(barData, latestYear);
    renderSentenceLegend(barData);
  })
  .catch(err => console.error("CSV load error:", err));
}

// Render the bars - HORIZONTAL orientation
function renderSentenceVisualization(barData, year) {
  const svg = d3.select(".sentence-bar-svg");
  const width = sentenceConfig.width - sentenceConfig.margin.left - sentenceConfig.margin.right;
  const height = barData.length * (sentenceConfig.barHeight + sentenceConfig.barPadding);

  // Title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .attr("class", "chart-title")
    .style("fill", "white")
    .style("font-size", "28px")
    .style("font-weight", "bold")
    .text(`Imprisonment Rate (per 100K)`);

  // Y scale for categories (horizontal axis labels)
  const y = d3.scaleBand()
    .domain(barData.map(d => d.category))
    .range([0, height])
    .padding(0.1);
    
  // X scale for values (horizontal bar lengths)
  const xMax = d3.max(barData, d => d.value);
  const x = d3.scaleLinear()
    .domain([0, xMax * 1.1]) // Add 10% padding
    .range([0, width]);

  // Add y-axis (categories on left)
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
    .attr("y", d => y(d.category))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", d => x(d.value))
    .attr("fill", d => sentenceConfig.colors[d.category])
    .on("mouseover", function(event, d) {
      d3.select(this).style("opacity", 0.8);
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.9);
      tooltip.html(`
        <div style="font-weight: bold; margin-bottom: 5px;">${d.category}</div>
        <div>Rate: ${Math.round(d.value).toLocaleString()} per 100,000</div>
        <div>Percentage: ${d.percentage}%</div>
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
    .attr("x", d => Math.min(x(d.value) / 2, 50))
    .attr("y", d => y(d.category) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(d => d.percentage + "%");
  
  // Add value labels on the right end of bars
  svg.selectAll(".count-label")
    .data(barData)
    .enter()
    .append("text")
    .attr("class", "count-label")
    .attr("x", d => x(d.value) + 10)
    .attr("y", d => y(d.category) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .style("fill", "white")
    .style("font-size", "14px")
    .text(d => Math.round(d.value).toLocaleString());
}

// Render legend
function renderSentenceLegend(barData) {
  const svg = d3.select("#sentence-bar-chart svg");
  const legendY = sentenceConfig.height - 60;
  
  // Create legend group
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${sentenceConfig.margin.left}, ${legendY})`);
  
  const legendWidth = sentenceConfig.width - sentenceConfig.margin.left - sentenceConfig.margin.right;
  const legendItemWidth = legendWidth / barData.length;
  
  // Add legend items
  barData.forEach((d, i) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(${i * legendItemWidth}, 0)`);
    
    // Add color square
    legendItem.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", sentenceConfig.colors[d.category]);
    
    // Add text
    legendItem.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .style("fill", "white")
      .style("font-size", "14px")
      .text(`${d.category}: ${d.percentage}%`);
  });
}

// Start once DOM is ready
document.addEventListener("DOMContentLoaded", initSentenceVisualization);