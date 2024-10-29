import 'https://cdn.jsdelivr.net/npm/chart.js';

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
    static observedAttributes = ["data-forecast-url", "data-forecast-start", "data-forecast-label"]

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

        const chartLabel = document.createElement("h3")
        chartLabel.innerText = "24 Hour Summary - "
        const chartSpan = document.createElement("span")
        chartSpan.innerText = "loading..."
        chartLabel.appendChild(chartSpan)

        const chartOverflow = document.createElement("div")
        chartOverflow.id = "chart-overflow"

        const chartContainer = document.createElement("div")
        chartContainer.id = "chart-container"

        const chartCanvas = document.createElement("canvas")
        chartCanvas.id = "chart-canvas"
        chartOverflow.appendChild(chartContainer)
        chartContainer.appendChild(chartCanvas)
        shadow.appendChild(chartLabel)
        shadow.appendChild(chartOverflow)

        document.addEventListener("forecastChange", (e) => {
            this.setAttribute("data-forecast-label", e.detail[1])
            this.setAttribute("data-forecast-start", e.detail[0])
        })

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if ((name === "data-forecast-url" || name === "data-forecast-start" || name === "data-forecast-label") && newValue) {
            const forecastUrl = this.getAttribute("data-forecast-url")
            const forecastStart = this.getAttribute("data-forecast-start") ? this.getAttribute("data-forecast-start") : 0
            this.shadowRoot.querySelector("h3").querySelector("span").innerText = this.getAttribute("data-forecast-label")
            fetch(forecastUrl)
                .then(res => res.json())
                .then(res => {

                    //Get index of selected time.
                    let forecastSlice
                    if (forecastStart) {
                        let index = res.properties.periods.findIndex(p => p.startTime === forecastStart)
                        if (index + 24 < res.properties.periods.length) {
                            forecastSlice = index
                        } else {
                            forecastSlice = res.properties.periods.length - 25
                        }
                    } else {
                        forecastSlice = 0
                    }

                    const slicedData = res.properties.periods.slice(forecastSlice, forecastSlice + 24)


                    const ctx = this.shadowRoot.getElementById('chart-canvas');
                    if (Chart.getChart(ctx)) {
                        Chart.getChart(ctx).destroy()
                    }
                    new Chart(ctx, {
                        data: {
                            datasets: [{
                                label: "Temperature",
                                type: "bar",
                                data: slicedData.map(p => {
                                    const periodStart = new Date(p.startTime)
                                    return {
                                        y: p.temperature,
                                        xHour: (periodStart.getHours() < 13 ? periodStart.getHours() : periodStart.getHours() % 12)
                                            + (periodStart.getHours() / 12 >= 1 ? " PM" : " AM"),
                                        xDay: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(periodStart),
                                        xSpeed: p.windSpeed,
                                        xDirection: p.windDirection,
                                        xPrecip: (p.probabilityOfPrecipitation.value ? p.probabilityOfPrecipitation.value : 0) + "%",
                                        xTemp: p.temperature,
                                        x: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(periodStart)
                                            + " "
                                            + (periodStart.getHours() < 13 ? periodStart.getHours() : periodStart.getHours() % 12)
                                            + (periodStart.getHours() / 12 >= 1 ? " PM" : " AM"),
                                    }
                                }),
                                backgroundColor: function (context) {
                                    const value = context.dataset.data[context.dataIndex];
                                    if (value?.y) {
                                        return colorPalette.find(c => value.y < c.temperature).color
                                    } else {
                                        return "white"
                                    }
                                },
                                borderRadius: 2,
                                categoryPercentage: 1, // Each category takes up 100% of the available space
                                barPercentage: 1, // Each bar takes up 100% of the category space
                                order: 4
                            },
                            {
                                label: "Relative Humidity",
                                type: "line",
                                data: slicedData.map(p => {
                                    const periodStart = new Date(p.startTime)
                                    return {
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
                                data: slicedData.map(p => {
                                    const periodStart = new Date(p.startTime)
                                    return {
                                        y: p?.dewpoint?.value ? ((p.dewpoint.value * (9 / 5)) + 32).toFixed(0) : 0,
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
                            interaction: {
                                mode: 'index',
                                axis: 'x'
                            },
                            plugins: {
                                legend: {
                                    display: true,
                                    position: "top",
                                    align: "start"
                                },
                                tooltip: {
                                    // Disable the on-canvas tooltip
                                    enabled: false,

                                    external: function (context) {
                                        // Tooltip Element
                                        let tooltipEl = document.getElementById('chartjs-tooltip');

                                        // Create element on first render
                                        if (!tooltipEl) {
                                            tooltipEl = document.createElement('div');
                                            tooltipEl.id = 'chartjs-tooltip';
                                            document.body.appendChild(tooltipEl);
                                        }

                                        // Hide if no tooltip
                                        const tooltipModel = context.tooltip;
                                        if (tooltipModel.opacity === 0) {
                                            tooltipEl.style.opacity = 0;
                                            return;
                                        }

                                        // Set caret Position
                                        tooltipEl.classList.remove('above', 'below', 'no-transform');
                                        if (tooltipModel.yAlign) {
                                            tooltipEl.classList.add(tooltipModel.yAlign);
                                        } else {
                                            tooltipEl.classList.add('no-transform');
                                        }

                                        function getBody(bodyItem) {
                                            return bodyItem.lines;
                                        }

                                        // Set Text
                                        if (tooltipModel.body) {

                                            while (tooltipEl.firstChild) {
                                                tooltipEl.removeChild(tooltipEl.lastChild)
                                            }

                                            const dataIndex = tooltipModel.dataPoints[0].dataIndex
                                            const tempData = tooltipModel.dataPoints.find(d => d.dataset.label === "Temperature")?.dataset?.data?.[dataIndex]
                                            const humidityData = tooltipModel.dataPoints.find(d => d.dataset.label === "Relative Humidity")?.dataset?.data?.[dataIndex]
                                            const dewpointData = tooltipModel.dataPoints.find(d => d.dataset.label === "Dewpoint")?.dataset?.data?.[dataIndex]
                                            const tooltipContents = document.createElement("div")
                                            tooltipContents.className = "tooltip-contents"
                                            const tooltipLabelColors = tooltipModel.labelColors[0]
                                            tooltipContents.setAttribute("style",
                                                `border: 2px solid ${tooltipLabelColors.backgroundColor};`)
                                            if (tempData) {
                                                const tooltipLabel = document.createElement("label")
                                                tooltipLabel.innerText = `${tempData.x}`
                                                tooltipContents.appendChild(tooltipLabel)

                                                const tooltipWindLabel = document.createElement("label")
                                                tooltipWindLabel.innerText = `Wind`
                                                const tooltipWind = document.createElement("p")
                                                tooltipWind.innerText = `${tempData.xSpeed} ${tempData.xDirection}`
                                                tooltipContents.appendChild(tooltipWindLabel)
                                                tooltipContents.appendChild(tooltipWind)

                                                const tooltipTemperatureLabel = document.createElement("label")
                                                tooltipTemperatureLabel.innerText = "Temp"
                                                const tooltipTemperature = document.createElement("p")
                                                tooltipTemperature.innerText = `${tempData.xTemp}° F`
                                                tooltipContents.appendChild(tooltipTemperatureLabel)
                                                tooltipContents.appendChild(tooltipTemperature)


                                                const tooltipPrecipLabel = document.createElement("label")
                                                tooltipPrecipLabel.innerText = "Chance of Precipitation"
                                                const tooltipPrecip = document.createElement("p")
                                                tooltipPrecip.innerText = `${tempData.xPrecip}`
                                                tooltipContents.appendChild(tooltipPrecipLabel)
                                                tooltipContents.appendChild(tooltipPrecip)
                                            }

                                            if (humidityData) {
                                                if (!tempData) {
                                                    const tooltipLabel = document.createElement("label")
                                                    tooltipLabel.innerText = `${humidityData.x}`
                                                    tooltipContents.appendChild(tooltipLabel)
                                                }

                                                const tooltipHumidityLabel = document.createElement("label")
                                                tooltipHumidityLabel.innerText = `Relative Humidity`
                                                const tooltipHumidity = document.createElement("p")
                                                tooltipHumidity.innerText = `${humidityData.y}%`
                                                tooltipContents.appendChild(tooltipHumidityLabel)
                                                tooltipContents.appendChild(tooltipHumidity)
                                            }

                                            if (dewpointData) {
                                                if (!tempData && !humidityData) {
                                                    const tooltipLabel = document.createElement("label")
                                                    tooltipLabel.innerText = `${dewpointData.x}`
                                                    tooltipContents.appendChild(tooltipLabel)
                                                }

                                                const tooltipDewpointLabel = document.createElement("label")
                                                tooltipDewpointLabel.innerText = "Dewpoint"
                                                const tooltipDewpoint = document.createElement("p")
                                                tooltipDewpoint.innerText = `${dewpointData.y}° F`
                                                tooltipContents.appendChild(tooltipDewpointLabel)
                                                tooltipContents.appendChild(tooltipDewpoint)
                                            }
                                            tooltipEl.appendChild(tooltipContents)

                                        }

                                        const position = context.chart.canvas.getBoundingClientRect();
                                        const bodyFont = Chart.helpers.toFont(tooltipModel.options.bodyFont);

                                        // Display, position, and set styles for font
                                        tooltipEl.style.opacity = 1;
                                        tooltipEl.style.position = 'absolute';
                                        tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 20 + 'px';
                                        tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY - 80 + 'px';
                                        tooltipEl.style.font = bodyFont.string;
                                        tooltipEl.style.padding = tooltipModel.padding + 'px ' + tooltipModel.padding + 'px';
                                        tooltipEl.style.pointerEvents = 'none';
                                    }
                                }
                            },
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    display: false
                                },
                                x: {
                                    display: false,
                                },
                                xTemp: {
                                    position: "bottom",
                                    axis: "x",
                                    type: "category",
                                    labels: slicedData.map(p => (p.temperature) + "° F"),
                                    grid: {
                                        display: false,

                                    },
                                    border: {
                                        display: false
                                    },
                                    ticks: {
                                        padding: 0,
                                        font: {
                                            weight: "bolder"
                                        },
                                        backdropPadding: {
                                            x: 5,
                                            y: 2
                                        }
                                    },
                                    offset: true
                                },
                                xDay: {
                                    position: "bottom",
                                    axis: "x",
                                    type: "category",
                                    grid: {
                                        display: false
                                    },
                                    labels: slicedData.map(p => {
                                        const periodStart = new Date(p.startTime)
                                        return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(periodStart)
                                    }),
                                    border: {
                                        display: false
                                    },
                                    ticks: {
                                        padding: 0,
                                        backdropPadding: 0
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
                                    labels: slicedData.map(p => {
                                        const periodStart = new Date(p.startTime)
                                        return (periodStart.getHours() < 13 ? periodStart.getHours() : periodStart.getHours() % 12)
                                            + (periodStart.getHours() / 12 >= 1 ? " PM" : " AM")
                                    }),
                                    border: {
                                        display: false
                                    },
                                    ticks: {
                                        padding: 0,
                                        backdropPadding: 0
                                    },
                                    offset: true,
                                    padding: 0
                                },
                                xPrecip: {
                                    position: "top",
                                    axis: "x",
                                    type: "category",
                                    labels: slicedData.map(p => (p.probabilityOfPrecipitation.value ? p.probabilityOfPrecipitation.value : 0) + "%"),
                                    grid: {
                                        display: false,

                                    },
                                    ticks: {
                                        padding: 0,
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
                                    labels: slicedData.map(p => p.windDirection),
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
                                },
                                xSpeed: {
                                    alignToPixels: true,
                                    position: "top",
                                    axis: "x",
                                    type: "category",
                                    labels: slicedData.map(p => p.windSpeed),
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
                })                    
                .catch(error => {
                    console.error(error)
                    document.dispatchEvent(new CustomEvent("InvalidLocation"))
                })
            this.shadowRoot.querySelector("#chart-overflow").scroll(0, 0)
        }
    }
}

customElements.define("hourly-chart", HourlyChart);