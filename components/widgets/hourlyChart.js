import 'https://cdn.jsdelivr.net/npm/chart.js';

//Location widget will display the current selected station or "???" if current station is unselected.  
//When the widget is clicked, it will open a dialog to update the user's current location
class HourlyChart extends HTMLElement {
    static observedAttributes = ["data-hourly-url"]

    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });

        const chartContainer = document.createElement("div")
        chartContainer.id = "chart-container"

        const chartCanvas = document.createElement("canvas")
        chartCanvas.id = "chart-canvas"

        chartContainer.appendChild(chartCanvas)
        shadow.appendChild(chartContainer)
    }

    connectedCallback() {
        const ctx = this.shadowRoot.getElementById('chart-canvas');
        console.log(ctx)
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                datasets: [{
                    label: '# of Votes',
                    data: [12, 19, 3, 5, 2, 3],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "data-hourly-url" && newValue) {
            fetch(this.getAttribute("data-hourly-url"))
                .then(res => res.json())
                .then(res => {
                    
                })
        }
    }
}

customElements.define("hourly-chart", HourlyChart);