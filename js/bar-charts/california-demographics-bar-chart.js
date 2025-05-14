const californiaDemographicsConfig = {
  width: 400,
  height: 300,
  margin: { top: 10, right: 60, bottom: 20, left: 80 },
  barHeight: 30,
  barPadding: 15,
  colors: {
    'Black': '#1f3c70',
    'Latino': '#1f3c70',
    'White': '#1f3c70',
    'Other': '#1f3c70'
  },
  barWidth: 240, 
  maxBarLength: 240
};

function initCaliforniaDemographics() {
  setupCaliforniaDemographicsSVG();
  loadCaliforniaDemographicData();
}

function setupCaliforniaDemographicsSVG() {
  d3.select("#california-demographics-bar-chart").select("svg").remove();
  d3.select("#california-demographics-bar-chart")
    .append("svg")
    .attr("width", californiaDemographicsConfig.width)
    .attr("height", californiaDemographicsConfig.height)
    .append("g")
    .attr("transform", `translate(${californiaDemographicsConfig.margin.left}, ${californiaDemographicsConfig.margin.top})`)
    .attr("class", "california-demographics-bar-chart-svg");
}

function loadCaliforniaDemographicData() {
  Promise.all([
    d3.csv("data/minority-map_dataset/white.csv", d3.autoType),
    d3.csv("data/minority-map_dataset/hispanic.csv", d3.autoType),
    d3.csv("data/minority-map_dataset/black.csv", d3.autoType),
    d3.csv("data/minority-map_dataset/asian.csv", d3.autoType),
    d3.csv("data/minority-map_dataset/indian.csv", d3.autoType)
  ]).then(([whiteData, hispanicData, blackData, asianData, american_indianData]) => {
    const processedData = processCaliforniaDemographicData(whiteData, hispanicData, blackData, asianData, american_indianData);
    renderCaliforniaDemographics(processedData);
  }).catch(error => {
    console.error("Error loading California demographic data:", error);
  });
}

function processCaliforniaDemographicData(whiteData, hispanicData, blackData, asianData, american_indianData) {
  const californiaRecordWhite = whiteData.find(d => d.County === 'California');
  const californiaWhite = californiaRecordWhite ? +californiaRecordWhite['People (White)'] : 0;

  const californiaRecordHispanic = hispanicData.find(d => d.County === 'California');
  const californiaHispanic = californiaRecordHispanic ? +californiaRecordHispanic['People (Hispanic)'] : 0;

  const californiaRecordBlack = blackData.find(d => d.County === 'California');
  const californiaBlack = californiaRecordBlack ? +californiaRecordBlack['People (Black)'] : 0;

  const californiaRecordAsian = asianData.find(d => d.County === 'California');
  const californiaAsian = californiaRecordAsian ? +californiaRecordAsian['People (API)'] : 0;

  const californiaRecordIndian = american_indianData.find(d => d.County === 'California');
  const californiaIndian = californiaRecordIndian ? +californiaRecordIndian['People (AI/AN)'] : 0;

  const total = californiaWhite + californiaHispanic + californiaBlack + californiaAsian + californiaIndian;

  const demographicGroups = [
    { group: 'Black', count: californiaBlack, percentage: (californiaBlack / total * 100).toFixed(1) },
    { group: 'Latino', count: californiaHispanic, percentage: (californiaHispanic / total * 100).toFixed(1) },
    { group: 'White', count: californiaWhite, percentage: (californiaWhite / total * 100).toFixed(1) },
    { group: 'Other', count: californiaAsian + californiaIndian, percentage: ((californiaAsian + californiaIndian) / total * 100).toFixed(1) }
  ];

  // Sort data by percentage for consistent display 
  demographicGroups.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));

  return {
    barData: demographicGroups,
    total: total
  };
}

function renderCaliforniaDemographics({ barData, total }) {
  const svg = d3.select(".california-demographics-bar-chart-svg");
  const width = californiaDemographicsConfig.width - californiaDemographicsConfig.margin.left - californiaDemographicsConfig.margin.right;
  const height = barData.length * (californiaDemographicsConfig.barHeight + californiaDemographicsConfig.barPadding);

  // Update SVG height in case data changes
  d3.select("#california-demographics-bar-chart").attr("height", height + californiaDemographicsConfig.margin.top + californiaDemographicsConfig.margin.bottom);
  svg.attr("height", height); 

  const y = d3.scaleBand()
    .domain(barData.map(d => d.group))
    .range([0, height])
    .padding(0.1);

  const maxBarLength = californiaDemographicsConfig.maxBarLength; 

  // Background bars representing 100%
  svg.selectAll(".bar-background")
    .data(barData)
    .join("rect")
    .attr("class", "bar-background")
    .attr("y", d => y(d.group))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", maxBarLength) 
    .attr("fill", "#fcfcfc")
    .attr("opacity", 0.08);

  // Category labels
  svg.selectAll(".category-labels")
    .data([barData])
    .join("g")
    .attr("class", "category-labels")
    .selectAll("text")
    .data(barData)
    .join("text") 
    .attr("x", -10)
    .attr("y", d => y(d.group) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .style("fill", "white")
    .style("font-size", "14px")
    .text(d => d.group);

  // Remove default axes
  svg.selectAll(".domain").style("stroke", "none");
  svg.selectAll(".tick line").style("stroke", "none");
  svg.selectAll(".tick text").style("display", "none");

  // Select or create tooltip div
  let tooltip = d3.select("body").select(".tooltip");
  if (tooltip.empty()) {
      tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "#111")
        .style("border", "1px solid #333")
        // .style("border-radius", "5px")
        .style("padding", "10px")
        .style("color", "white")
        .style("font-size", "14px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 10);
  }


  // Data bars
  svg.selectAll(".bar")
    .data(barData)
    .join("rect") 
    .attr("class", "bar")
    .attr("y", d => y(d.group))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", d => (parseFloat(d.percentage) / 100) * maxBarLength)
    .attr("fill", d => californiaDemographicsConfig.colors[d.group] || '#cccccc') 
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

  // Percentage labels
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
document.addEventListener("DOMContentLoaded", initCaliforniaDemographics);
