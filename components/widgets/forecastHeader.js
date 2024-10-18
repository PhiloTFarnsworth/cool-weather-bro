//Location widget will display the current selected station or "???" if current station is unselected.  
//When the widget is clicked, it will open a dialog to update the user's current location
class ForecastHeader extends HTMLElement {
    static observedAttributes = ["data-city", "data-state"]

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

        const forecastHeading = document.createElement("h2")
        forecastHeading.innerText = "Waiting for Location..."
        forecastHeader.appendChild(forecastHeading)
        shadow.appendChild(forecastHeader)
    }

    connectedCallback() {
        const state = this.getAttribute("data-state")
        const city = this.getAttribute("data-city")
        if (state && city) {
            this.shadowRoot.querySelector("h2").innerText = city + ", " + state
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if ((name === "data-city" || name === "data-state") && newValue) {
            const state = this.getAttribute("data-state")
            const city = this.getAttribute("data-city")
            if (state && city) {
                this.shadowRoot.querySelector("h2").innerText = city + ", " + state
            }
        }
    }

}


customElements.define("forecast-header", ForecastHeader);