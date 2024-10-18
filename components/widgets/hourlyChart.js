import 'https://cdn.jsdelivr.net/npm/chart.js';
import 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0';


const colorPalette = [
    { "temperature": -50, "color": "rgba(0, 0, 139, .8)" },    // Dark Blue
    { "temperature": -40, "color": "rgba(0, 0, 255, .8)" },    // Blue
    { "temperature": -30, "color": "rgba(30, 144, 255, .8)" }, // Dodger Blue
    { "temperature": -20, "color": "rgba(0, 191, 255, .8)" },  // Deep Sky Blue
    { "temperature": -10, "color": "rgba(135, 206, 250, .8)" },// Light Sky Blue
    { "temperature": 0, "color": "rgba(176, 224, 230, .8)" },  // Powder Blue
    { "temperature": 10, "color": "rgba(173, 216, 230, .8)" }, // Light Blue
    { "temperature": 20, "color": "rgba(135, 206, 235, .8)" }, // Sky Blue
    { "temperature": 30, "color": "rgba(70, 130, 180, .8)" },  // Steel Blue
    { "temperature": 40, "color": "rgba(95, 158, 160, .8)" },  // Cadet Blue
    { "temperature": 50, "color": "rgba(102, 205, 170, .8)" }, // Medium Aquamarine
    { "temperature": 60, "color": "rgba(50, 205, 50, .8)" },   // Lime Green
    { "temperature": 65, "color": "rgba(0, 250, 154, .8)" },   // Medium Spring Green
    { "temperature": 70, "color": "rgba(0, 255, 127, .8)" },   // Spring Green
    { "temperature": 75, "color": "rgba(124, 252, 0, .8)" },   // Lawn Green
    { "temperature": 80, "color": "rgba(173, 255, 47, .8)" },  // Green Yellow
    { "temperature": 85, "color": "rgba(255, 215, 0, .8)" },   // Gold
    { "temperature": 90, "color": "rgba(255, 202, 0, .8)" },   // Orange
    { "temperature": 95, "color": "rgba(255, 69, 0, .8)" },    // Orange Red
    { "temperature": 100, "color": "rgba(255, 34, 0, .8)" },   // Red-orange
    { "temperature": 105, "color": "rgba(255, 0, 0, .8)" },    // Red
    { "temperature": 110, "color": "rgba(204, 0, 0, .8)" },    // Dark Red
    { "temperature": 120, "color": "rgba(139, 0, 0, .8)" },    // Darker Red
    { "temperature": 130, "color": "rgba(139, 0, 51, .8)" }    // Dark Redish/Purple
]
//Location widget will display the current selected station or "???" if current station is unselected.  
//When the widget is clicked, it will open a dialog to update the user's current location
class HourlyChart extends HTMLElement {
    static observedAttributes = ["data-forecast-url"]

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });

        const chartOverflow = document.createElement("div")
        chartOverflow.id = "chart-overflow"

        const chartContainer = document.createElement("div")
        chartContainer.id = "chart-container"

        const chartCanvas = document.createElement("canvas")
        chartCanvas.id = "chart-canvas"
        chartOverflow.appendChild(chartContainer)
        chartContainer.appendChild(chartCanvas)
        shadow.appendChild(chartOverflow)

        const style = document.createElement("style")

        style.innerText = `
        #chart-overflow {
            height: 300px;
            width: 100%;
            overflow: auto
        }
        #chart-container {
            margin: 10px;
            height: 280px;
            width: 10000px;
            }

        `
        shadow.appendChild(style)

    }

    connectedCallback() {

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "data-forecast-url" && newValue) {
            fetch(newValue)
                .then(res => res.json())
                .then(res => {
                    const ctx = this.shadowRoot.getElementById('chart-canvas');
                    if (Chart.getChart(ctx)) {
                        Chart.getChart(ctx).destroy()
                    }
                    const weeklyChart = new Chart(ctx, {
                        plugins: [ChartDataLabels],
                        data: {
                            datasets: [{
                                label: "Temperature",
                                type: "bar",
                                data: res.properties.periods.map(p => {
                                    const periodStart = new Date(p.startTime)
                                    return {
                                        y: p.temperature,
                                        xHour: (periodStart.getHours() < 13 ? periodStart.getHours() : periodStart.getHours() % 12)
                                            + (periodStart.getHours() / 12 >= 1 ? " PM" : " AM"),
                                        xDay: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(periodStart),
                                        xSpeed: p.windSpeed,
                                        xDirection: p.windDirection,
                                        xPrecip: (p.probabilityOfPrecipitation.value ? p.probabilityOfPrecipitation.value : 0) + "%",
                                        x: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(periodStart)
                                            + " "
                                            + (periodStart.getHours() < 13 ? periodStart.getHours() : periodStart.getHours() % 12)
                                            + (periodStart.getHours() / 12 >= 1 ? " PM" : " AM"),
                                    }
                                }),
                                backgroundColor: function (context) {
                                    const value = context.dataset.data[context.dataIndex];
                                    return colorPalette.find(c => value.y < c.temperature).color
                                },
                                borderRadius: 2,
                                categoryPercentage: 1, // Each category takes up 100% of the available space
                                barPercentage: 1, // Each bar takes up 100% of the category space
                                order: 4
                            },
                            {
                                label: "Relative Humidity",
                                type: "line",
                                data: res.properties.periods.map(p => {
                                    const periodStart = new Date(p.startTime)
                                    return {
                                        xHour: (periodStart.getHours() < 13 ? periodStart.getHours() : periodStart.getHours() % 12)
                                            + (periodStart.getHours() / 12 >= 1 ? " PM" : " AM"),
                                        xDay: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(periodStart),
                                        xSpeed: p.windSpeed,
                                        xDirection: p.windDirection,
                                        xPrecip: (p.probabilityOfPrecipitation.value ? p.probabilityOfPrecipitation.value : 0) + "%",
                                        y: p.relativeHumidity.value ? p.relativeHumidity.value : 0,
                                        x: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(periodStart)
                                            + " "
                                            + (periodStart.getHours() < 13 ? periodStart.getHours() : periodStart.getHours() % 12)
                                            + (periodStart.getHours() / 12 >= 1 ? " PM" : " AM"),
                                    }
                                }),
                                backgroundColor: "#301B87",
                                pointRadius: 5,
                                order: 2,
                                hidden: true
                            },
                            {
                                label: "Dewpoint",
                                type: "line",
                                data: res.properties.periods.map(p => {
                                    const periodStart = new Date(p.startTime)
                                    return {
                                        xHour: (periodStart.getHours() < 13 ? periodStart.getHours() : periodStart.getHours() % 12)
                                            + (periodStart.getHours() / 12 >= 1 ? " PM" : " AM"),
                                        xDay: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(periodStart),
                                        xSpeed: p.windSpeed,
                                        xDirection: p.windDirection,
                                        xPrecip: (p.probabilityOfPrecipitation.value ? p.probabilityOfPrecipitation.value : 0) + "%",
                                        y: p?.dewpoint?.value ? p.dewpoint.value.toFixed(0) : 0,
                                        x: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(periodStart)
                                            + " "
                                            + (periodStart.getHours() < 13 ? periodStart.getHours() : periodStart.getHours() % 12)
                                            + (periodStart.getHours() / 12 >= 1 ? " PM" : " AM"),
                                    }
                                }),
                                backgroundColor: "#A06BC7",
                                pointRadius: 5,
                                order: 1,
                                hidden: true,
                            },
                            ],
                        },
                        options: {
                            plugins: {
                                legend: {
                                    display: true,
                                    position: "top",
                                    align: "start"
                                },
                                // Change options for ALL labels of THIS CHART
                                datalabels: {
                                    color: '#0A0A0A',
                                    formatter: function (value, context) {
                                        console.log(context)
                                        if (context.dataset.label === "Dewpoint") return value.y + "°"
                                        if (context.dataset.type === "line") return value.y + '%';
                                        return value.y + "° F"
                                    },
                                    anchor: "end",
                                    align: function (context) {
                                        if (context.dataset.type === "line") return "bottom"
                                        return "top"
                                    },
                                    display: function (context) {
                                        if (context.dataset.type === "line") return "auto"
                                        return true
                                    },
                                    font: {
                                        weight: "bold"
                                    },
                                    offset: 6
                                }
                            },
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    display: false,
                                    max: 150
                                },
                                x: {
                                    display: false,
                                },
                                xDay: {
                                    position: "bottom",
                                    axis: "x",
                                    type: "category",
                                    grid: {
                                        display: false
                                    },
                                    labels: res.properties.periods.map(p => {
                                        const periodStart = new Date(p.startTime)
                                        return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(periodStart)
                                    }),
                                    border: {
                                        display: false
                                    },
                                    ticks: {
                                        padding: 0
                                    },      
                                    offset: true
                                },
                                xHour: {
                                    position: "bottom",
                                    axis: "x",
                                    type: "category",
                                    grid: {
                                        display: false
                                    },
                                    labels: res.properties.periods.map(p => {
                                        const periodStart = new Date(p.startTime)
                                        return (periodStart.getHours() < 13 ? periodStart.getHours() : periodStart.getHours() % 12)
                                            + (periodStart.getHours() / 12 >= 1 ? " PM" : " AM")
                                    }),
                                    border: {
                                        display: false
                                    },
                                    ticks: {
                                        padding: 0
                                    },      
                                    offset: true
                                },
                                xPrecip: {
                                    position: "top",
                                    axis: "x",
                                    type: "category",
                                    labels: res.properties.periods.map(p => (p.probabilityOfPrecipitation.value ? p.probabilityOfPrecipitation.value : 0) + "%"),
                                    grid: {
                                        display: false,

                                    },
                                    border: {
                                        display: false
                                    },
                                    offset: true
                                },
                                xDirection: {
                                    position: "top",
                                    axis: "x",
                                    type: "category",
                                    labels: res.properties.periods.map(p => p.windDirection),
                                    grid: {
                                        display: false,
                                    },
                                    ticks: {
                                        padding: 0
                                    },                                    
                                    offset: true
                                },
                                xSpeed: {
                                    alignToPixels: true,
                                    position: "top",
                                    axis: "x",
                                    type: "category",
                                    labels: res.properties.periods.map(p => p.windSpeed),
                                    grid: {
                                        display: false,
                                    },
                                    border: {
                                        display: false
                                    },
                                    ticks: {
                                        padding: 0
                                    },      
                                    offset: true
                                }
                            }

                        }
                    })
                    console.log(weeklyChart)
                })
        }
    }
}

customElements.define("hourly-chart", HourlyChart);