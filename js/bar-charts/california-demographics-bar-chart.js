const californiaDemographicsConfig = {
    width: 800,
    height: 500,
    margin: { top: 80, right: 100, bottom: 150, left: 120 },
    barHeight: 50,
    barPadding: 30,
    colors: {
      'White': '#293a54',
      'Hispanic': '#293a54',
      'Black': '#293a54',
      'Asian': '#293a54',
      'Other': '#293a54'
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
      .style("background-color", "black") // Black background
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
      { group: 'Hispanic', count: californiaHispanic, percentage: (californiaHispanic / total * 100).toFixed(1) },
      { group: 'White', count: californiaWhite, percentage: (californiaWhite / total * 100).toFixed(1) },
      { group: 'Black', count: californiaBlack, percentage: (californiaBlack / total * 100).toFixed(1) },
      { group: 'Asian', count: californiaAsian, percentage: (californiaAsian / total * 100).toFixed(1) },
      { group: 'Other', count: californiaIndian, percentage: (californiaIndian / total * 100).toFixed(1) }
    ].sort((a, b) => b.count - a.count); // Sort by count descending
  
    return {
      barData: demographicGroups,
      total: total
    };
  }
  
  function findCaliforniaData(dataset, populationField) {
    const californiaRecord = dataset.find(d => d.County === 'California');
    return californiaRecord ? +californiaRecord[populationField] : 0;
  }
  
  // Render visualization - HORIZONTAL bar chart (like the inmate chart)
  function renderCaliforniaDemographics({ barData, total }) {
    const svg = d3.select(".california-demographics-bar-chart-svg");
    const width = californiaDemographicsConfig.width - californiaDemographicsConfig.margin.left - californiaDemographicsConfig.margin.right;
    const height = barData.length * (californiaDemographicsConfig.barHeight + californiaDemographicsConfig.barPadding);
  
    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("class", "chart-title")
      .style("fill", "white")
      .style("font-size", "28px")
      .style("font-weight", "bold")
      .text("Percent of the State Population");
  
    // Y scale for groups (horizontal axis labels)
    const y = d3.scaleBand()
      .domain(barData.map(d => d.group))
      .range([0, height])
      .padding(0.1);
      
    // X scale for values (horizontal bar lengths)
    const xMax = d3.max(barData, d => d.count);
    const x = d3.scaleLinear()
      .domain([0, xMax * 1.1]) // Add 10% padding
      .range([0, width]);
  
    // Add y-axis (groups on left)
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
      .attr("y", d => y(d.group))
      .attr("x", 0)
      .attr("height", y.bandwidth())
      .attr("width", d => x(d.count))
      .attr("fill", d => californiaDemographicsConfig.colors[d.group])
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
  
    // Add percentage labels inside bars
    svg.selectAll(".percent-label")
      .data(barData)
      .enter()
      .append("text")
      .attr("class", "percent-label")
      .attr("x", d => Math.min(x(d.count) / 2, 50))
      .attr("y", d => y(d.group) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(d => d.percentage + "%");
    
    // Add count labels on the right end of bars
    svg.selectAll(".count-label")
      .data(barData)
      .enter()
      .append("text")
      .attr("class", "count-label")
      .attr("x", d => x(d.count) + 10)
      .attr("y", d => y(d.group) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("fill", "white")
      .style("font-size", "14px")
      .text(d => d.count.toLocaleString());
  }
  
  // Render legend
  function renderCaliforniaDemographicsLegend({ barData }) {
    const svg = d3.select("svg");
    const legendY = californiaDemographicsConfig.height - 60;
    
    // Create legend group
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${californiaDemographicsConfig.margin.left}, ${legendY})`);
    
    const legendWidth = californiaDemographicsConfig.width - californiaDemographicsConfig.margin.left - californiaDemographicsConfig.margin.right;
    const legendItemWidth = legendWidth / barData.length;
    
    // Add legend items
    barData.forEach((d, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(${i * legendItemWidth}, 0)`);
      
      // Add color square
      legendItem.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", californiaDemographicsConfig.colors[d.group]);
      
      // Add text
      legendItem.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .style("fill", "white")
        .style("font-size", "14px")
        .text(`${d.group}: ${d.percentage}%`);
    });
  }
  
  document.addEventListener("DOMContentLoaded", initCaliforniaDemographics);