import { get, set } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

class WorldMap extends HTMLElement {
    static observedAttributes = ["id", "data-lat", "data-long"]

    constructor() {
        super();

        document.addEventListener("locationUpdated", (e) => {
            console.log(e)
        })
        const shadow = this.attachShadow({ mode: "open" })
        const map = document.createElement("div")
        map.style.height = "100%"
        map.style.width = "100%"
        map.id = this.getAttribute("id")
        shadow.appendChild(map)

        const infoBox = document.createElement("div")
        infoBox.id = this.getAttribute("id") + "-infobox"
        infoBox.style.position = "absolute"
        infoBox.style.top = 0
        infoBox.style.zIndex = 0
        infoBox.style.backgroundColor = "#FF00FF"
        infoBox.style.width = "100%"
        infoBox.style.height = "100px"

        shadow.appendChild(infoBox)
        this._olMapView = new ol.View({
            center: ol.proj.fromLonLat([-100, 50]),
            zoom: 2.5,
            // maxZoom: 8
        })
        this._olMap = new ol.Map({
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            target: this.shadowRoot.querySelector("#" + this.getAttribute("id")),
            view: this._olMapView
        });
        this._olMap.render()
    }

    connectedCallback() {
        fetch("https://api.weather.gov/stations?state=AZ").then(result => result.json()).then(result => {
            fetch('../../static/data/world/countries/USA/AZ.geo.json').then(res => res.json()).then(res => {
                const stateFeatures = new ol.format.GeoJSON().readFeatures(res, { featureProjection: 'EPSG:3857' })
                const stateFeaturesCollection = new ol.Collection(stateFeatures)
                const source = new ol.source.Vector({ features: stateFeaturesCollection })

                const stationFeatures = new ol.format.GeoJSON().readFeatures(result, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' })
                const stationCollection = new ol.Collection(stationFeatures)
                const stationSource = new ol.source.Vector({ features: stationCollection })

                const stationVector = new ol.layer.Vector({
                    source: stationSource,
                    style: new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 3,
                            fill: new ol.style.Fill({ color: 'rgba(0, 0, 0, .5)' })
                        }),
                    }),
                })

                const Vector = new ol.layer.Vector({
                    source: source,
                    style: new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'black',
                        }),
                    }),
                })

                this._olMap.addLayer(Vector)
                this._olMap.addLayer(stationVector)


                this._olMap.on('click', function (evt) {
                    console.log(ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326'));
                });

                this._olMap.on("pointermove", (e) => {
                    const pixel = this._olMap.getEventPixel(e.originalEvent);
                    const feature = this.shadowRoot.querySelector("#map").closest('.ol-control')
                        ? undefined
                        : this._olMap.forEachFeatureAtPixel(pixel, function (feature) {
                            return feature;
                        });

                    if (feature) {
                        const featureName = feature.get("name")
                        if (featureName && featureName !== "Arizona") {
                            this.shadowRoot.querySelector("#" + this.getAttribute("id") + "-infobox").innerText = featureName
                        } else {
                            this.shadowRoot.querySelector("#" + this.getAttribute("id") + "-infobox").innerText = ""
                        }
                    } else {
                        this.shadowRoot.querySelector("#" + this.getAttribute("id") + "-infobox").innerText = ""
                    }
                })
            })
        })
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Attribute ${name} has changed.`);
        if (name == "data-long" || name == "data-lat") {
            const long = this.getAttribute("data-long")
            const lat = this.getAttribute("data-lat")
            if (long && lat) {
                const point = new ol.geom.Point(ol.proj.fromLonLat([Number(long), Number(lat)]));
                const locationLayer = new ol.layer.Vector({
                    source: new ol.source.Vector({
                      features: [new ol.Feature(point)]
                    }),
                    style: new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 10,
                            fill: new ol.style.Fill({ color: 'rgba(255, 0, 255, .5)' })
                        }),
                    }),
                  })
                this._olMap.addLayer(locationLayer)
                this._olMapView.animate({
                    center: ol.proj.fromLonLat([Number(long), Number(lat)]),
                    zoom: 16,
                    duration: 5000
                })
            }
        }
    }
}

customElements.define("world-map", WorldMap);