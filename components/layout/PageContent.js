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
          width: calc(100% - 40px);
          height: calc(100% - 40px);
          overflow: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }
      `
    pageContainer.appendChild(contentSlot)
    shadow.appendChild(pageContainer)
    shadow.appendChild(style)
  }
}

customElements.define("page-content", PageContent);
