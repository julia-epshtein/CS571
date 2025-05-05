const sentenceConfig = {
  width: 200,  
    height: 150,
    margin: { top: 20, right: 30, bottom: 60, left: 60 },
    barHeight: 40,
    barPadding: 10,
    colors: {
    'Black': '#cbca75',
    'Latino': '#cbca75',
    'White': '#cbca75',
    'Other': '#cbca75'
    }
};

function initSentenceVisualization() {
  setupSentenceSVG();
  loadSentenceData();
}

function setupSentenceSVG() {
  d3.select("#sentence-bar-chart")
    .append("svg")
    .attr("width", sentenceConfig.width)
    .attr("height", sentenceConfig.height)
    .style("background-color", "black")
    .append("g")
    .attr("transform", `translate(${sentenceConfig.margin.left},${sentenceConfig.margin.top})`)
    .attr("class", "sentence-bar-svg");
}

function loadSentenceData() {
  d3.csv("data/all_years/measures_all_years.csv").then(data => {
    data.forEach(d => d.Year = +d.Year);
    
    const latestYear = d3.max(data, d => d.Year);
    const row = data.find(d => d.Year === latestYear);
    
    const latinoValue = +row["Latino imprisonments per 100,000 Latinos"];
    const blackValue = +row["Black imprisonments per 100,000 African Americans"];
    const whiteValue = +row["White, not Latino, imprisonments per 100,000 whites"];
    const asianValue = +row["Asian/other imprisonments per 100,000 asian/other population"];
    
    const total = latinoValue + blackValue + whiteValue + asianValue;
    
    const barData = [
      { category: "Black", value: blackValue, percentage: ((blackValue / total) * 100).toFixed(1) },
      { category: "Latino", value: latinoValue, percentage: ((latinoValue / total) * 100).toFixed(1) },
      { category: "White", value: whiteValue, percentage: ((whiteValue / total) * 100).toFixed(1) },
      { category: "Other", value: asianValue, percentage: ((asianValue / total) * 100).toFixed(1) }
    ];
    
    renderSentenceVisualization(barData, latestYear);
  }).catch(err => console.error("CSV load error:", err));
}

function renderSentenceVisualization(barData, year) {
  const svg = d3.select(".sentence-bar-svg");
  const width = sentenceConfig.width - sentenceConfig.margin.left - sentenceConfig.margin.right;
  const height = barData.length * (sentenceConfig.barHeight + sentenceConfig.barPadding);
/*
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -35)
    .attr("text-anchor", "middle")
    .attr("class", "chart-title")
    .style("fill", "white")
    .style("font-size", "28px")
    .style("font-weight", "bold")
    .text(`Imprisonment Rate (per 100K)`)
    .style("font-size", "14px");
*/

  const y = d3.scaleBand()
    .domain(barData.map(d => d.category))
    .range([0, height])
    .padding(0.1);
    
  const xMax = d3.max(barData, d => d.value);
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
    .style("font-size", "9px")
    .style("font-weight", "bold")
    .text(d => d.percentage + "%");
  
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

document.addEventListener("DOMContentLoaded", initSentenceVisualization);