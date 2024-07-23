import { createControlComponent } from '@react-leaflet/core'
import L from 'leaflet';

import { getColorRGB } from './leaflet-utils';

export const LegendControl = createControlComponent(
  (props) => {
    const control = new L.Control({ position: props.position })

    control.onAdd = (map) => {

      // html and css
      const div = L.DomUtil.create("div", "leaflet-touch leaflet-bar leaflet-control text-sm bg-white sm:invisible flex justify-center items-center select-none");
      div.setAttribute("style", "width: 34px; height: 34px; z-index: 100;")

      // tooltip
      div.title = "Legend"

      const button = L.DomUtil.create("button", "w-full h-full flex justify-center items-center", div);

      // icon
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      `;

      const legend = L.DomUtil.create("div", "leaflet-touch leaflet-bar leaflet-control absolute bottom-6 -right-2 invisible sm:visible flex flex-col bg-white text-left", div);

      // hide / unhide legend on button press
      button.onclick = () => {
        legend.classList.toggle("invisible");
      };

      const title_div = L.DomUtil.create("div", "flex flex-row items-center ", legend);
      L.DomUtil.create("div", "flex-1", title_div)
      
      const table = L.DomUtil.create("table", "table-auto", legend);

      // thead
      const thead = L.DomUtil.create("thead", "", table);
      const thead_tr = L.DomUtil.create("tr", "", thead);
      const padding_th = L.DomUtil.create("th", "text-center border-b-2 border-slate-600", thead_tr);
      const aqhi_plus_th = L.DomUtil.create("th", "border-b-2 border-r-2 border-slate-600 whitespace-nowrap px-1", thead_tr);
      aqhi_plus_th.innerText = "BC AQHI+\nPM";
      L.DomUtil.create("sub", "", aqhi_plus_th).innerText = "2.5"
      L.DomUtil.create("span", "", aqhi_plus_th).innerText = " (μg m"
      L.DomUtil.create("sup", "", aqhi_plus_th).innerText = "-3"
      L.DomUtil.create("span", "", aqhi_plus_th).innerText = ")"
      const aqhi_th = L.DomUtil.create("th", "text-center border-b-2 border-slate-600 whitespace-nowrap px-2", thead_tr);
      aqhi_th.innerText = "National\nAQHI"

      // To prevent scroll and click affecting map
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      
      const values = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

      for (let i = values.length; i >= 0; i--) {

        // tbody
        const tbody = L.DomUtil.create("tbody", "", table);
        const tbody_tr = L.DomUtil.create("tr", "", tbody);

        // color
        const color = L.DomUtil.create("td", `float-left`, tbody_tr);
        color.setAttribute("style", `width: 22px; height: 22px; background: ${getColorRGB(i)}`);


        // AQHI+ value
        const value = L.DomUtil.create("td", `px-4 whitespace-nowrap border-r-2 border-slate-600`, tbody_tr);
        
        var from = values[i-1];
        var to = values[i];

        if (i === 0)
          value.innerText = "No Data";
        else if (i === 11)
          value.innerText = "[" + from.toString() + " - " + "inf)";
        else
          value.innerText = "[" +from.toString() + " - " + (to ? to.toString() : "inf") + ")";

        // AQHI value
        const aqhi_value = L.DomUtil.create("td", "px-4", tbody_tr)
        if (i === 0)
          aqhi_value.innerHTML = "-"
        else if (i === 11)
          aqhi_value.innerHTML = "10+"
        else
          aqhi_value.innerHTML = i.toString()
    
      }
      return div;
    }

    return control
  }
)