// Configuration
const sentenceConfig = {
    width: 600,
    height: 400,
    margin: { top: 30, right: 30, bottom: 100, left: 60 },
    colors: ["#f2f0f7","#dadaeb","#bcbddc","#9e9ac8","#756bb1","#54278f"].reverse()
  };
  
  // Initialization
  function initSentenceVisualization() {
    setupSentenceSVG();
    loadSentenceData();
  }
  
  // SVG container
  function setupSentenceSVG() {
    d3.select("#sentence-bar-chart")
        .append("svg")
        .attr("width", sentenceConfig.width)
        .attr("height", sentenceConfig.height)
        .style("background-color", "black") 
        .append("g")
        .attr("transform", `translate(${sentenceConfig.margin.left}, ${sentenceConfig.margin.top})`)
        .attr("class", "sentence-bar-svg");
  }
  
  // Load and process data
  function loadSentenceData() {
    d3.csv("data/demographics.csv").then(data => {
        const processedData = processSentenceData(data);
        renderSentenceVisualization(processedData);
        renderSentenceLegend(processedData.barData);
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
    const barData = Array.from(sentenceCounts, ([type, count]) => ({
        type: type,
        count,
        percentage: (count / data.length * 100).toFixed(1) + '%'
    }))
    .filter(d => d.count > 0 && d.type !== 'Other')  
    .sort((a, b) => b.count - a.count);
  
    return {
        barData,
        total: data.length
    };
  }
  
  // Render 
  function renderSentenceVisualization({ barData }) {
    const svg = d3.select(".sentence-bar-svg");
    const width = sentenceConfig.width - sentenceConfig.margin.left - sentenceConfig.margin.right;
    const height = sentenceConfig.height - sentenceConfig.margin.top - sentenceConfig.margin.bottom;
  
    const color = d3.scaleOrdinal()
        .domain(barData.map(d => d.type))
        .range(sentenceConfig.colors);
  
    // X axis
    const x = d3.scaleBand()
        .range([0, width])
        .domain(barData.map(d => d.type))
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
  
    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("color", "white"); 
  
    // Bars
    svg.selectAll("bars")
        .data(barData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.type))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", d => color(d.type))
        .attr("stroke", "white")
        .style("stroke-width", 1)
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`
                <div style="margin-bottom: 4px; font-weight: 700; color: white;">${d.type}</div>
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
        .attr("x", d => x(d.type) + x.bandwidth() / 2)
        .attr("y", d => y(d.count) - 5)
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .text(d => d.percentage);
  }
  
  // legend
  function renderSentenceLegend(barData) {
    const color = d3.scaleOrdinal()
        .domain(barData.map(d => d.type))
        .range(sentenceConfig.colors);
  
    const legend = d3.select("#sentence-legend");
    legend.html("");  
  
    const legendColumns = [];
    const itemsPerColumn = Math.ceil(barData.length / 2);
    
    for (let i = 0; i < barData.length; i += itemsPerColumn) {
        legendColumns.push(barData.slice(i, i + itemsPerColumn));
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