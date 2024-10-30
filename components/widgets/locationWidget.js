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

        //Copy Global Styles into the shadow Dom, so we're not re-writing everything
        const globalStylesIndex = Array.from(document.styleSheets).findIndex(s => s.href.includes("static/globalStyles.css"))
        if (globalStylesIndex !== undefined) {
            const globalStylesCopy = new CSSStyleSheet()
            Array.from(document.styleSheets.item(globalStylesIndex).cssRules).forEach(c => globalStylesCopy.insertRule(c.cssText))
            shadow.adoptedStyleSheets = [globalStylesCopy];
        }

        const locationWidgetContainer = document.createElement("div")
        locationWidgetContainer.className = "location-widget-container"
        shadow.appendChild(locationWidgetContainer)

        const dialog = document.createElement("dialog")
        locationWidgetContainer.appendChild(dialog)

        const getLocationButton = document.createElement("button")
        getLocationButton.innerText = "Get Location"
        getLocationButton.addEventListener("click", () => {
            if ("geolocation" in navigator) {
                /* geolocation is available */
                navigator.geolocation.getCurrentPosition((position) => {
                    document.dispatchEvent(new CustomEvent("locationChange", { detail: [position.coords.longitude, position.coords.latitude] }))
                })
            } else {
                /* geolocation IS NOT available */
                alert("Geolocation is unavailable, please manually set location through the `change location` button")
            }
        })
        locationWidgetContainer.appendChild(getLocationButton)

        const stationChangeButton = document.createElement("button")
        stationChangeButton.innerText = "Change Location"
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

        const locationDisplay = document.createElement("p")
        locationDisplay.id = "location-display"
        stationSelectForm.appendChild(locationDisplay)

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

        const locationVector = new ol.layer.Vector({
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 12,
                    fill: new ol.style.Fill({ color: 'rgba(255, 0, 0, .75)' })
                }),
            }),
            properties: { name: "location" }
        })

        this._olMap.addLayer(locationVector)


        this._olMap.on("click", (e) => {
            const marker = new ol.Feature(new ol.geom.Point(e.coordinate));
            const source = new ol.source.Vector({ features: [marker]})

            this._olMap.getLayers().array_.forEach(layer => {
                if (layer.get('name') && layer.get('name') == 'location') {
                    layer.setSource(source)
                }
            });

            document.dispatchEvent(new CustomEvent("locationChange", {detail: new ol.proj.toLonLat(e.coordinate)}))
        })

        document.addEventListener("InvalidLocation", () => {
            this._olMap.getLayers().array_.forEach(layer => {
                if (layer.get('name') && layer.get('name') == 'location') {
                    layer.setSource(null)
                }
            })
        })

        this._olMap.render()


        //Finally save /cancel buttons
        const cancelButton = document.createElement("button")
        cancelButton.innerText = "Close"
        cancelButton.addEventListener("click", () => { dialog.close() })
        dialogContainer.appendChild(cancelButton)
    }

    connectedCallback() {

    }

    attributeChangedCallback(name, oldValue, newValue) {
        const stateAttr = this.getAttribute("data-state")
        const countyAttr = this.getAttribute("data-county")

        if (name === "data-state" && oldValue !== newValue) {
            const countySelect = this.shadowRoot.querySelector(`#county-select`)
            if (newValue && newValue !== "undefined") {
                fetch(`../../static/data/world/countries/USA/${newValue}.geo.json`)
                    .then(res => res.json())
                    .then(res => {
                        const stateFeatures = new ol.format.GeoJSON().readFeatures(res, 
                            { featureProjection: 'EPSG:3857' }
                        )
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
                this.setAttribute("data-county", "")
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
                })
            } else {
                this._olMap.getLayers().array_.forEach(layer => {
                    if (layer.get('name') && layer.get('name') == 'county-outline') {
                        layer.setSource(null)
                    }
                });
            }
        }
    }
}

customElements.define("location-widget", LocationWidget);