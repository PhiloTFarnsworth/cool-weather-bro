import 'https://cdn.jsdelivr.net/npm/chart.js';

class WeatherDetails extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        
    }
}

customElements.define("weather-details", WeatherDetails);
