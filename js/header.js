function createHeader() {
    const header = document.createElement('div');
    header.className = 'header';
    
    const logo = document.createElement('img');
    logo.src = 'assets/justice_logo.svg'; 
    logo.alt = 'Justice Through Data Logo';
    logo.className = 'header-logo';
    
    const mainTitle = document.createElement('div');
    mainTitle.className = 'header-main-title';
    mainTitle.textContent = "THREE STRIKES AND YOU'RE OUT.";
    
    const description = document.createElement('div');
    description.className = 'header-description';
    description.innerHTML = `
        <p><strong>California’s Three Strikes Law</strong> mandates a minimum 25-years-to-life sentence for individuals convicted of <strong>three serious felonies</strong>, including burglary, robbery, murder, and other violent crimes.</p>
        <p>This project aims to raise awareness of the law’s negative impacts, especially on California <strong>incarceration rates</strong> and <strong>marginalized communities</strong>.</p>
        <p>We put together <strong>six</strong> data visualizations to tell the story.</p>
    `;
    
    const nameBox = document.createElement('div');
    nameBox.className = 'name-box';
    nameBox.textContent = 'Shachi Benara, Julia Epshtein, and Jayani Tripathi';
    
    header.appendChild(logo);
    header.appendChild(mainTitle);
    header.appendChild(nameBox);
    header.appendChild(description);   
    
    document.body.insertBefore(header, document.body.firstChild);
}

document.addEventListener('DOMContentLoaded', createHeader);