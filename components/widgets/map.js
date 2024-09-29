class WorldMap extends HTMLElement {
    static observedAttributes = ["id"]

    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" })
        const map = document.createElement("div")
        map.id = this.getAttribute("id")
        shadow.appendChild(map)
    }

    connectedCallback() {

        fetch('../../static/data/lower48.json').then(res => res.json()).then(res => {
            const source = new ol.source.Vector({
                format: new ol.format.GeoJSON({ projection: 'EPSG:3857', }),
                url: '../../static/data/lower48.json',
            })
            const extent = ol.proj.transformExtent(new ol.source.Vector({
                features: new ol.format.GeoJSON().readFeatures(res)
              }).getExtent(), 'EPSG:4326', 'EPSG:3857');
              console.log(extent)
            const map = new ol.Map({
                target: this.shadowRoot.querySelector("#" + this.getAttribute("id")),
                layers: [
                    new ol.layer.Vector({
                        source: source
                    }),
                ],
                view: new ol.View({
                    center: ol.extent.getCenter(extent),
                    zoom: 3,
                    minZoom: 3,
                    extent: extent
                }),
            });
    
    
    
            map.on('click', function (evt) {
                console.log(ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326'));
            });
    
    
            map.render();
        })


    }


    adoptedCallback() {
        console.log("Custom element moved to new page.");
    }
}

customElements.define("world-map", WorldMap);