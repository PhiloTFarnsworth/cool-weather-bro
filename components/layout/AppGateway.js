// This file controls access to the weather "dashboard".  When a location is not set, 
// we render the state/county/station select using open layers, otherwise we render 
// the slotted item (dashboard)

class AppGateway extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });

        //Store these
        this._state = ""
        this._county = ""
        this._station = ""

        const mapSlot = document.createElement("slot")
        mapSlot.name = "location-map"
        mapSlot.innerHTML = "<p>Location Map here</p>"

        const dashboardSlot = document.createElement("slot")
        dashboardSlot.name = "main-dashboard"
        dashboardSlot.innerHTML = "<p>Dashboard Here</p>"
        shadow.appendChild(mapSlot)
        shadow.appendChild(dashboardSlot)

    }


    connectedCallback() {
        //Find out if we have a location cached
        const cachedCoords = localStorage.getItem("location")
        if (cachedCoords) {
            //Use cached coords

        } else {
            if ("geolocation" in navigator) {
                /* geolocation is available */
                console.log("geolocation")
                navigator.geolocation.getCurrentPosition((position) => {
                    const location = { lat: position.coords.latitude, long: position.coords.longitude }
                    localStorage.setItem("location", JSON.stringify(location))
                    console.log(location)
                    // let slottedElements = contentSlot.assignedElements()
                    // slottedElements.forEach(el => {
                    //   el.dataset.lat = position.coords.latitude
                    //   el.dataset.long = position.coords.longitude
                    // })
    
                })
            } else {
                /* geolocation IS NOT available */
                console.log("no Geo!")
            }
        }
    }
}