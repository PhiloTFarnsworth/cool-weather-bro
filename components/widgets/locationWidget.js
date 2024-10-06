import { get, set } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

//Location widget will display the current selected station or "???" if current station is unselected.  
//When the widget is clicked, it will open a dialog to update the user's current location
class LocationWidget extends HTMLElement {
    static observedAttributes = ["data-state", "data-county", "data-station"]

    constructor() {
        super();
        const stateAttr = this.getAttribute("data-state")
        const countyAttr = this.getAttribute("data-county")
        const stationAttr = this.getAttribute("data-station")


        const shadow = this.attachShadow({ mode: "open" })

        const locationWidgetContainer = document.createElement("div")
        locationWidgetContainer.className = "location-widget-container"
        shadow.appendChild(locationWidgetContainer)

        const stationLabel = document.createElement("label")
        stationLabel.id = "station-label"
        stationLabel.innerText = `Station: ${stationAttr ? stationAttr : "???"}`
        locationWidgetContainer.appendChild(stationLabel)

        const dialog = document.createElement("dialog")
        locationWidgetContainer.appendChild(dialog)

        const stationChangeButton = document.createElement("button")
        stationChangeButton.innerText = "Change"
        stationChangeButton.addEventListener("click", () => {
            dialog.showModal()
        })
        locationWidgetContainer.appendChild(stationChangeButton)

        const dialogContainer = document.createElement("div")
        dialogContainer.className = "dialog-container"
        dialog.appendChild(dialogContainer)

        const stationSelectForm = document.createElement("form")
        dialogContainer.appendChild(stationSelectForm)

        const stateSelectLabel = document.createElement("label")
        stateSelectLabel.innerText = "Select State"
        stationSelectForm.appendChild(stateSelectLabel)

        const stateSelect = document.createElement("select")
        stateSelect.id = "state-select"
        stateSelect.addEventListener("change", (e) => {
            this.setAttribute("data-state", e.target.value)
        })
        stateSelectLabel.appendChild(stateSelect)

        const chooseOption = document.createElement("option")
        chooseOption.value = "undefined"
        chooseOption.innerText = "Choose a State"
        stateSelect.appendChild(chooseOption)

        get("states").then(res => {
            res.filter(r => r[0] === "state").forEach((r, i) => {
                const stateOption = document.createElement("option")
                stateOption.value = r[1]
                stateOption.innerText = r[1]
                if (r[1] === stateAttr) {
                    stateSelect.selectedIndex = i
                }
                stateSelect.appendChild(stateOption)
            })
        })

        const countySelectLabel = document.createElement("label")
        countySelectLabel.innerText = "Select County"
        stationSelectForm.appendChild(countySelectLabel)

        const countySelect = document.createElement("select")
        countySelect.addEventListener("change", (e) => {
            this.setAttribute("data-county", e.target.value)
        })
        countySelect.id = "county-select"
        countySelect.disabled = true
        countySelectLabel.appendChild(countySelect)

        const stationSelectLabel = document.createElement("label")
        stationSelectLabel.innerText = "Select Station"
        stationSelectForm.appendChild(stationSelectLabel)

        const stationSelect = document.createElement("select")
        stationSelect.addEventListener("change", (e) => {
            this.setAttribute("data-station", e.target.value)
        })
        stationSelect.id = "station-select"
        stationSelect.disabled = true
        stationSelectLabel.append(stationSelect)

        // Need the data from the station select to populate map, so need to interrupt with some map stuff
        const mapComboContainer = document.createElement("div")
        mapComboContainer.id = "map-combo-container"
        dialogContainer.appendChild(mapComboContainer)

        const map = document.createElement("div")
        map.id = "location-map"
        mapComboContainer.appendChild(map)

        const mapInfoBar = document.createElement("div")
        mapInfoBar.id = "map-info-bar"
        mapComboContainer.appendChild(mapInfoBar)

        this._olMapView = new ol.View({
            center: ol.proj.fromLonLat([-100, 40]),
            zoom: 3,
            maxZoom: 12,
            minZoom: 3,
        })

        this._olMap = new ol.Map({
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            target: this.shadowRoot.querySelector("#location-map"),
            view: this._olMapView
        });

        const stateVector = new ol.layer.Vector({
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                }),
            }),
            properties: { name: "state-outline" }
        })

        this._olMap.addLayer(stateVector)

        const countyVector = new ol.layer.Vector({
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'black',
                }),
            }),
            properties: { name: "county-outline" }
        })
        this._olMap.addLayer(countyVector)

        const stationsVector = new ol.layer.Vector({
            style: function (feature, resolution) {
                const selectedStation = document.querySelector("#location-widget").getAttribute("data-station")
                return feature.get('name') === selectedStation ? new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 12,
                        fill: new ol.style.Fill({ color: 'rgba(255, 0, 255, .5)' })
                    }),
                }) : new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 10,
                        fill: new ol.style.Fill({ color: 'rgba(0, 0, 0, .5)' })
                    }),
                })
            },
            properties: { name: "stations" }
        })

        this._olMap.addLayer(stationsVector)

        this._olMap.on("pointermove", (e) => {

            const pixel = this._olMap.getEventPixel(e.originalEvent);
            const feature = this.shadowRoot.querySelector("#location-map").closest('.ol-control')
                ? undefined
                : this._olMap.forEachFeatureAtPixel(pixel, function (feature) {
                    return feature;
                });

            if (feature && feature.get("@type")) {
                const featureName = feature.get("name")
                if (featureName) {
                    this.shadowRoot.querySelector("#map-info-bar").innerText = featureName
                }
            }
        })

        this._olMap.on("click", (e) => {

            const pixel = this._olMap.getEventPixel(e.originalEvent);
            const feature = this.shadowRoot.querySelector("#location-map").closest('.ol-control')
                ? undefined
                : this._olMap.forEachFeatureAtPixel(pixel, function (feature) {
                    return feature;
                });

            if (feature && feature.get("@type")) {
                const featureName = feature.get("name")
                if (featureName) {
                    this.setAttribute("data-station", featureName)
                }
            }
        })

        this._olMap.render()


        //Finally save /cancel buttons
        const cancelButton = document.createElement("button")
        cancelButton.innerText = "Close"
        cancelButton.addEventListener("click", () => { dialog.close() })
        dialogContainer.appendChild(cancelButton)


        const style = document.createElement('style')
        style.innerText = `
          dialog {
            border: 1px solid black;
            border-radius: 5px;
            padding: 20px;
            width: calc(100% - 100px);
            height: calc(100% - 100px);
            min-height: 600px;
            position: absolute;
            top: 20px;
          }

          .dialog-container {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%
          }

          dialog button {
            padding: 10px;
            margin: 5px
          }

          dialog label {
            margin: 5px;
          }

          form {
            display: flex;
            flex-direction: column;
          }

          label {
            display: flex;
            flex-direction: column;
          }

          #map-info-bar {
            position: absolute;
            top: 0;
            backgroundColor: blue;
            height: 30px;
            width: 100%;
          }

          #map-combo-container{
            position: relative;
            min-height: 300px;
            min-width: 300px;
            height: calc(100% - 200px);
            width: 100%;
          }
          
          #location-map {
            min-height: 300px;
            min-width: 300px;
            height: 100%;
            width: 100%;
          }

          .ol-overlaycontainer-stopevent {
            display: none;
          }

          .location-widget-container {
            display: flex;

          }
        `
        shadow.appendChild(style)
    }

    connectedCallback() {

    }

    attributeChangedCallback(name, oldValue, newValue) {
        const stateAttr = this.getAttribute("data-state")
        const countyAttr = this.getAttribute("data-county")
        const stationAttr = this.getAttribute("data-station")

        if (name === "data-state" && oldValue !== newValue) {
            const countySelect = this.shadowRoot.querySelector(`#county-select`)
            if (newValue && newValue !== "undefined") {
                fetch(`../../static/data/world/countries/USA/${newValue}.geo.json`)
                    .then(res => res.json())
                    .then(res => {
                        const stateFeatures = new ol.format.GeoJSON().readFeatures(res, { featureProjection: 'EPSG:3857' })
                        const stateFeaturesCollection = new ol.Collection(stateFeatures)
                        const source = new ol.source.Vector({ features: stateFeaturesCollection })

                        this._olMap.getLayers().array_.forEach(layer => {
                            if (layer.get('name') && layer.get('name') == 'state-outline') {
                                layer.setSource(source)
                            }
                        });
                    })

                get("counties").then(res => {
                    //Clear old counties
                    while (countySelect.firstChild) {
                        countySelect.removeChild(countySelect.lastChild)
                    }

                    let countySelection = false
                    res.filter(r => r.state === stateAttr).forEach((r, i) => {
                        const countyOption = document.createElement("option")
                        countyOption.value = r.name
                        countyOption.innerText = r.name
                        if (r.name === countyAttr) {
                            countySelect.selectedIndex = i
                            countySelection = true
                        }
                        countySelect.appendChild(countyOption)
                    })

                    if (!countySelection) {
                        countySelect.selectedIndex = 0
                        this.setAttribute("data-county", countySelect.firstChild.value)
                    }
                    countySelect.disabled = false
                })
            } else {
                countySelect.disabled = true
                const stationSelect = this.shadowRoot.querySelector(`#station-select`)
                stationSelect.disabled = true
                this.setAttribute("data-county", "")
                this.setAttribute("data-station", "")
                this.setAttribute("data-state", "")
                this._olMap.getLayers().array_.forEach(layer => {
                    if (layer.get('name') && layer.get('name') == 'state-outline') {
                        layer.setSource(null)
                    }
                });
            }
        }

        if (name === "data-county" && oldValue !== newValue) {
            if (newValue && newValue !== "undefined") {
                get("counties").then(counties => {
                    const thisCounty = counties.find(r => r.name === newValue && r.state === stateAttr)
                    fetch(thisCounty.url)
                        .then(res => res.json())
                        .then(res => {
                            const countyFeatures = new ol.format.GeoJSON().readFeatures(res, { featureProjection: 'EPSG:3857' })
                            const countyFeaturesCollection = new ol.Collection(countyFeatures)
                            const source = new ol.source.Vector({ features: countyFeaturesCollection })
                            this._olMap.getLayers().array_.forEach(layer => {
                                if (layer.get('name') && layer.get('name') == 'county-outline') {
                                    layer.setSource(source)
                                }
                            });

                            this._olMapView.animate({
                                center: ol.extent.getCenter(source.getExtent()),
                                zoom: 7,
                                duration: 1000
                            })
                        })
                    fetch(`https://api.weather.gov/stations/?state=${stateAttr}`)
                        .then(res => res.json())
                        .then(res => {

                            const countyStations = res.features.filter(f => f.properties.county === thisCounty.url)
                            const observationStations = countyStations.filter(c => res.observationStations.includes(c.id))
                            set("stations", observationStations)
                            //Observation stations are what we need to populate a dashboard
                            const didSelect = false
                            const stationSelect = this.shadowRoot.querySelector(`#station-select`)
                            //Clear old stations
                            while (stationSelect.firstChild) {
                                stationSelect.removeChild(stationSelect.lastChild)
                            }
                            observationStations.forEach((o, i) => {
                                const stationOption = document.createElement("option")
                                stationOption.value = o.properties.name
                                stationOption.innerText = o.properties.name
                                if (o[1] === stationAttr) {
                                    stationSelect.selectedIndex = i
                                    didSelect = true
                                }
                                stationSelect.appendChild(stationOption)
                                stationSelect.disabled = false
                            })

                            if (!didSelect && observationStations.length > 0) {
                                this.setAttribute("data-station", stationSelect.firstChild.value)
                                stationSelect.selectedIndex = 0
                            }

                            const fakeJson = { type: "FeatureCollection", features: observationStations }

                            const stationFeatures = new ol.format.GeoJSON().readFeatures(fakeJson, { featureProjection: 'EPSG:3857' })
                            const stationFeaturesCollection = new ol.Collection(stationFeatures)
                            const source = new ol.source.Vector({ features: stationFeaturesCollection })

                            this._olMap.getLayers().array_.forEach(layer => {
                                if (layer.get('name') && layer.get('name') == 'stations') {
                                    layer.setSource(source)
                                }
                            });
                        })
                })
            } else {
                this._olMap.getLayers().array_.forEach(layer => {
                    if (layer.get('name') && (layer.get('name') == 'stations') || layer.get('name') == 'county-outline') {
                        layer.setSource(null)
                    }
                });
            }
        }

        if (name === "data-station" && oldValue !== newValue) {
            get("stations").then(res => {
                document.dispatchEvent(new CustomEvent("stationChange", {detail: res.find(r => newValue === r.properties.name)}))
            })
            //Updates style function in the layer, so it looks for the new selected value
            this._olMap.getLayers().array_.forEach(layer => {
                if (layer.get('name') && layer.get('name') == 'stations') {
                    layer.changed()
                }
            });
            this.shadowRoot.querySelector("#station-label").innerText = newValue
            const stationSelect = this.shadowRoot.querySelector(`#station-select`)
            const selectables = stationSelect.childNodes
            let selectIndex = 0
            selectables.forEach((c, i) => {
                if (c.value === newValue) {
                    selectIndex = i
                }
            })
            stationSelect.selectedIndex = selectIndex
        }
    }
}

customElements.define("location-widget", LocationWidget);