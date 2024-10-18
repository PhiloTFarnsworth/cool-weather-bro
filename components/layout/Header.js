class Header extends HTMLElement {
    constructor() {
        super();
        
        const shadow = this.attachShadow({ mode: "closed" });
        //Copy Global Styles into the shadow Dom, so we're not re-writing everything
        const globalStylesIndex = Array.from(document.styleSheets).findIndex(s => s.href.includes("static/globalStyles.css"))
        if (globalStylesIndex !== undefined) {
            const globalStylesCopy = new CSSStyleSheet()
            Array.from(document.styleSheets.item(globalStylesIndex).cssRules).forEach(c => globalStylesCopy.insertRule(c.cssText))
            shadow.adoptedStyleSheets = [globalStylesCopy];
        }

        //Simple Div
        const headerContainer = document.createElement('div')
        headerContainer.className = "header-container"

        const header = document.createElement('h1')
        header.innerText = "UR WEATHER"
        headerContainer.appendChild(header)

        shadow.appendChild(headerContainer)
    }
}

customElements.define("weather-header", Header);
