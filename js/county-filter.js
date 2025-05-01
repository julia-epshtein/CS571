document.addEventListener('DOMContentLoaded', function() {
    // Load data
    d3.csv("data/all_years/measures_all_years.csv", d3.autoType).then(data => {
        // Get counties
        const counties = Array.from(new Set(data.map(d => d.County))).sort((a, b) => a.localeCompare(b));
        
        // dropdown container
        const filterContainer = d3.select(".dashboard")
            .insert("div", ":first-child")
            .attr("class", "county-filter-container")
            .style("margin-bottom", "20px");
        
        // dropdown label
        filterContainer.append("label")
            .attr("for", "county-select")
            .style("color", "white")
            .style("margin-right", "10px")
            .text("Filter by County:");
        
        // dropdown select
        const select = filterContainer.append("select")
            .attr("id", "county-select")
            .style("padding", "5px 10px")
            .style("border-radius", "4px")
            .style("background", "#333")
            .style("color", "white")
            .style("border", "1px solid #c89f65");
        
        // Add default "All Counties" option
        select.append("option")
            .attr("value", "all")
            .text("All Counties");
        
        // Add county options
        select.selectAll("county-option")
            .data(counties)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);
        
        // Add event listener
        select.on("change", function() {
            const selectedCounty = this.value;
            filterHeatmaps(selectedCounty);
        });
        
        // Store the original data for filtering
        window.heatmapData = data;
    });
});

function filterHeatmaps(county) {
    if (county === "all") {
        // Show all counties
        d3.selectAll(".scrollable-heatmap svg g .county-row").style("display", null);
    } else {
        // Hide all counties except the selected one
        d3.selectAll(".scrollable-heatmap svg g .county-row").style("display", "none");
        d3.selectAll(`.scrollable-heatmap svg g .county-row-${county.replace(/\s+/g, '-')}`).style("display", null);
    }
}