import 'https://cdn.jsdelivr.net/npm/chart.js';

const severityEnum = ["Unknown", "Minor", "Moderate", "Severe", "Extreme"]
const certaintyEnum = ["Unknown", "Unlikely", "Possible", "Likely", "Observed"]
const urgencyEnum = ["Unknown", "Past", "Future", "Expected", "Immediate"]
//Extra responses are to be treated as avoid tier response
const responseEnum = ["Avoid", "Execute", "Prepare", "Evacuate", "Shelter"]

const colorPalette = [
    { "temperature": 0, "color": "rgba(255, 255, 204, .6)" }, // Light Yellow
    { "temperature": 1, "color": "rgba(255, 255, 178, .6)" }, // Light Lemon Yellow
    { "temperature": 2, "color": "rgba(255, 255, 153, .6)" }, // Very Light Yellow
    { "temperature": 3, "color": "rgba(255, 255, 128, .6)" }, // Very Pale Yellow
    { "temperature": 4, "color": "rgba(255, 255, 102, .6)" }, // Light Pale Yellow
    { "temperature": 5, "color": "rgba(255, 255, 77, .6)" },  // Pale Yellow
    { "temperature": 6, "color": "rgba(255, 255, 51, .6)" },  // Bright Yellow
    { "temperature": 7, "color": "rgba(255, 255, 25, .6)" },  // Bright Lemon Yellow
    { "temperature": 8, "color": "rgba(255, 255, 0, .6)" },   // Yellow
    { "temperature": 9, "color": "rgba(255, 230, 0, .6)" },   // Golden Yellow
    { "temperature": 10, "color": "rgba(255, 204, 0, .6)" },  // Gold
    { "temperature": 11, "color": "rgba(255, 178, 0, .6)" },  // Darker Gold
    { "temperature": 12, "color": "rgba(255, 153, 0, .6)" },  // Light Orange
    { "temperature": 13, "color": "rgba(255, 127, 0, .6)" },  // Bright Orange
    { "temperature": 14, "color": "rgba(255, 102, 0, .6)" },  // Dark Orange
    { "temperature": 15, "color": "rgba(255, 77, 0, .6)" },   // Red-Orange
    { "temperature": 16, "color": "rgba(255, 51, 0, .6)" },   // Orange-Red
    { "temperature": 17, "color": "rgba(255, 26, 0, .6)" },   // Light Red
    { "temperature": 18, "color": "rgba(255, 0, 0, .6)" },    // Red
    { "temperature": 19, "color": "rgba(204, 0, 0, .6)" }     // Dark Red
]

class AlertBar extends HTMLElement {
    static observedAttributes = ["data-lon", "data-lat"]

    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });

        const alertContainer = document.createElement("div")
        alertContainer.id = "alert-container"

        const alertLoading = document.createElement("p")
        alertLoading.innerText = "loading..."
        alertContainer.append(alertLoading)

        const style = document.createElement("style")
        style.innerText = `
            #alert-container {
                width: 100%;
                height: 250px;
                display: flex;
                overflow: auto;
            }

            #alert-container:empty {
                height: 0px;
            }

            .alert-box {
                height: 230px;
                min-width: 300px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .alert-box label {
                font-weight: bold;
            }

            .alert-box .alert-area-description {
                margin: 0;
                padding: 5px;
                height: 60px;
                overflow: auto;
                text-align: center;
            }

            .alert-radar-chart-container {
                height: 150px;
                width: 300px;
            }
        `
        shadow.appendChild(style)
        shadow.appendChild(alertContainer)

        document.addEventListener("locationChange", (e) => {
            this.setAttribute("data-lon", e.detail[0])
            this.setAttribute("data-lat", e.detail[1])
        })
    }


    attributeChangedCallback(name, oldValue, newValue) {
        if ((name === "data-lon" || name === "data-lat") && newValue) {
            const lat = this.getAttribute("data-lat")
            const lon = this.getAttribute("data-lon")
            if (lon && lat) {
                fetch(`https://api.weather.gov/alerts?point=${lat},${lon}`)
                    .then(res => res.json())
                    .then(res => {
                        const alertContainer = this.shadowRoot.querySelector("#alert-container")
                        const alertTemplate = document.querySelector("#alert-box")
                        while (alertContainer.lastChild) {
                            alertContainer.removeChild(alertContainer.firstChild)
                        }

                        res.features.forEach(f => {
                            //Label it up
                            const newAlert = alertTemplate.content.cloneNode(true)

                            const newAlertEventLabel = newAlert.querySelector("label")
                            newAlertEventLabel.innerText = f.properties.event
                            const newAlertAreaDescription = newAlert.querySelector("p")
                            newAlertAreaDescription.innerText = f.properties.areaDesc
                            const ctx = newAlert.querySelector('.alert-radar-chart');

                            alertContainer.appendChild(newAlert)
                            
                            //Build Radar chart to convey severity/urgency/certainty/response
                            if (Chart.getChart(ctx)) {
                                Chart.getChart(ctx).destroy()
                            }

                            const severity = severityEnum.findIndex(s => s === f.properties.severity)
                            const certainty = certaintyEnum.findIndex(c => c === f.properties.certainty)
                            const urgency = urgencyEnum.findIndex(u => u === f.properties.urgency)
                            const responseIndex = responseEnum.findIndex(r => r === f.properties.response)
                            const response = responseIndex > 0 ? responseIndex : 0

                            new Chart(ctx, {
                                type: "radar",
                                data: {
                                    labels: ["Severity", "Certainty", "Urgency", "Response"],
                                    datasets: [
                                        {
                                            data: [
                                                severity,
                                                certainty,
                                                urgency,
                                                response
                                            ],
                                            backgroundColor: colorPalette.find(c => c.temperature === (severity + certainty + urgency + response)).color
                                        }
                                    ]
                                },
                                options: {
                                    maintainAspectRatio: false,
                                    scales: {
                                        r: {
                                            angleLines: {
                                                display: false
                                            },
                                            suggestedMin: 0,
                                            suggestedMax: 4,
                                            ticks: {
                                                display: false
                                            }
                                        },
                                    },
                                    plugins: {
                                        legend: {
                                            display: false,
                                        },
                                    }
                                }
                            })

                        })
                    })
            }
        }

    }

}

customElements.define("alert-bar", AlertBar);
