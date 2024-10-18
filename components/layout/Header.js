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

        const style = document.createElement('style')
        style.innerText = `
          .header-container {
            width: 100%;
            background-color: #5555FF;
          }

          h1 {
            color: white;
            padding: 5px;
            text-align: center;
            width: 100%;
            height: 100%;
          }
        `

        shadow.appendChild(style)
        shadow.appendChild(headerContainer)
    }
}

customElements.define("weather-header", Header);
