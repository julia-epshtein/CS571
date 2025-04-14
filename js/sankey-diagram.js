const sankeyConfig = {
  width: 900,
  height: 500,
  margin: { top: 50, right: 50, bottom: 50, left: 50 }
};

function initSankeyPlaceholder() {
  console.log("Initializing Sankey diagram placeholder");
  setupSankeyPlaceholder();
}

function setupSankeyPlaceholder() {
const container = d3.select("#sankey-diagram");
container.selectAll("*").remove();

const placeholder = container
.append("div")
.style("width", "900px")
.style("height", "500px")
.style("margin", "0 auto")
.style("border", "2px dashed #a0aec0")
.style("border-radius", "10px")
style("display", "flex")
.style("flex-direction", "column")
.style("justify-content", "center")
.style("align-items", "center")
.style("background-color", "#f7fafc");
  

  placeholder
    .append("div")
    .style("font-size", "48px")
    .style("color", "#a0aec0")
    .style("margin-bottom", "20px")
    .html("&#10005;"); 
  
  placeholder
    .append("div")
    .style("font-family", "'Roboto', sans-serif")
    .style("font-size", "24px")
    .style("color", "#4a5568")
    .style("font-weight", "500")
    .style("text-align", "center")
    .text("Sankey Diagram Goes Here");
    
  console.log("Sankey diagram placeholder created successfully");
}


document.addEventListener("DOMContentLoaded", function() {
  initSankeyPlaceholder();
});