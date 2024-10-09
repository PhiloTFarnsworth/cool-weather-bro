import { get, set } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

//Location widget will display the current selected station or "???" if current station is unselected.  
//When the widget is clicked, it will open a dialog to update the user's current location
class WeatherDashboard extends HTMLElement {
    static observedAttributes = ["data-station-id"]

    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });
        const dashboardContainer = document.createElement('div')
        dashboardContainer.id = "dashboard-container"
        shadow.appendChild(dashboardContainer)
        document.addEventListener("stationChange", (e) => {
            console.log(e)
            console.log(e.detail.properties.stationIdentifier)
            this.setAttribute("data-station-id", e.detail.properties.stationIdentifier)
        })
    }


    connectedCallback() {

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "data-station-id" && newValue) {

        }
    }

}

customElements.define("weather-dashboard", WeatherDashboard);