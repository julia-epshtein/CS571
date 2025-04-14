function createHeader() {
    const header = document.createElement('div');
    header.className = 'header';
    
    const logo = document.createElement('img');
    logo.src = 'assets/justice_logo.svg'; 
    logo.alt = 'Justice Through Data Logo';
    logo.className = 'header-logo';
    
    const mainTitle = document.createElement('div');
    mainTitle.className = 'header-main-title';
    mainTitle.textContent = 'THREE STRIKES AND YOU\'RE OUT.';
    
    const description = document.createElement('div');
    description.className = 'header-description';
    description.innerHTML = 'California’s Three Strikes Law, also known as “Three Strikes and You’re Out,” mandates a minimum life sentence of 25 years to life for those convicted of three serious felonies—an effort originally designed to deter repeat offenders but one that has contributed to over-incarceration and systemic unfairness. Explore our interactive visualizations to see how this law, intended to punish the most dangerous criminals, has instead led to harsh outcomes, revealing the real impact behind the statistics and sparking a conversation on justice reform.';;
    
    const nameBox = document.createElement('div');
    nameBox.className = 'name-box';
    nameBox.textContent = 'Shachi Benara, Julia Epshtein, and Jayani Tripathi';
    
    header.appendChild(logo);
    header.appendChild(mainTitle);
    header.appendChild(description);
    header.appendChild(nameBox);
    
    document.body.insertBefore(header, document.body.firstChild);
}

    document.addEventListener('DOMContentLoaded', function() {
    createHeader();
});