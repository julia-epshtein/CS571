const ratesHeatmapConfig = {
  width: 900, 
  height: 600,
  margin: { top: 70, right: 30, bottom: 30, left: 150 },
  colorScheme: d3.interpolateYlOrRd, 
  title: "Imprisonment Rates Over Time (per 100,000)",
  containerId: "#rates-heatmap-container",
  visibleCounties: 10
};

function initRatesHeatmap() {
  // Load data
  d3.csv("data/all_years/measures_all_years.csv", d3.autoType).then(data => {
    // Process data for heatmap
    const processedData = processHeatmapData(
      data, 
      'County', 
      'Year', 
      'Total adult imprisonments per 100,000/population age 18-69'
    );
    
    // Create the heatmap
    createHeatmap(processedData, ratesHeatmapConfig);
  });
}

function processHeatmapData(data, countyCol, yearCol, valueCol) {
  // Group data by county and year
  const grouped = d3.rollup(
    data,
    v => d3.mean(v, d => d[valueCol]),
    d => d[countyCol],
    d => d[yearCol]
  );

  // Get counties
  const counties = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));
  
  // Get years 
  const years = Array.from(new Set(data.map(d => d[yearCol]))).sort(d3.ascending);

  // matrix for heatmap
  const matrix = counties.map(county => {
    return years.map(year => {
      return grouped.get(county)?.get(year) || 0;
    });
  });

  return {
    counties,
    years,
    matrix,
    title: valueCol.includes('rate') ? 'Rate' : 'Cost'
  };
}

function createHeatmap(heatmapData, config) {
  const container = d3.select(config.containerId)
    .html('');
  
  // title
  container.append("div")
    .attr("class", "heatmap-title")
    .text(config.title);
  
  // Create x scale for year labels
  const x = d3.scaleBand()
    .range([0, config.width - config.margin.left - config.margin.right])
    .domain(heatmapData.years)
    .padding(0.05);
    
  // Scrollable container for heatmap
  const scrollContainer = container
    .append("div")
    .attr("class", "scrollable-heatmap");
  
  // SVG
  const svg = scrollContainer
    .append("svg")
    .attr("width", config.width)
    .attr("height", config.height)
    .append("g")
    .attr("transform", `translate(${config.margin.left},${config.margin.top})`);

  // color scale
  const maxValue = d3.max(heatmapData.matrix.flat());
  const colorScale = d3.scaleSequential(config.colorScheme)
    .domain([0, maxValue]);

  const cellHeight = 30; 
  const totalHeight = cellHeight * heatmapData.counties.length;
  
  // y scale with fixed cell height
  const y = d3.scaleBand()
    .range([0, totalHeight])
    .domain(heatmapData.counties)
    .padding(0.05);

  // tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "heatmap-tooltip")
    .style("opacity", 0);

  // squares
  svg.selectAll()
    .data(heatmapData.matrix.flatMap((row, i) => row.map((value, j) => ({ 
      county: heatmapData.counties[i], 
      year: heatmapData.years[j], 
      value 
    }))))
    .enter()
    .append("rect")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.county))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .style("fill", d => d.value ? colorScale(d.value) : "#ddd")
    .style("stroke", "white")
    .style("stroke-width", 0.1)
    .on("mouseover", function(event, d) {
      d3.select(this).style("stroke-width", 2).style("stroke", "#fff");
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(`
        <strong>${d.county}</strong>
        <span>Year: ${d.year}</span>
        <span>Value: ${d.value ? d.value.toFixed(1) : 'No data'}</span>
      `)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).style("stroke-width", 0.1);
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });

  // Add value text inside each cell
  svg.selectAll(".cell-value")
    .data(heatmapData.matrix.flatMap((row, i) => row.map((value, j) => ({ 
      county: heatmapData.counties[i], 
      year: heatmapData.years[j], 
      value 
    }))))
    .enter()
    .append("text")
    .attr("class", "cell-value")
    .attr("x", d => x(d.year) + x.bandwidth() / 2)
    .attr("y", d => y(d.county) + y.bandwidth() / 2 + 5)
    .attr("text-anchor", "middle")
    .style("fill", d => d.value > maxValue / 2 ? "white" : "black")
    .style("font-size", "10px")
    .style("pointer-events", "none")
    .text(d => d.value ? d.value.toFixed(1) : "");

  // y-axis (County labels)
  svg.append("g")
    .attr("class", "heatmap-axis")
    .call(d3.axisLeft(y).tickSize(0))
    .selectAll("text")
    .style("text-anchor", "end")
    .style("fill", "white")
    .style("font-size", "14px");  

  // legend
  const legendContainer = container
    .append("div")
    .attr("class", "legend-container")
    .style("margin-top", "30px"); 
  
  const legendSvg = legendContainer
    .append("svg")
    .attr("width", 300) 
    .attr("height", 60); 
  
  const legend = legendSvg.append("g")
    .attr("transform", "translate(0, 20)");
  
  const legendWidth = 280;
  const legendHeight = 25; 
  
  // gradient for legend
  const defs = legendSvg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "rate-gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

  linearGradient.selectAll("stop")
    .data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#rate-gradient)");

  // labels 
  legend.append("text")
    .attr("x", 0)
    .attr("y", -5)
    .style("fill", "white")
    .style("font-size", "14px")
    .text("0");

  legend.append("text")
    .attr("x", legendWidth)
    .attr("y", -5)
    .style("text-anchor", "end")
    .style("fill", "white")
    .style("font-size", "14px")
    .text(maxValue.toFixed(0));
  
  // Update SVG height to accommodate the total counties
  svg.attr("height", totalHeight + config.margin.top + config.margin.bottom);
  scrollContainer.select("svg").attr("height", totalHeight + config.margin.top + config.margin.bottom);
}

document.addEventListener('DOMContentLoaded', initRatesHeatmap);