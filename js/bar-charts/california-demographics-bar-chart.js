// js/california-demographics-bar-chart.js

const calDemBarConfig = {
    width: 450,
    height: 400,
    margin: { top: 30, right: 30, bottom: 70, left: 60 },
    colors: {
      'White':    '#FFF1C9',
      'Black':    '#2b0b3f',
      'Hispanic': '#57167e',
      'Asian':    '#f7b7a3',
      'Other':    '#ea5f89'
    }
  };
  
  function initCaliforniaDemographicsBarChart() {
    // clear old in case of hot reload
    d3.select("#california-demographics-bar-chart").html("");
    d3.select("#california-demographics-legend").html("");
    setupCalDemBarSVG();
    loadCaliforniaDemographicData();
  }
  
  function setupCalDemBarSVG() {
    d3.select("#california-demographics-bar-chart")
      .append("svg")
        .attr("width", calDemBarConfig.width)
        .attr("height", calDemBarConfig.height)
      .append("g")
        .attr("transform", `translate(${calDemBarConfig.margin.left},${calDemBarConfig.margin.top})`)
        .attr("class", "california-demographics-bar-chart-svg");
  }
  
  function loadCaliforniaDemographicData() {
    Promise.all([
      d3.csv("data/minority-map_dataset/white.csv",    d3.autoType),
      d3.csv("data/minority-map_dataset/hispanic.csv", d3.autoType),
      d3.csv("data/minority-map_dataset/black.csv",    d3.autoType),
      d3.csv("data/minority-map_dataset/asian.csv",    d3.autoType),
      d3.csv("data/minority-map_dataset/indian.csv",   d3.autoType)
    ]).then(([whiteData, hispanicData, blackData, asianData, indianData]) => {
      const { chartData } = processCaliforniaDemographicData(
        whiteData, hispanicData, blackData, asianData, indianData
      );
      renderCaliforniaDemographicsBarChart(chartData);
      renderCaliforniaDemographicsLegend(chartData);
    }).catch(err => console.error(err));
  }
  
  function processCaliforniaDemographicData(white, hisp, blk, asia, ai) {
    const findCA = (ds, field) => +(ds.find(d => d.County === 'California')?.[field] || 0);
    const w = findCA(white,  'People (White)');
    const h = findCA(hisp,   'People (Hispanic)');
    const b = findCA(blk,    'People (Black)');
    const a = findCA(asia,   'People (API)');
    const o = findCA(ai,     'People (AI/AN)');
    const total = w + h + b + a + o;
    return {
      chartData: [
        { group:'White',    count:w, pct:w/total*100 },
        { group:'Hispanic', count:h, pct:h/total*100 },
        { group:'Black',    count:b, pct:b/total*100 },
        { group:'Asian',    count:a, pct:a/total*100 },
        { group:'Other',    count:o, pct:o/total*100 }
      ].sort((x,y)=>y.count-x.count),
      total
    };
  }
  
  function renderCaliforniaDemographicsBarChart(data) {
    const svg = d3.select(".california-demographics-bar-chart-svg");
    const width  = calDemBarConfig.width  - calDemBarConfig.margin.left - calDemBarConfig.margin.right;
    const height = calDemBarConfig.height - calDemBarConfig.margin.top  - calDemBarConfig.margin.bottom;
  
    const x = d3.scaleBand()
        .domain(data.map(d => d.group))
        .range([0, width])
        .padding(0.3);
  
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.pct)])
        .nice()
        .range([height, 0]);
  
    // axes
    svg.append("g")
       .attr("transform", `translate(0,${height})`)
       .call(d3.axisBottom(x).tickSize(0))
       .selectAll("text")
         .attr("transform","translate(-10,0)rotate(-45)")
         .style("text-anchor","end")
         .style("fill","white");
  
    svg.append("g")
       .call(d3.axisLeft(y).ticks(5).tickFormat(d=>d.toFixed(0)+"%"))
       .selectAll("text")
         .style("fill","white");
  
    // bars
    svg.selectAll(".bar")
       .data(data)
       .enter().append("rect")
         .attr("class","bar")
         .attr("x", d=>x(d.group))
         .attr("y", d=>y(d.pct))
         .attr("width", x.bandwidth())
         .attr("height", d=>height - y(d.pct))
         .attr("fill", d=>calDemBarConfig.colors[d.group]);
  
    // labels
    svg.selectAll(".label")
       .data(data)
       .enter().append("text")
         .attr("class","label")
         .attr("x", d=>x(d.group) + x.bandwidth()/2)
         .attr("y", d=>y(d.pct) - 5)
         .attr("text-anchor","middle")
         .style("fill","white")
         .style("font-size","12px")
         .text(d=>d.pct.toFixed(1) + "%");
  }
  
  function renderCaliforniaDemographicsLegend(data) {
    const legend = d3.select("#california-demographics-legend");
    data.forEach(d => {
      const item = legend.append("div").attr("class","legend-item");
      item.append("div")
          .attr("class","legend-color")
          .style("background-color", calDemBarConfig.colors[d.group]);
      item.append("span")
          .attr("class","legend-text")
          .style("color","white")
          .text(`${d.group}: ${d.pct.toFixed(1)}%`);
    });
  }
  
  document.addEventListener("DOMContentLoaded", initCaliforniaDemographicsBarChart);
  