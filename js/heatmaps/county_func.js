console.log("county_func.js loaded");

function setupSharedCountyDropdown(counties) {
  const container = d3.select("#county-checkboxes");
  const selectAllBtn = d3.select("#select-all");
  const clearAllBtn = d3.select("#clear-all");

  // Prevent duplicate entries
  if (!container.select("label").empty()) return;

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

  // Update toggle button to use SVG chevron
  toggleBtn.innerHTML = `Select Counties <span class="chevron-icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
    </svg>
  </span>`;
  
  toggleBtn.style.display = "flex";
  toggleBtn.style.justifyContent = "space-between";

  toggleBtn.addEventListener("click", () => {
    dropdown.classList.toggle("hidden");
    const chevronIcon = toggleBtn.querySelector(".chevron-icon");
    
    if (dropdown.classList.contains("hidden")) {
      chevronIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
        </svg>
      `;
    } else {
      chevronIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
        </svg>
      `;
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
