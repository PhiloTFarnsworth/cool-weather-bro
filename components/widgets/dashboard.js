import { get, set } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

//Location widget will display the current selected station or "???" if current station is unselected.  
//When the widget is clicked, it will open a dialog to update the user's current location
class WeatherDashboard extends HTMLElement {
    static observedAttributes = ["data-lon", "data-lat"]

    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });
        const dashboardContainer = document.createElement('div')
        dashboardContainer.id = "dashboard-container"
        shadow.appendChild(dashboardContainer)
        
        const dailyForecast = document.createElement("div")
        dailyForecast.id = "daily-forecast"
        dashboardContainer.appendChild(dailyForecast)

        // const forecastBoxTemplate = document.createElement("template")
        // forecastBoxTemplate.id = "forecast-box"


        // const forecastBoxLabel = document.createElement("label")
        // forecastBoxTemplate.append(forecastBoxLabel)

        // const forecastBoxIcon = document.createElement("img")
        // forecastBoxTemplate.append(forecastBoxIcon)

        // const forecastBoxTemp = document.createElement("p")
        // forecastBoxTemplate.append(forecastBoxTemp)
        // shadow.appendChild(forecastBoxTemplate)

        document.addEventListener("locationChange", (e) => {
            console.log(e.detail)
            this.setAttribute("data-lon", e.detail[0])
            this.setAttribute("data-lat", e.detail[1])
        })
    }


    connectedCallback() {

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if ((name === "data-lon" || name === "data-lat") && newValue) {
            if (this.getAttribute("data-lat") && this.getAttribute("data-lon")) {
                fetch(`https://api.weather.gov/points/${this.getAttribute("data-lat")},${this.getAttribute("data-lon")}`)
                    .then(res => res.json())
                    .then(res => {
                        fetch(res.properties.forecast)
                            .then(res => res.json())
                            .then(res => {
                                const dailyForecast = this.shadowRoot.querySelector("#daily-forecast")
                                const forecastTemplate = document.querySelector("#forecast-box")
                                res.properties.periods.forEach(p => {
                                    const newForecast = forecastTemplate.content.cloneNode(true)
                                    newForecast.querySelector("label").innerText = p.name
                                    newForecast.querySelector("img").src = p.icon
                                    newForecast.querySelector("p").innerText = p.temperature + "°" + p.temperatureUnit
                                    dailyForecast.appendChild(newForecast)
                                })
                            })
                    }
                )
            }
        }
    }
}

customElements.define("weather-dashboard", WeatherDashboard);