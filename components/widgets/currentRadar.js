// https://radar.weather.gov/ridge/standard/KABX_loop.gif

class CurrentRadar extends HTMLElement {
    static observedAttributes = ["data-radar"]

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

        const radarContainer = document.createElement("div")
        radarContainer.className = "radar-container"

        const radarLink = document.createElement("a")
        radarLink.href = "https://radar.weather.gov/"
        radarLink.innerText = "Get Fancy Free Radar Here!"
        shadow.appendChild(radarContainer)
        shadow.appendChild(radarLink)

        document.addEventListener("radar-changed", (e) => {
            this.setAttribute("data-radar", e.detail)
        })
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "data-radar" && newValue) {
            const container = this.shadowRoot.querySelector("div")
            while (container.firstChild) {
                container.removeChild(container.lastChild)
            }
            const radar = document.createElement("img")
            radar.alt = "Radar Loop for " + newValue
            radar.src = `https://radar.weather.gov/ridge/standard/${newValue}_loop.gif`
            container.appendChild(radar)
        }
    }

}

customElements.define("current-radar", CurrentRadar);
