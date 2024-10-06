class PageContent extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    //Simple Div
    const pageContainer = document.createElement('div')
    pageContainer.className = "page-container"

    //Slot for content
    const contentSlot = document.createElement("slot")
    contentSlot.id = "page-slot"
    contentSlot.name = "page-slot"
    contentSlot.innerHTML = `<p>Content?</p>`

    const style = document.createElement('style')
    style.innerText = `
        .page-container {
          height: 100dvh;
          width: 100dvw;
          overflow: hidden;
        }
      `
    pageContainer.appendChild(contentSlot)
    shadow.appendChild(pageContainer)
    shadow.appendChild(style)
  }

  connectedCallback() {
    if ("geolocation" in navigator) {
      /* geolocation is available */
      console.log("geolocation")
      navigator.geolocation.getCurrentPosition((position) => {
        const location = { lat: position.coords.latitude, long: position.coords.longitude }
        localStorage.setItem("location", JSON.stringify(location))
        console.log(location)
        let slottedElements = this.shadowRoot.querySelector("#page-slot").assignedElements()
        slottedElements.forEach(el => {
          el.dataset.lat = position.coords.latitude
          el.dataset.long = position.coords.longitude
        })

      })
    } else {
      /* geolocation IS NOT available */
      console.log("no Geo!")
    }
  }
}

customElements.define("page-content", PageContent);
