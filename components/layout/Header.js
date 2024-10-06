class Header extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: "closed" });


        //Simple Div
        const headerContainer = document.createElement('div')
        headerContainer.className = "header-container"

        const header = document.createElement('h1')
        header.innerText = "UR WEATHER - "
        headerContainer.appendChild(header)

        const locationSlot = document.createElement("slot")
        locationSlot.innerHTML = `<span>Loading...</span>`
        locationSlot.name = "location-slot"
        headerContainer.appendChild(locationSlot)


        const style = document.createElement('style')
        style.innerText = `
          .header-container {
            width: 100%;
            height: 100px;
            background-color: #5555FF;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          h1 {
            color: white;
            padding: 5px;
            margin: 0;
            text-align: center;
            width: 100%;
          }
        `

        shadow.appendChild(style)
        shadow.appendChild(headerContainer)
    }
}

customElements.define("weather-header", Header);
