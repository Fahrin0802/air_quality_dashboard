import { createControlComponent } from '@react-leaflet/core'
import L from 'leaflet';

import { getColor, getColorRGB } from './leaflet-utils';

export const SensorLegendControl = createControlComponent(
  (props) => {
    const control = new L.Control({ position: props.position })

    control.onAdd = (map) => {

      // html and css
      const div = L.DomUtil.create("div", "leaflet-touch leaflet-bar leaflet-control text-sm bg-white flex-col justify-center items-center select-none");
      div.setAttribute("style", "width: 160px; height: 100px; z-index: 100;")

      // tooltip
      div.title = "Sensor Legend"

      // legend title
      const title = L.DomUtil.create("h1", "text-sm font-bold whitespace-nowrap", div);
      title.innerText = "Sensor Type";
      L.DomUtil.create("hr", "border-t border-gray-300 mb-1", div);
      
      // To prevent scroll and click affecting map
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      
      const values = [0]

      const legend = L.DomUtil.create("div", "flex flex-col", div)

      const purpleair_div = L.DomUtil.create("div", "m-1 flex flex-row items-center", legend)
      const purpleair = L.DomUtil.create("div", `rounded-full flex items-center justify-center font-bold text-white border-2 border-black ${getColor(0)}`, purpleair_div)
      purpleair.setAttribute("style", "width: 25px; height: 25px;")
      const purpleair_text = L.DomUtil.create("h1", "text-sm pl-2", purpleair_div)
      purpleair_text.innerText = "PurpleAir Sensors"

      const airnow_div = L.DomUtil.create("div", "m-1 flex flex-row items-center", legend)
      const airnow = L.DomUtil.create("div", `w-30 h-30 aspect-w-1 aspect-h-1 border-2 border-black flex items-center justify-center text-white ${getColor(0)}`, airnow_div)
      airnow.setAttribute("style", "width: 25px; height: 25px;")
      const airnow_text = L.DomUtil.create("h1", "text-sm pl-2", airnow_div)
      airnow_text.innerText = "Agency Monitors"

      return div;
    }

    return control
  }
)