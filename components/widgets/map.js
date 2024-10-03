class WorldMap extends HTMLElement {
    static observedAttributes = ["id"]

    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" })
        const map = document.createElement("div")
        map.style.height = "100%"
        map.style.width = "100%"
        map.id = this.getAttribute("id")
        shadow.appendChild(map)
    }

    connectedCallback() {
        fetch("https://api.weather.gov/stations?state=AZ").then(result => result.json()).then(result => {
            console.log(result)
            fetch('../../static/data/world/countries/USA/AZ.geo.json').then(res => res.json()).then(res => {
                console.log(res)

                const stateFeatures = new ol.format.GeoJSON().readFeatures(res, { featureProjection: 'EPSG:3857' })
                const stateFeaturesCollection = new ol.Collection(stateFeatures)
                const source = new ol.source.Vector({ features: stateFeaturesCollection })

                const stationFeatures = new ol.format.GeoJSON().readFeatures(result, {dataProjection: 'EPSG:4326',  featureProjection: 'EPSG:3857' })
                const stationCollection = new ol.Collection(stationFeatures)
                const stationSource = new ol.source.Vector({ features: stationCollection })
                console.log(stationSource)
                const stationVector = new ol.layer.Vector({
                    source: stationSource,
                    style: new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 3,
                            fill: new ol.style.Fill({color: 'black'})
                          })
                    }),
                })

                console.log(stationVector)

                const Vector = new ol.layer.Vector({
                    source: source,
                    style: new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'red',
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'white',
                        }),
                    }),
                })

                const map = new ol.Map({
                    target: this.shadowRoot.querySelector("#" + this.getAttribute("id")),
                    layers: [
                        Vector,
                        stationVector
                    ],
                    view: new ol.View({
                        center: ol.extent.getCenter(source.getExtent()),
                        zoom: 6,
                        // minZoom: 6,
                        // maxZoom: 6,
                        extent: source.getExtent(),
                        // projection: 'EPSG:4326'
                    })
                });

                map.on('click', function (evt) {
                    console.log(ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326'));
                });

                map.render();
            })
        })
    }

    adoptedCallback() {
        console.log("Custom element moved to new page.");
    }
}

customElements.define("world-map", WorldMap);