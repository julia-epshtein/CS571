# CS571
Final Project For CS571

# Python Virtual Environment Setup

### 1. Set up python virtual environment

#### If you're on **macOS/Linux**:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### If you're on **Windows**:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

# California Sentencing by County

## Project Overview
This project visualizes California's sentencing and imprisonment data across counties, focusing on racial disparities, poverty correlations, and the impact of the Three Strikes law. The interactive dashboard presents multiple visualizations to help understand patterns in incarceration rates, costs, and demographic disparities.

## Project Website
[View our live project website](https://julia-epshtein.github.io/CS571/)

## Project Screencast
[Watch our project demonstration](https://www.youtube.com/watch?v=AnRJEltGcEg)

## Process Book
[View our process book](https://www.canva.com/design/DAGkQXK-pD4/-254poNSlgvkSuaSI0a3Ww/view?utm_content=DAGkQXK-pD4&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hd6e2adb9d6)

## Project Structure

```
CS571/
├── README.md                    # Project documentation
├── index.html                   # Entry HTML file
├── requirements.txt             # Python dependencies
├── assets/
│   └── justice_logo.svg        # Project logo
├── css/
│   ├── main.css                # Main styling
│   ├── header.css              # Header styling
│   ├── map.css                 # Choropleth map styling
│   ├── minority-map.css        # Minority population map styling
│   ├── heatmap.css             # Heatmap visualization styling
│   ├── scatterplot.css         # Scatterplot styling
│   ├── bar-chart.css           # Bar chart styling
│   ├── line-chart.css          # Line chart styling
│   └── california-demographics-bar-chart.css
├── js/
│   ├── main.js                 # Main JavaScript file
│   ├── header.js               # Header functionality
│   ├── county-filter.js        # County filtering functionality
│   ├── choropleth-maps/        # County-level imprisonment and minority maps
│   ├── bar-charts/             # Demographics, sentence length, and strikes visualizations
│   ├── scatterplots/           # Poverty vs. imprisonment rate correlation
│   ├── line-charts/            # Imprisonment rates and costs over time
│   └── heatmaps/               # County-level imprisonment rates and costs over time
├── data/
│   ├── adult/                  # Adult imprisonment data
│   ├── all_years/              # Time series data across years
│   ├── minority-map_dataset/   # Minority population data by county
│   ├── preprocessed/           # Intermediate processed data
│   ├── processed/              # Final processed data for visualizations
│   ├── current_commitments.csv # Current prison commitment data
│   ├── demographics.csv        # Demographic data
│   └── prior_commitments.csv   # Prior prison commitment data
└── python/
    ├── charts.ipynb           # Notebook for chart data preparation
    ├── data_exploration.ipynb  # Data exploration and analysis
    └── preprocessing.ipynb     # Data cleaning and preprocessing
```

### Custom Code Components
- **Visualizations**: All visualization code in the `js/` directory is our custom implementation:
  - **Choropleth Maps** (`js/choropleth-maps/`): County-level imprisonment and minority population maps
  - **Bar Charts** (`js/bar-charts/`): Demographics, sentence length, and strikes visualizations
  - **Scatterplots** (`js/scatterplots/`): Poverty vs. imprisonment rate correlation
  - **Line Charts** (`js/line-charts/`): Imprisonment rates and costs over time
  - **Heatmaps** (`js/heatmaps/`): County-level imprisonment rates and costs over time
- **Styling**: All CSS in the `css/` directory is custom-designed for our visualizations
- **Data Processing**: Python notebooks in the `python/` directory for data cleaning and preparation

### External Libraries
- **JavaScript Libraries**:
  - **TopoJSON (v3)**: For map rendering and geographic data processing
- **Styling**:
  - **Google Fonts**: For typography throughout the application
- **Python Libraries** (for data processing):
  - **Pandas**: For data manipulation and analysis
  - **NumPy**: For numerical operations
  - **Matplotlib**: For basic data visualization
  - **Seaborn**: For statistical data visualization

## Data Sources
- All data files are located in the `data/` directory
- Raw data from California Department of Corrections and Rehabilitation (CDCR)
- Raw data from Center on Juvenile and Criminal Justice
- Demographic data from National Institute on Minority Health and Health Disparities
- Processed data in CSV format

## Setup Instructions

### Python Environment Setup (for data processing)

#### macOS/Linux:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Windows:
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Running the Project
1. Clone this repository
2. Open `index.html` in a modern web browser
3. No server setup required as all data is included in the repository

## Special Features

### Interactive Scatterplot
The scatterplot visualization (in `js/scatterplots/scatterplot.js`) features:
- Circle sizes scaled proportionally to represent county incarcerated population
- Square root scale used for better visual representation of population values
- Year-by-year exploration with animation between states
- Interactive tooltips showing detailed county information
- Regression line showing the correlation between poverty and imprisonment rates

### Choropleth Maps
- County-level data visualization with color gradients
- Side-by-side comparison of imprisonment rates and minority population percentages
- Custom legends for data interpretation

### Time-Series Visualizations
- Interactive heatmaps showing changes over time (2009-2016)
- Line charts displaying trends in imprisonment rates and costs

## Contributors
- Shachi Benara [@benaras](https://github.com/benaras)
- Julia Epshtein [@julia-epshtein](https://github.com/julia-epshtein)
- Jayani Tripathi [@jayanitripathi](https://github.com/jayanitripathi)

