// This component covers Functional Requirement 2
import { createControlComponent } from '@react-leaflet/core'
import L from 'leaflet';

export const LocationControl = createControlComponent(
  (props) => {
    const control = new L.Control({ position: props.position })

    control.onAdd = (map) => {

      // html and css
      const div = L.DomUtil.create("div", "leaflet-touch leaflet-bar leaflet-control flex justify-center items-center bg-white");
      div.setAttribute("style", "width: 34px; height: 34px;")
      const button = L.DomUtil.create("button", "w-full h-full flex justify-center items-center", div);

      // tooltip
      button.title = "My location"
      
      // location icon
      button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
      `

      button.setAttribute("data-testid", "location-control-button")
      // To prevent scroll and click affecting map
      L.DomEvent.disableClickPropagation(button);
      L.DomEvent.disableScrollPropagation(button);
      
      /* FR2 - Request.Location - The user shall have an option to be redirected to their location on the map view. On request the system should ask the user for 
         permission to access their general location. If the user accepts the permission, the system should redirect the user to their location on the map view. */
      button.onclick = () => {
        
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              map.setView([latitude, longitude], 15)
            },
            (error) => {
              // console.error('Error getting user location:', error);
            }
          );
        } else {
          console.error('Geolocation is not supported by this browser.');
        }
      }
      return div;
    }

    return control
  }
)