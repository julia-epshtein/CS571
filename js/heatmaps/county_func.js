console.log("county_func.js loaded");

function setupSharedCountyDropdown(counties) {
  const container = d3.select("#county-checkboxes");
  const selectAllBtn = d3.select("#select-all");
  const clearAllBtn = d3.select("#clear-all");

  // Prevent duplicate entries
  if (!container.select("label").empty()) return;

  // Add checkboxes with improved styling
  counties.forEach(county => {
    container.append("label")
      .attr("class", "county-checkbox")
      .html(`
        <input type="checkbox" value="${county}">
        <span class="checkbox-custom"></span>
        <span class="county-name">${county}</span>
      `);
  });

  // Handle checkbox changes
  container.selectAll("input[type=checkbox]")
    .on("change", () => {
      const selected = container.selectAll("input:checked").nodes().map(n => n.value);
      initRatesHeatmap(selected);
      initCostsHeatmap(selected);
    });

  // Select All
  selectAllBtn.on("click", () => {
    container.selectAll("input[type=checkbox]")
      .property("checked", true);
    const selected = counties;
    initRatesHeatmap(selected);
    initCostsHeatmap(selected);
  });

  // Clear All
  clearAllBtn.on("click", () => {
    container.selectAll("input[type=checkbox]")
      .property("checked", false);
    initRatesHeatmap([]);
    initCostsHeatmap([]);
  });

  // Add search functionality
  const dropdownContainer = d3.select("#county-dropdown-container");
  const searchContainer = dropdownContainer.insert("div", ":first-child")
    .attr("class", "county-search-container");

  searchContainer.append("input")
    .attr("type", "text")
    .attr("placeholder", "Search counties...")
    .attr("class", "county-search")
    .style("width", "100%") // Force search box width
    .style("box-sizing", "border-box")
    .on("input", function() {
      const searchTerm = this.value.toLowerCase();
      container.selectAll("label").each(function() {
        const label = d3.select(this);
        const countyName = label.select(".county-name").text().toLowerCase();
        if (countyName.includes(searchTerm)) {
          label.style("display", "flex");
        } else {
          label.style("display", "none");
        }
      });
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggle-county-filter");
  const dropdown = document.getElementById("county-dropdown-container");

  // Update toggle button to use chevron
  toggleBtn.innerHTML = `Select Counties <span class="chevron">▼</span>`;
  toggleBtn.style.display = "flex";
  toggleBtn.style.justifyContent = "space-between";

  toggleBtn.addEventListener("click", () => {
    dropdown.classList.toggle("hidden");
    const chevron = toggleBtn.querySelector(".chevron");

    if (dropdown.classList.contains("hidden")) {
      chevron.textContent = "▼"; // Down chevron
    } else {
      chevron.textContent = "▲"; // Up chevron
    }
  });

  // Create button container if it doesn't exist
  if (!document.querySelector(".button-container")) {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "button-container";
    buttonContainer.appendChild(document.getElementById("select-all"));
    buttonContainer.appendChild(document.getElementById("clear-all"));

    dropdown.insertBefore(buttonContainer, document.getElementById("county-checkboxes"));
  }
});