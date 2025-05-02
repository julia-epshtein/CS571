const californiaDemographicsConfig = {
  width: 600,
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
      renderCaliforniaDemographicsLegend(processedData.barData);
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
      { group: 'White', count: californiaWhite, percentage: (californiaWhite / total * 100).toFixed(1) + '%' },
      { group: 'Hispanic', count: californiaHispanic, percentage: (californiaHispanic / total * 100).toFixed(1) + '%' },
      { group: 'Black', count: californiaBlack, percentage: (californiaBlack / total * 100).toFixed(1) + '%' },
      { group: 'Asian', count: californiaAsian, percentage: (californiaAsian / total * 100).toFixed(1) + '%' },
      { group: 'Other', count: californiaIndian, percentage: (californiaIndian / total * 100).toFixed(1) + '%' }
  ].sort((a, b) => b.count - a.count);

  return {
      barData: demographicGroups,
      total: total
  };
}

function findCaliforniaData(dataset, populationField) {
  const californiaRecord = dataset.find(d => d.County === 'California');
  return californiaRecord ? +californiaRecord[populationField] : 0;
}

function renderCaliforniaDemographics({ barData }) {
  const svg = d3.select(".california-demographics-bar-chart-svg");
  const width = californiaDemographicsConfig.width - californiaDemographicsConfig.margin.left - californiaDemographicsConfig.margin.right;
  const height = californiaDemographicsConfig.height - californiaDemographicsConfig.margin.top - californiaDemographicsConfig.margin.bottom;

  // X axis
  const x = d3.scaleBand()
      .range([0, width])
      .domain(barData.map(d => d.group))
      .padding(0.2);
      
  svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .style("fill", "white");
  
  // Y axis
  const y = d3.scaleLinear()
      .domain([0, d3.max(barData, d => d.count)])
      .range([height, 0]);
      
  svg.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "white");

  const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip california-demographics-tooltip")
      .style("opacity", 0);

  // Bars
  svg.selectAll("bars")
      .data(barData)
      .enter()
      .append("rect")
      .attr("x", d => x(d.group))
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.count))
      .attr("fill", d => californiaDemographicsConfig.colors[d.group])
      .attr("stroke", "white")
      .style("stroke-width", 1)
      .on("mouseover", (event, d) => {
          tooltip.transition()
              .duration(200)
              .style("opacity", 0.9);
          tooltip.html(`
              <div style="margin-bottom: 4px; font-weight: 700; color: white;">${d.group}</div>
              <div style="color: white;">Count: ${d.count.toLocaleString()}</div>
              <div style="color: white;">${d.percentage}</div>
          `)
              .style("left", `${event.pageX + 15}px`)
              .style("top", `${event.pageY - 30}px`);
      })
      .on("mouseout", () => {
          tooltip.transition()
              .duration(500)
              .style("opacity", 0);
      });
      
  // Add percentage labels on top of bars
  svg.selectAll(".label")
      .data(barData)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.group) + x.bandwidth() / 2)
      .attr("y", d => y(d.count) - 5)
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .text(d => d.percentage);
}

function renderCaliforniaDemographicsLegend(barData) {
  const legend = d3.select("#california-demographics-legend");
  legend.html("");

  barData.forEach(d => {
      const item = legend.append("div").attr("class", "legend-item");

      item.append("div")
          .attr("class", "legend-color")
          .style("background-color", californiaDemographicsConfig.colors[d.group]);

      item.append("span")
          .attr("class", "legend-text")
          .style("color", "white")
          .text(`${d.group}: ${d.percentage}`);
  });
}

document.addEventListener("DOMContentLoaded", function() {
  initCaliforniaDemographics();
});