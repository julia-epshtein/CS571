// Function to create the header component
function createHeader() {
    const header = document.createElement('div');
    header.className = 'header';
    
    const logo = document.createElement('img');
    logo.src = 'assets/justice_logo.svg'; // Path to your logo image
    logo.alt = 'Justice Through Data Logo';
    logo.className = 'header-logo';
    
    const mainTitle = document.createElement('div');
    mainTitle.className = 'header-main-title';
    mainTitle.textContent = 'THREE STRIKES AND YOU\'RE OUT.';
    
    const description = document.createElement('div');
    description.className = 'header-description';
    description.innerHTML = '"California\'s Three Strike\'s Law" also known as "Three Strikes and You\'re Out," mandates a minimum life sentence of 25 years to life in prison for individuals convicted of three serious felonies. The purpose of this law is to dramatically increase the punishment for felons who have been previously convicted of crimes. Let bring justice to all!';
    
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