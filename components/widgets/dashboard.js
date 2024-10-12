import { get, set } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

//Location widget will display the current selected station or "???" if current station is unselected.  
//When the widget is clicked, it will open a dialog to update the user's current location
class WeatherDashboard extends HTMLElement {
    static observedAttributes = ["data-lon", "data-lat"]

    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });
        
        //Header should have name of station (maybe a windsock as well?)
        const forecastHeader = document.createElement("div")
        forecastHeader.className = "forecast-heading"
        
        const forecastHeading = document.createElement("h2")
        forecastHeader.appendChild(forecastHeading)

        const forecastLabel = document.createElement("label")
        forecastLabel.className = "forecast-heading-label"
        forecastHeader.appendChild(forecastLabel)

        //Dashboard (contains whatever free products we find, like daily/hourly forecasts)
        const dashboardContainer = document.createElement('div')
        dashboardContainer.id = "dashboard-container"
        
        const dailyForecast = document.createElement("div")
        dailyForecast.id = "daily-forecast"
        dashboardContainer.appendChild(dailyForecast)

        document.addEventListener("locationChange", (e) => {
            console.log(e.detail)
            this.setAttribute("data-lon", e.detail[0])
            this.setAttribute("data-lat", e.detail[1])
        })

        const style = document.createElement('style')
        style.innerText = `
        #daily-forecast {
            display: flex;
            overflow: auto;
            height: 230px;
            width: 100%;
        }

        .forecast-box {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 200px;
            min-height: 200px;
            width: 200px;
            min-width: 200px;
            border: 1px solid magenta;
            margin: 10px;
            border-radius: 10px;
        }

        .forecast-box p, .forecast-box label {
            margin: 5px;
        }

        .forecast-box label {
            font-weight: bold;
        }

        .forecast-box {
            display: flex;
            flex-direction: column;
            background-color: rgba(40,40,255,0.5)
        }

        .forecast-box:hover {
            display: flex;
            flex-direction: column;
            background-color: rgba(20,20,240,0.5)
        }

        .forecast-dialog {
            display: flex;
            flex-direction: column
        }
        `
        shadow.appendChild(style)
        shadow.appendChild(forecastHeader)
        shadow.appendChild(dashboardContainer)
        
    }


    connectedCallback() {

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if ((name === "data-lon" || name === "data-lat") && newValue) {
            if (this.getAttribute("data-lat") && this.getAttribute("data-lon")) {
                fetch(`https://api.weather.gov/points/${this.getAttribute("data-lat")},${this.getAttribute("data-lon")}`)
                    .then(res => res.json())
                    .then(pointInfo => {
                        this.shadowRoot.querySelector(".forecast-heading").firstChild.innerText = pointInfo.properties.relativeLocation.properties.city + " - " + pointInfo.properties.relativeLocation.properties.state


                        fetch(pointInfo.properties.forecast)
                            .then(res => res.json())
                            .then(forecast => {
                                const dailyForecast = this.shadowRoot.querySelector("#daily-forecast")
                                const forecastTemplate = document.querySelector("#forecast-box")
                                while (dailyForecast.lastChild) {
                                    dailyForecast.removeChild(dailyForecast.firstChild)
                                }
                                this.shadowRoot.querySelector(".forecast-heading-label").innerText = `Your 7 day outlook!`
                                forecast.properties.periods.forEach(p => {
                                    const newForecast = forecastTemplate.content.cloneNode(true)
                                    newForecast.querySelector("label").innerText = p.name
                                    newForecast.querySelector("img").src = p.icon
                                    newForecast.querySelector(".forecast-temperature").innerText = p.temperature + "°" + p.temperatureUnit
                                    newForecast.querySelector(".forecast-description").innerText = p.shortForecast
                                    newForecast.querySelector(".forecast-detailed-description").innerText = p.detailedForecast
                                    const forecastBox = newForecast.querySelector(".forecast-box")
                                    forecastBox.addEventListener("click", () => {
                                        if (forecastBox.getAttribute("data-clicked") == "true") {
                                            this.shadowRoot.querySelector("#forecast-dialog").showModal()
                                            forecastBox.setAttribute("data-clicked", false)
                                        } else {
                                            forecastBox.setAttribute("data-clicked", true)
                                        }
                                        setTimeout(() => {
                                            forecastBox.setAttribute("data-clicked", false)
                                        }, 2000)
                                    })
                                    dailyForecast.appendChild(newForecast)
                                })
                            })
                    })
            }
        }
    }
}

customElements.define("weather-dashboard", WeatherDashboard);