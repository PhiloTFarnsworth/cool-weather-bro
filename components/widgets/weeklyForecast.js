//Location widget will display the current selected station or "???" if current station is unselected.  
//When the widget is clicked, it will open a dialog to update the user's current location
class WeeklyForecast extends HTMLElement {
    static observedAttributes = ["data-forecast-url"]

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

        //Header should have name of station (maybe a windsock as well?)
        const forecastHeader = document.createElement("div")
        forecastHeader.className = "forecast-heading"

        const forecastHeading = document.createElement("h3")
        forecastHeader.appendChild(forecastHeading)
        forecastHeading.innerText = "Your 7-day Outlook"

        //Dashboard (contains whatever free products we find, like daily/hourly forecasts)
        const dashboardContainer = document.createElement('div')
        dashboardContainer.id = "dashboard-container"

        const dailyForecast = document.createElement("div")
        dailyForecast.id = "daily-forecast"
        dashboardContainer.appendChild(dailyForecast)

        const style = document.createElement('style')
        style.innerText = `
        #daily-forecast {
            display: flex;
            overflow: auto;
            height: 320px;
            width: 100%;
        }

        .forecast-box {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 280px;
            min-height: 280px;
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

        .forecast-box[data-active="true"] {
            background-color: rgba(255, 0, 255, 1)
            width: 320px;
            min-width: 320px;
        }


        .forecast-detailed-description {
            max-height: 100px;
            height: 100px;
            overflow: auto;
            padding-right: 10px;
        }
        `
        shadow.appendChild(style)
        shadow.appendChild(forecastHeader)
        shadow.appendChild(dashboardContainer)

    }


    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "data-forecast-url" && newValue) {
            fetch(newValue)
                .then(res => res.json())
                .then(forecast => {
                    const dailyForecast = this.shadowRoot.querySelector("#daily-forecast")
                    const forecastTemplate = document.querySelector("#forecast-box")
                    while (dailyForecast.lastChild) {
                        dailyForecast.removeChild(dailyForecast.firstChild)
                    }
                    forecast.properties.periods.forEach((p, i) => {
                        const newForecast = forecastTemplate.content.cloneNode(true)
                        newForecast.querySelector("label").innerText = p.name
                        newForecast.querySelector("img").src = p.icon
                        newForecast.querySelector(".forecast-temperature").innerText = p.temperature + "°" + p.temperatureUnit
                        newForecast.querySelector(".forecast-description").innerText = p.shortForecast
                        newForecast.querySelector(".forecast-detailed-description").innerText = p.detailedForecast
                        const forecastBox = newForecast.querySelector(".forecast-box")
                        if (i === 0 && !forecastBox.getAttribute("data-active")) {
                            forecastBox.setAttribute("data-active", "true")
                            document.dispatchEvent(new CustomEvent("forecastChange", {detail: [p.startTime, p.name]}))
                        }
                        forecastBox.addEventListener("click", () => {
                            forecastBox.scrollIntoView({inline: "center"})
                            const siblings = dailyForecast.childNodes
                            siblings.forEach(s => {
                                if (s.nodeName !== "#text") {
                                    if (s === forecastBox) {
                                        s.setAttribute("data-active", "true")
                                    } else {
                                        s.setAttribute("data-active", "false")
                                    }
                                }
                            })
                            document.dispatchEvent(new CustomEvent("forecastChange", {detail: [p.startTime, p.name]}))
                        })
                        dailyForecast.appendChild(newForecast)
                    })
                    
                })
        }
    }
}

customElements.define("weekly-forecast", WeeklyForecast);