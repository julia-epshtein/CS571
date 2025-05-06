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
  barWidth: 220, 
  maxBarLength: 220 
};

function initCaliforniaDemographics() {
  setupCaliforniaDemographicsSVG();
  loadCaliforniaDemographicData();
}

function setupCaliforniaDemographicsSVG() {
  d3.select("#california-demographics-bar-chart")
    .append("svg")
    .attr("width", californiaDemographicsConfig.width)
    .attr("height", californiaDemographicsConfig.height)
    .style("background-color", "black")
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
  const californiaWhite = findCaliforniaData(whiteData, 'People (White)');
  const californiaHispanic = findCaliforniaData(hispanicData, 'People (Hispanic)');
  const californiaBlack = findCaliforniaData(blackData, 'People (Black)');
  const californiaAsian = findCaliforniaData(asianData, 'People (API)');
  const californiaIndian = findCaliforniaData(american_indianData, 'People (AI/AN)');
  
  const total = californiaWhite + californiaHispanic + californiaBlack + californiaAsian + californiaIndian;
  
  const demographicGroups = [
    { group: 'Black', count: californiaBlack, percentage: (californiaBlack / total * 100).toFixed(1) },
    { group: 'Latino', count: californiaHispanic, percentage: (californiaHispanic / total * 100).toFixed(1) },
    { group: 'White', count: californiaWhite, percentage: (californiaWhite / total * 100).toFixed(1) },
    { group: 'Other', count: californiaAsian + californiaIndian, percentage: ((californiaAsian + californiaIndian) / total * 100).toFixed(1) }
  ];
  
  return {
    barData: demographicGroups,
    total: total
  };
}

function findCaliforniaData(dataset, populationField) {
  const californiaRecord = dataset.find(d => d.County === 'California');
  return californiaRecord ? +californiaRecord[populationField] : 0;
}

function renderCaliforniaDemographics({ barData, total }) {
  const svg = d3.select(".california-demographics-bar-chart-svg");
  const width = californiaDemographicsConfig.width - californiaDemographicsConfig.margin.left - californiaDemographicsConfig.margin.right;
  const height = barData.length * (californiaDemographicsConfig.barHeight + californiaDemographicsConfig.barPadding);

  const y = d3.scaleBand()
    .domain(barData.map(d => d.group))
    .range([0, height])
    .padding(0.3);
    
  const barWidth = californiaDemographicsConfig.barWidth;

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
      return (parseFloat(d.percentage) / maxPercentage) * californiaDemographicsConfig.maxBarLength;
    })
    .attr("fill", d => californiaDemographicsConfig.colors[d.group])
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
      return 55; 
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