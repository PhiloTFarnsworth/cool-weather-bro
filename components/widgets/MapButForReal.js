import { get, set } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

class map extends HTMLElement {
    static observedAttributes = ["id", "data-lat", "data-long", "data-layers"]

    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" })
        const map = document.createElement("div")
        map.style.height = "100%"
        map.style.width = "100%"
        map.id = this.getAttribute("id")
        shadow.appendChild(map)

        this._olMapView = new ol.View({
            center: ol.proj.fromLonLat([-100, 50]),
            zoom: 2.5,
            minZoom: 1,
            maxZoom: 12
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
        
    }
}