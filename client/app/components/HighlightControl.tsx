// This component covers Functional Requirement 16
import { createControlComponent } from '@react-leaflet/core'
import L, { latLng } from 'leaflet';
import { createPurpleAirSensorIcon, createPurpleAirHighlightedSensorIcon } from './leaflet-utils';
import { act } from 'react-dom/test-utils';
import { useEffect } from 'react';

export default function HighlightControl({props, data}: { props: L.ControlOptions; data: {[key: string]: [any, L.Marker]}}) {

  let isactive = false
  let max = -Infinity;
  let max_data: [any, L.Marker][] = []

  const ControlComponent = createControlComponent(
    (props) => {
      const control = new L.Control({ position: props.position });
        
      /* FR16 - Highlight.Sensor - The system shall highlight (increase the size and change the color) the sensors that have the 
        highest increase in PM2.5 concentrations for a given time frame (1-hour). This may indicate quickly worsening air quality. */
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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
        `;

        function listener() {

          if (!isactive)
            return;

          // on move, return markers to normal divicon
          Object.values(max_data).forEach(([sensor, marker]) => {
            marker.setIcon(createPurpleAirSensorIcon(sensor.aqhi_plus))
          });

          // only consider the markers in the current view
          const data_in_bounds = Object.values(data).filter(([sensor, marker]) => map.getBounds().contains(marker.getLatLng()));

          // find the sensors with the largest pm2.5 1 hour avg concentrations
          max = -Infinity;
          max_data = []
          Object.values(data_in_bounds).forEach(([sensor, marker]) => {
            const value = sensor["pm2.5_60minute"];
            if (value > max) {
              max = value;
              max_data = [[sensor, marker]]
            } else if (value === max) {
              max_data.push([sensor, marker])
            }
          });

          // Create highlight div icon for max sensors
          max_data.forEach(([sensor, marker]) => {
            marker.setIcon(createPurpleAirHighlightedSensorIcon(sensor.aqhi_plus))
          })
        };

        // triggered when done panning and zooming
        map.on('moveend', listener);

        button.onclick = () => {

          isactive = !isactive;

          // if turned off - set icons to normal for max sensors
          if (!isactive)
            Object.values(max_data).forEach(([sensor, marker]) => {
              marker.setIcon(createPurpleAirSensorIcon(sensor.aqhi_plus))
            });
          else {
            map.fireEvent('moveend');
          }
        };
  
        return div;
      }
      return control;
    }
  )

  return <ControlComponent position={props.position} />;
}