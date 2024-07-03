// This component covers Functional Requirements 14, 15
import { createControlComponent } from '@react-leaflet/core'
import L from 'leaflet';

export default function QueryControl({props, data}: { props: L.ControlOptions; data: {[key: string]: [any, L.Marker]}}) {

  const ControlComponent = createControlComponent(
    (props) => {
      const control = new L.Control({ position: props.position });
  
      control.onAdd = (map) => {
  
        // html and css
        const div = L.DomUtil.create("div", "leaflet-touch leaflet-bar leaflet-control text-sm bg-white flex justify-center items-center select-none");
        div.setAttribute("style", "width: 34px; height: 34px; z-index: 100;")
  
        const button = L.DomUtil.create("button", "w-full h-full flex justify-center items-center", div);
        
        // To prevent scroll and click affecting map
        L.DomEvent.disableClickPropagation(button);
        L.DomEvent.disableScrollPropagation(button);
  
        // icon
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        `;
  
        const control_div = L.DomUtil.create("div", "leaflet-touch leaflet-bar leaflet-control absolute top-7 -left-2.5 flex flex-col bg-white p-2 pr-5 text-left hidden max-h-80", div);
        L.DomEvent.disableClickPropagation(control_div);
        L.DomEvent.disableScrollPropagation(control_div);
  
  
        const value = L.DomUtil.create("h1", "", control_div);
        const slider = L.DomUtil.create("input", "h-full w-full", control_div);
        slider.setAttribute('type', 'range');
        slider.setAttribute('min', '1');
        slider.setAttribute('max', '11');
        slider.setAttribute('value', '1');
        slider.setAttribute('class', 'slider');
        L.DomUtil.create("br", "", control_div);
        value.innerText = 'BC AQHI+: ' + slider.value;
        slider.oninput = () => {
          value.innerText = 'BC AQHI+: ' + slider.value + (slider.value === '11' ? '+' : '');
        }

        // min max button group
        const button_group_div = L.DomUtil.create("div", "inline-flex rounded-md shadow-sm py-2 whitespace-nowrap", control_div);
        button_group_div.setAttribute("role", "group");
        const maximum_button = L.DomUtil.create("button", "px-2 py-1 w-20 text-sm font-medium border border-black rounded-s-lg hover:border-blue-800", button_group_div);
        maximum_button.innerText = "maximum"
        // default is max
        maximum_button.classList.toggle('bg-gray-900');
        maximum_button.classList.toggle('text-white');
        maximum_button.disabled = true;
        L.DomEvent.disableClickPropagation(maximum_button);

        const minimum_button = L.DomUtil.create("button", "px-2 py-1 w-20 text-sm border border-black rounded-e-lg hover:border-blue-800", button_group_div);
        minimum_button.innerText = "minimum"
        L.DomEvent.disableClickPropagation(minimum_button);

        // FR15 - Query.Sensor.Maximum - The system shall allow the user to query sensors with a maximum BC AQHI+ value.
        maximum_button.onclick = () => {
          if (minimum_button.disabled === true) {
            minimum_button.classList.toggle('bg-gray-900')
            minimum_button.classList.toggle('text-white')
          }
          maximum_button.classList.toggle('bg-gray-900');
          maximum_button.classList.toggle('text-white');
          maximum_button.disabled = true;
          minimum_button.disabled = false;
          slider.dispatchEvent(new Event('change', { bubbles: true }))
        }
        // FR14 - Query.Sensor.Minimum - The system shall allow the user to query sensors with a minimum BC AQHI+ value.
        minimum_button.onclick = () => {
          if (maximum_button.disabled === true) {
            maximum_button.classList.toggle('bg-gray-900');
            maximum_button.classList.toggle('text-white');
          }
          minimum_button.classList.toggle('bg-gray-900');
          minimum_button.classList.toggle('text-white');
          minimum_button.disabled = true;
          maximum_button.disabled = false;
          slider.dispatchEvent(new Event('change', { bubbles: true }))
        }

        let is_map_view = true;
        const mapview_button = L.DomUtil.create("button", "px-2 py-1 mb-2 text-sm font-medium border border-black rounded-lg hover:border-blue-800 max-w-32 whitespace-nowrap", control_div);
        mapview_button.innerText = "Map View";
        // default is to current map view
        mapview_button.classList.toggle('bg-gray-900');
        mapview_button.classList.toggle('text-white');
        mapview_button.onclick = () => {
          mapview_button.classList.toggle('bg-gray-900');
          mapview_button.classList.toggle('text-white');
          is_map_view = !is_map_view;
          slider.dispatchEvent(new Event('change', { bubbles: true }))
        }

        const query_div = L.DomUtil.create("div", "flex flex-col overflow-y-auto", control_div)

        let query: {[key: string]: HTMLElement} = {}

        
        // recalculte min and max on map span or zoom end
        map.addEventListener('moveend', () => {
          slider.dispatchEvent(new Event('change', { bubbles: true }))
        });
        
        slider.onchange = () => {

          const is_max_query = (maximum_button.disabled ? true: false)
          
          Object.values(query).forEach((element) => {
            element.remove();
          });
          query = {}
          // sort from largest to smallest AQHI+
          Object.values(data).sort(([a_sensor, a_marker], [b_sensor, b_marker]) => b_sensor["pm2.5_60minute"]-a_sensor["pm2.5_60minute"]).forEach(([sensor, marker]) => {
            
            // only consider markers in the current map bounds
            if (is_map_view) {
              if (!map.getBounds().contains(marker.getLatLng())) {
                return;
              }
            }

            const aqhi_plus = sensor.aqhi_plus;
            if (is_max_query === true ? aqhi_plus <= parseInt(slider.value) : aqhi_plus >= parseInt(slider.value)) {

              const sensor_button = L.DomUtil.create("button", "text-sm p-1 border hover:border-blue-800", query_div)
              sensor_button.innerHTML = `<h1>${sensor.id}: ${aqhi_plus}</h1>`
              query[sensor.id] = sensor_button

              sensor_button.onclick = () => {
                map.setView([sensor[3], sensor[4]], 15)
              }
            }
          });
        };
  
        button.onclick = () => {
          control_div.classList.toggle('hidden')
          slider.dispatchEvent(new Event('change', { bubbles: true }))
        };
  
        return div;
      }
  
      return control;
    }
  )

  return <ControlComponent position={props.position} />;
}