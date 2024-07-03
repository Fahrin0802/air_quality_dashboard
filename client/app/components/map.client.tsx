// This component covers Functional Requirements 1, 3, 5, 6, 7, 27, 28, 29, 30
import { LayerGroup, LayersControl, MapContainer, MapContainerProps, 
  Marker, Popup, ScaleControl, TileLayer, Tooltip, useMap} from 'react-leaflet'
import "leaflet/dist/leaflet.css";
import { LocationControl } from "./LocationControl";
import { LegendControl } from "./LegendControl";
import { SensorLegendControl } from "./SensorLegendControl";
import QueryControl from "./QueryControl";
import { MouseEventHandler, useMemo, useState } from "react";
import MapNavbar from "./mapNavbar";
import Plot from './Plot';

import { useEffect, useRef } from 'react';

import { createStationSensorIcon, createPurpleAirSensorIcon } from './leaflet-utils';
import HighlightControl from './HighlightControl';
import { LeafletEventHandlerFn } from 'leaflet';
import { EventCallbackFunction } from '@azure/msal-browser';
import L from 'leaflet';


const purpleair_data: {[key: string]: [any, L.Marker]} = {};
const station_data: {[key: string]: [any, L.Marker]} = {};

interface Station {
  lat: number;
  lon: number;
  StationName: string;
  AqhiStatus: string;
  distance?: number;
  [key: string]: any; // Allow for other properties
}

interface StationMap {
  [key: string]: Station;
}

export const createPurpleAirMarker = (sensor: any, add_handler: LeafletEventHandlerFn, button_function: MouseEventHandler<HTMLButtonElement>) => {
  const sensor_id = sensor[0];
  const sensor_ts = sensor[1];
  const sensor_name = sensor[2];
  const sensor_lat = sensor[3];
  const sensor_lon = sensor[4];
  const sensor_humidity = sensor[5];
  const sensor_pm2_10 = sensor[6];
  const sensor_pm2_30 = sensor[7];
  const sensor_pm2_60 = sensor[8];
  const sensor_pm2_6 = sensor[9];
  const sensor_pm2_24 = sensor[10];
  const sensor_distance = sensor[11];
  
  return (
    <Marker key={sensor_id} position={[sensor_lat, sensor_lon]} opacity={1} icon={createPurpleAirSensorIcon(sensor_pm2_60)} eventHandlers={{ add: add_handler}}>
      
      {/* FR6 - Load.Sensor.Data - The system shall load the sensor data retrieved from the PurpleAir API based on the sensor. */}
      <Tooltip direction='right' offset={[20, 0]} position={[sensor_lat, sensor_lon]} opacity={0.9}>
        <div className='text-sm'>
            <h1 className='text-lg font-bold'>{sensor_name}</h1>
            <div className='flex flex-col items-start px-2'>
              <div><span className='font-bold'>Updated:</span> {(new Date(sensor_ts*1000)).toLocaleString(navigator.language, {year:'numeric' ,month: 'short', day: '2-digit', hour:'numeric'})}<br /></div>
              <div><span className='font-bold'>10 min.</span> Average <span className='font-bold'>{sensor_pm2_10}</span> μg m<sup>-3</sup></div>
              <div><span className='font-bold'>30 min.</span> Average <span className='font-bold'>{sensor_pm2_30}</span> μg m<sup>-3</sup></div>
              <div><span className='font-bold'>1 hr.</span> Average <span className='font-bold'>{sensor_pm2_60}</span> μg m<sup>-3</sup></div>
            </div>
        </div>
      </Tooltip>
      {/* FR7 - Display.Sensor.Data - The system shall display averaged sensor data as a pop-up in the time intervals of 10 minutes, 1-hour, 6-hour, and 24 hours when the user clicks on a sensor. */}
      <Popup autoClose={false} closeButton>
        <div>
          <h1 className='text-lg font-bold'>{sensor[1]} <br/></h1>
          <div className='flex flex-col justify-evenly text-sm p-2 whitespace-nowrap' data-testid="marker-popup">
          <div><span className='font-bold'>Updated:</span> {(new Date()).toLocaleString(navigator.language, {year:'numeric' ,month: 'short', day: '2-digit', hour:'numeric'})}</div>
            <div><span className='font-bold'>Confidence</span>: {sensor["confidence"]}%</div>
            <div><span className='font-bold'>10 min.</span> Average <span className='font-bold'>{sensor_pm2_10}</span> μg m<sup>-3</sup></div>
            <div><span className='font-bold'>30 min.</span> Average <span className='font-bold'>{sensor_pm2_30}</span> μg m<sup>-3</sup></div>
            <div><span className='font-bold'>1 hr.</span> Average <span className='font-bold'>{sensor_pm2_60}</span> μg m<sup>-3</sup></div>
            <div><span className='font-bold'>6 hr.</span> Average <span className='font-bold'>{sensor_pm2_6}</span> μg m<sup>-3</sup></div>
            <div><span className='font-bold'>24 hr.</span> Average <span className='font-bold'>{sensor_pm2_24}</span> μg m<sup>-3</sup></div>
          </div>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded-full" onClick={button_function}>
            Time Plot
          </button>
        </div>
      </Popup>
    </Marker>
    )
}

export const createStationMarker = (sensor: Station, add_handler: LeafletEventHandlerFn) => {
  return (
    <Marker key={sensor.StationKey} position={[sensor.lat, sensor.lon]} icon={createStationSensorIcon(Math.round(parseFloat(sensor.AqhiStatus)))}
    eventHandlers={{
      add: add_handler
    }}>
    <Tooltip direction='right' offset={[20, 0]} position={[sensor.lat, sensor.lon]} opacity={0.9}>
      <div className='text-sm p-2'>
          <h1 className='text-lg font-bold'>{sensor.location_name}</h1>
          <div className='flex flex-col items-start'>
            <div><span className='font-bold'>Updated</span>: {new Date(sensor.ReadingDate).toLocaleString(navigator.language, {year:'numeric' ,month: 'short', day: '2-digit', hour:'numeric'})}</div>
          </div>
      </div>
      </Tooltip>
      <Popup autoClose={false} closeButton>
        <div>
          <h1 className='text-lg font-bold w-full'>{sensor.StationName}<br/></h1>
          <div className='flex flex-col flex-nowrap whitespace-nowrap text-sm'>
            <h2 className='text-sm w-full flex-1 py-2'><span className='font-bold'>Updated</span>: {(new Date(sensor.ReadingDate)).toLocaleString(navigator.language, {year:'numeric' ,month: 'short', day: '2-digit', hour:'numeric'})}<br/></h2>
            <h2 className='text-sm w-full flex-1'><span className='font-bold'>AQHI</span>: {Math.round(parseFloat(sensor.AqhiStatus))}<br/></h2>
          </div>
        </div>
      </Popup>
  </Marker>
  )
}

 // Default Leaflet icon is already available, no need to redefine it
 const defaultIcon = L.icon({
   iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
   iconSize: [25, 41],
   iconAnchor: [12, 41],
   popupAnchor: [1, -34],
   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
   shadowSize: [41, 41]
 });
 
 export const createMyMarker = (lat: any, lon: any, add_handler: LeafletEventHandlerFn) => {
   return (
     <Marker 
       key={"myLocation"} 
       position={[lat, lon]} 
       opacity={1} 
       icon={defaultIcon}
       eventHandlers={{
         add: add_handler
       }}
     >
     </Marker>
   );
 };
  
// TODO: update any to JsonifyObject
export default function Map({ all_pm2, lat, lon, all_station_aqhi_map, map, setMap}: 
  {all_pm2: any, lat: number, lon: number, all_station_aqhi_map: Map<any, any>, map: any, setMap: any}) {

  const [plotDetails, setPlotDetails] = useState<any | null>({ show: false, sensorId: null });

  const showPlot = (sensorId: number) => {
    setPlotDetails({ show: true, sensorId });
  };

  const hidePlot = () => {
    setPlotDetails({ ...plotDetails, show: false });
  };

  /* FR1 - Map.View - The system should display a world map marking the locations of all PurpleAir sensors in the Edmonton Area using Leaflet and OpenStreetMap. */
  const displayMap = useMemo(() => (
    <div data-testid="map" style={{height: "85%"}}>
      {/* FR3 - Map.Interact - The system should allow a user to pan the map in any direction as well as zooming in and out. */}
      {/* @ts-ignore */}
      <MapContainer ref={setMap} center={[lat, lon]} zoom={11} scrollWheelZoom={true} className='z-40 min-h-full text-center' tap={false} doubleClickZoom>
        <ScaleControl position='bottomleft'/>
        <LocationControl position='topleft' />
        <LegendControl position='bottomright' />
        <HighlightControl props={{position:'topleft'}} data={purpleair_data} />
        <QueryControl props={{position:'topleft'}} data={purpleair_data}/>

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* FR29 - Enable.Sensors - The system shall display a category of sensors when the user enables them. */}
        {/* FR30 - Disable.Sensors - The system shall remove a category of sensors when the user disables them. */}
        <LayersControl position='topright' collapsed={false}>
          <LayersControl.Overlay name='<span class="text-sm">Purple-Air Sensors</span>' checked>
            <LayerGroup >
              {all_pm2 && all_pm2.map((sensor: any) => {
                  {/* FR5 - Display.Sensors - The system should display a marker with its real time BC AQHI+ value and be colored depending on the risk. 
                      The color scaling follows the National AQHI color scale along with its corresponding PM2.5 concentration in ug/cm3. */}
                  {/* FR27 - Indexes.Display - The system shall display the BC AQHI+ index for PurpleAir sensors and National AQHI for Agency Monitors. */}
                  return (
                    createPurpleAirMarker(sensor,
                    // add handler
                    (event) => {
                      purpleair_data[sensor[0]] = [sensor, event.target]
                    },
                    // button click function
                    () => showPlot(sensor[0]))
                  )
                }
              )}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay name='<span class="text-sm">Agency Monitors</span>' checked>
            <LayerGroup>
              {/* FR27 - Indexes.Display - The system shall display the BC AQHI+ index for PurpleAir sensors and National AQHI for Agency Monitors. */}
              {/* FR28 - Agency.Sensors - The system shall display Agency Monitors via Environment and Climate Change Canada api data source along with their National AQHI. */}
              { Array.from(all_station_aqhi_map).map(([key, sensor]) => {
                return(
                  createStationMarker(
                  sensor,
                  // add handler
                  (event) => {
                    station_data[sensor.StationKey] = [sensor, event.target]
                  })
                )
              })
            }
            </LayerGroup>
          </LayersControl.Overlay>
          
          <LayersControl.Overlay name='<span class="text-sm">My Location</span>' checked>
            <LayerGroup>
                {(
                  createMyMarker(
                  lat, lon,
                  // add handler
                  (event) => {
                  {event.target}
                  })
                )}
              
            </LayerGroup>
          </LayersControl.Overlay>
        
        </LayersControl>
        <SensorLegendControl position='topright' />
      </MapContainer>
    </div>
      ),
    [lat, lon, all_pm2, all_station_aqhi_map],
  );

  return (
    <div className="flex flex-col h-screen">
      {/* {map ? <MapNavbar map={map} purpleair_data={purpleair_data} station_data={station_data} />: null} */}
      <Plot show={plotDetails.show} sensorId={plotDetails.sensorId} onClose={hidePlot}/>
      <div style={{height: "100%"}}>
        {displayMap}
      </div>
    </div>
  )
}
