const californiaDemographicsConfig = {
    width: 450,
    height: 400,
    margin: 40,
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
    const radius = Math.min(config.width, config.height) / 2 - config.margin;

    d3.select("#california-demographics-pie-chart")
        .append("svg")
        .attr("width", californiaDemographicsConfig.width)
        .attr("height", californiaDemographicsConfig.height)
        .style("background-color", "black")
        .append("g")
        .attr("transform", `translate(${californiaDemographicsConfig.width / 2}, ${californiaDemographicsConfig.height / 2})`)
        .attr("class", "california-demographics-pie-chart-svg");
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
        renderCaliforniaDemographicsLegend(processedData.pieData);
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
    ];

    return {
        pieData: demographicGroups,
        total: total
    };
}

function findCaliforniaData(dataset, populationField) {
    const californiaRecord = dataset.find(d => d.County === 'California');
    return californiaRecord ? +californiaRecord[populationField] : 0;
}

function renderCaliforniaDemographics({ pieData }) {
    const svg = d3.select(".california-demographics-pie-chart-svg");
    const radius = Math.min(californiaDemographicsConfig.width, californiaDemographicsConfig.height) / 2 - californiaDemographicsConfig.margin;

    const pie = d3.pie()
        .value(d => d.count)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip california-demographics-tooltip")
        .style("opacity", 0);

    const arcs = svg.selectAll(".arc")
        .data(pie(pieData))
        .enter()
        .append("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => californiaDemographicsConfig.colors[d.data.group])
        .attr("stroke", "white")
        .style("stroke-width", 2)
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`
                <div style="margin-bottom: 4px; font-weight: 700; color: white;">${d.data.group}</div>
                <div style="color: white;">Count: ${d.data.count.toLocaleString()}</div>
                <div style="color: white;">${d.data.percentage}</div>
            `)
                .style("left", `${event.pageX + 15}px`)
                .style("top", `${event.pageY - 30}px`);
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

function renderCaliforniaDemographicsLegend(pieData) {
    const legend = d3.select("#california-demographics-legend");
    legend.html("");

    pieData.forEach(d => {
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