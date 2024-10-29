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

                        forecastBox.addEventListener("focusin", () => {
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
                .catch(error => {
                    console.error(error)
                    document.dispatchEvent(new CustomEvent("InvalidLocation"))
                })
        }
    }
}

customElements.define("weekly-forecast", WeeklyForecast);