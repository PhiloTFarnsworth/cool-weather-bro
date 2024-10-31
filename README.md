# Cool Weather, Bro
## Ad-free and Simple Weather

[Why read the readme?](https://philotfarnsworth.github.io/cool-weather-bro/)

CWB is a free weather site built using APIs from Weather.gov, as well as several technologies which I haven't had the pleasure of working with professionally (yet).  Utilizing maps and web GIS technology from [Open Layers](https://openlayers.org/), charts from [Chart JS](https://www.chartjs.org/docs/latest/) and [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components), CWB is well featured yet goes without bundlers or build steps beyond a simple github pages deployment.  

### Post-Mortem
I need a break from reading weather.gov api documentation in my spare time.

### Tech Talk
#### Web Components
This was honestly pretty tricky to quite get the hang of.  While the benefits of Web Components are the separation of concerns and isolation of styling through defining items in the shadow DOM, I found myself gravitating towards incorporating global styles through adopted style sheets (Eventually moving most styling there).  Beyond styling, I think it took some time to figure out how I wanted to pass data in between components, and what attributes would be helpful for allowing these components to stand alone in possible future iterations.  Definitely curious about Lit, as maybe the difficulties encountered here are ameliorated by the guiding hand of that light framework.

#### Chart JS
While I've worked with Plotly and Apache eCharts professionally, I have not had a chance to mess around with Chart JS yet.  I'm pretty impressed with the light weight of the library when looking at the functionality.  There are a few painful areas (custom tooltips come to mind), but overall a very interesting option, especially in contexts where performance is critical (but you still need a chart or two).

#### Open Layers
While I think the docs could use a bit of work (Not enough examples!), I found open layers be pretty slick.  Incorporating any GEOJSON is really trivial, and the wide range of accepted formats makes this quite a powerful tool.  