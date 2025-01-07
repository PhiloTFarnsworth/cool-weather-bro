import 'https://cdn.jsdelivr.net/npm/chart.js';

function degToCompass(num) {
    var val = Math.floor((num / 22.5) + 0.5);
    var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
}



const colorPalette = [
    { "unit": -50, "color": "rgba(0, 0, 139, .8)" },    // Dark Blue
    { "unit": -40, "color": "rgba(0, 0, 255, .8)" },    // Blue
    { "unit": -30, "color": "rgba(30, 144, 255, .8)" }, // Dodger Blue
    { "unit": -20, "color": "rgba(0, 191, 255, .8)" },  // Deep Sky Blue
    { "unit": -10, "color": "rgba(135, 206, 250, .8)" },// Light Sky Blue
    { "unit": 0, "color": "rgba(176, 224, 230, .8)" },  // Powder Blue
    { "unit": 10, "color": "rgba(173, 216, 230, .8)" }, // Light Blue
    { "unit": 20, "color": "rgba(135, 206, 235, .8)" }, // Sky Blue
    { "unit": 30, "color": "rgba(70, 130, 180, .8)" },  // Steel Blue
    { "unit": 40, "color": "rgba(95, 158, 160, .8)" },  // Cadet Blue
    { "unit": 50, "color": "rgba(102, 205, 170, .8)" }, // Medium Aquamarine
    { "unit": 60, "color": "rgba(50, 205, 50, .8)" },   // Lime Green
    { "unit": 65, "color": "rgba(0, 250, 154, .8)" },   // Medium Spring Green
    { "unit": 70, "color": "rgba(0, 255, 127, .8)" },   // Spring Green
    { "unit": 75, "color": "rgba(124, 252, 0, .8)" },   // Lawn Green
    { "unit": 80, "color": "rgba(173, 255, 47, .8)" },  // Green Yellow
    { "unit": 85, "color": "rgba(255, 215, 0, .8)" },   // Gold
    { "unit": 90, "color": "rgba(255, 202, 0, .8)" },   // Orange
    { "unit": 95, "color": "rgba(255, 69, 0, .8)" },    // Orange Red
    { "unit": 100, "color": "rgba(255, 34, 0, .8)" },   // Red-orange
    { "unit": 105, "color": "rgba(255, 0, 0, .8)" },    // Red
    { "unit": 110, "color": "rgba(204, 0, 0, .8)" },    // Dark Red
    { "unit": 120, "color": "rgba(139, 0, 0, .8)" },    // Darker Red
    { "unit": 130, "color": "rgba(139, 0, 51, .8)" }    // Dark Redish/Purple
]


const percipPalette = [
    { "unit": 0, "color": "rgba(176, 224, 230, .8)" },  // Powder Blue
    { "unit": 1, "color": "rgba(70, 130, 180, .8)" },  // Steel Blue
    { "unit": 2, "color": "rgba(102, 205, 170, .8)" }, // Medium Aquamarine
    { "unit": 4, "color": "rgba(50, 205, 50, .8)" },   // Lime Green
    { "unit": 8, "color": "rgba(255, 215, 0, .8)" },   // Gold
    { "unit": 12, "color": "rgba(255, 0, 0, .8)" },    // Red
    { "unit": 100, "color": "rgba(139, 0, 51, .8)" }    // Dark Redish/Purple
]

const unitHandling = [
    { name: "degC", transformer: (value) => ((Number(value) * 9 / 5) + 32).toFixed(0), bounds: [-50, 150], label: "° F", palette: colorPalette },
    { name: "degree_(angle)", transformer: (value) => degToCompass(value), palette: ["rgba(70, 130, 180, .8)"] },
    { name: "percent", transformer: (value) => value, bounds: [0, 100], label: "%", palette: colorPalette },
    { name: "mm", transformer: (value) => (value / 25.4).toFixed(2), label: " in", bounds: [0, 24], palette: percipPalette },
    { name: "m", transformer: (value) => (value * 3.281).toFixed(2), label: " ft", bounds: [0, 10000], palette: ["rgba(70, 130, 180, .8)"]},
    { name: "km_h-1", transformer: (value) => (value / 1.609).toFixed(2), bounds: [0, 100], label: " MPH", palette: colorPalette}
]

function camelCaseToWords(s) {
    const result = s.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
}

class WeatherDetails extends HTMLElement {
    static observedAttributes = ["data-grid-url"]

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        //Copy Global Styles into the shadow Dom, so we're not re-writing everything
        const globalStylesIndex = Array.from(document.styleSheets).findIndex(s => s.href.includes("static/globalStyles.css"))
        if (globalStylesIndex !== undefined) {
            const globalStylesCopy = new CSSStyleSheet()
            Array.from(document.styleSheets.item(globalStylesIndex).cssRules).forEach(c => globalStylesCopy.insertRule(c.cssText))
            shadow.adoptedStyleSheets = [globalStylesCopy];
        }

        const weatherDetailsHeader = document.createElement("h3")
        weatherDetailsHeader.innerText = "Weather Details"
        shadow.appendChild(weatherDetailsHeader)

        const weatherDetailsContainer = document.createElement("div")
        weatherDetailsContainer.id = "weather-details-container"
        shadow.appendChild(weatherDetailsContainer)


    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(name)
        if (name === "data-grid-url" && newValue) {
            fetch(newValue)
                .then(res => res.json())
                .then(res => {
                    const weatherDetailsContainer = this.shadowRoot.querySelector("#weather-details-container")
                    const weatherDetailTemplate = document.querySelector("#weather-detail")
                    while (weatherDetailsContainer.lastChild) {
                        weatherDetailsContainer.removeChild(weatherDetailsContainer.firstChild)
                    }

                    Object.entries(res.properties).forEach(([pKey, pVal]) => {
                        if (pVal?.values?.length > 0 && pVal?.uom) {
                            const newDetail = weatherDetailTemplate.content.cloneNode(true)

                            const handler = unitHandling.find(u => u.name === pVal.uom.split(":")[1])
                            const textValue = handler?.transformer ?
                                handler.transformer(pVal.values[0].value) +
                                (handler.label ? handler.label : "")
                                : pVal.values[0].value
                            newDetail.querySelector("label").innerText = camelCaseToWords(pKey)
                            newDetail.querySelector("p").innerText = textValue
                            weatherDetailsContainer.appendChild(newDetail)

                            const canvasNodes = weatherDetailsContainer.querySelectorAll("canvas")
                            const ctx = canvasNodes[canvasNodes.length - 1]
                            console.log(ctx)
                            if (Chart.getChart(ctx)) {
                                Chart.getChart(ctx).destroy()
                            }
                            if (handler.label) {
                                let bounds = handler?.bounds ? handler.bounds : [0, 10]
                                new Chart(ctx, {
                                    data: {
                                        labels: [camelCaseToWords(pKey)],
                                        datasets: [{
                                            axis: "x",
                                            label: camelCaseToWords(pKey),
                                            type: "bar",
                                            data: [handler?.transformer ? handler.transformer(pVal.values[0].value) : pVal.values[0].value],
                                            backgroundColor: function (context) {
                                                const value = context.dataset.data[context.dataIndex];
                                                if (value) {
                                                    if (handler.palette.length > 1) {
                                                        return handler.palette.find(c => value < c.unit).color
                                                    }
                                                    return handler.palette[0]                                                    
                                                } else {
                                                    return "rgba(70, 130, 180, .8)"
                                                }
                                            },
                                            base: bounds[0]
                                        }]
                                    },
                                    options: {
                                        indexAxis: 'y',
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                display: false
                                            },
                                        },
                                        scales: {
                                            x: {
                                                min: bounds[0],
                                                max: bounds[1],
                                                grid: {
                                                    display: false,
                                                },
                                                beginAtZero: false,
                                                ticks: {
                                                    beginAtZero: false
                                                }
                                            },
                                            y: {
                                                display: false,
                                                grid: {
                                                    display: false,

                                                },
                                            }
                                        }
                                    }
                                })
                            }
                        }
                    })
                })
        }
    }
}

customElements.define("weather-details", WeatherDetails);