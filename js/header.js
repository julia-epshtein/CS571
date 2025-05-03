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
        <p><strong>California’s Three Strikes Law</strong>, also known as “Three Strikes and You’re Out,” is designed to deter repeat offenders by mandating a minimum life sentence of 25 years to life for those convicted of three serious felonies, which can lead to incarceration and systemic unfairness.
        <h6><strong>Explore</strong> our interactive visualizations to see how this law, intended to punish the most dangerous criminals, has instead led to harsh outcomes. The visualizations reveal the real impact behind the statistics and a way to spark a conversation on justice reform.</h6>
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