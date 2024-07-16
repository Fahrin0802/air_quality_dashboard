import { useRouteLoaderData } from "@remix-run/react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { loader } from "~/root";
import Map  from "app/components/map.client";
import { useGlobalLoadingState } from "remix-utils/use-global-navigation-state";
import { renderToString } from "react-dom/server";

import {
  extractCityName,
  get_purpleair_sensor_data,
  get_three_closest_purple_sensors,
  fetch_ACA_Station_AQHI,
  add_distance_to_ACA_station,
  fetch_ACA_Community_AQHI,
  calculateDistance,
  corrected_pm25,
  getFullAddress
} from "./utils"

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

export function DashboardSearch({ sensors }: { sensors: any }) {
  const PURPLE_AIR_FIELDS="name,last_seen,pm2.5_10minute,pm2.5_30minute,pm2.5_60minute,pm2.5_6hour,pm2.5_24hour,latitude,longitude,humidity";
  const data = useRouteLoaderData<typeof loader>("root")!;
  const env = data?.env;
  
  // MY LAT AND LON TO SHOW MY POSITION ON MAP
  const [map, setMap] = useState(null);
  const [lat, setLat] = useState<number>(53.5461);
  const [lon, setLon] = useState<number>(-113.4937);
  const [display_popup, set_display_popup] = useState(false);
  
  const [community_AQHI, set_community_AQHI ] = useState<string>("");
  const [addressSearchResults, setAddressSearchResults] = useState([]);
  const [address, setAddress] = useState("");
  const addressSearchRef = useRef<HTMLElement | null>(null);
  
  const [nearest_station_AQHI, set_nearest_station_AQHI] = useState<Station[]>([]);
  const [all_station_aqhi_map, set_all_station_aqhi_map] = useState<Map<any, any>>({});
  const [nearest_pm2, set_nearest_pm2] = useState<any[][]>([]);
  const [all_pm2, set_all_pm2] = useState<any[][]>([]);
  const [toggle_sensor, set_toggle_sensor] = useState(false);


  const toggle_popup = () => {
    set_display_popup(!display_popup);
  }

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement

    if (addressSearchRef.current && !addressSearchRef.current.contains(event.target as Node)) {
      if (target.classList.contains('result'))
        return
      setAddressSearchResults([])
    }

  }

  async function addressSearch(event: ChangeEvent<HTMLElement>) {
    event.preventDefault()
    const target = event.target as HTMLInputElement;
    setAddress(target.value);
    if (!address) return;
    
    const query_bytes = encodeURIComponent(address);
    try {
      const url = `https://atlas.microsoft.com/search/address/json?subscription-key=${env.Maps_key}&api-version=1.0&idxSet=PAD,Addr&typeahead=true&countrySet=CA&query=${query_bytes}`;
      const response = await fetch(url);
      const locations = await response.json();

      const res: any = [];
      locations.results.forEach((result: any) => {
        res.push(result);
      });

      setAddressSearchResults(res);
    } catch (error) {
      console.log(error);
    }
  }

  const extractCommunityAQHI = async (input_city: string) => {
    const community_aqhi = await fetch_ACA_Community_AQHI(input_city);
    set_community_AQHI(community_aqhi);
  }

  // Gets the current lat and lon and stores it in the global variables
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLat(latitude);
          setLon(longitude);
          const tempAddress = await getFullAddress(latitude, longitude);
          setAddress(tempAddress);
          extractCommunityAQHI(tempAddress.split(',')[1].trim());

          const x = await fetch_ACA_Station_AQHI();
          set_all_station_aqhi_map(x);
          set_nearest_station_AQHI(add_distance_to_ACA_station(x, latitude, longitude));
          
          var purple_with_distance: any[] = [];
          if (all_pm2.length == 0 ){
            purple_with_distance = all_pm2.map(item => {
              item[11] = calculateDistance(item[3], item[4], latitude, latitude);
              return item;
            });
          }
          else{
            purple_with_distance = await get_purpleair_sensor_data(PURPLE_AIR_FIELDS, latitude, longitude) ;
          }
          set_nearest_pm2(get_three_closest_purple_sensors(purple_with_distance));
          
          toggle_popup();
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        set_all_pm2(await get_purpleair_sensor_data(PURPLE_AIR_FIELDS, lat, lon));
        set_all_station_aqhi_map(await fetch_ACA_Station_AQHI());
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [lat, lon]); // Dependency array ensures the effect runs when lat or lon change


  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [addressSearchRef])

  const display = useMemo(() => {
    if (!lat && !lon)
      return null
    
    // Fahrin
    const nearest_FEM_Monitors = [
      {"Latitude":51.2975,"Longitude":-116.966,"UTC":"2024-06-04T23:00","Parameter":"PM2.5","Unit":"UG/M3","AQI":8,"Category":1},
      {"Latitude":53.5936,"Longitude":-116.3928,"UTC":"2024-06-04T23:00","Parameter":"PM2.5","Unit":"UG/M3","AQI":28,"Category":1},
      {"Latitude":53.22,"Longitude":-114.9833,"UTC":"2024-06-04T23:00","Parameter":"PM2.5","Unit":"UG/M3","AQI":31,"Category":1},
    ]


    let worst_value = 0;

    nearest_station_AQHI.forEach((station) => {
      if (station.AqhiStatus && parseFloat(station.AqhiStatus) > worst_value) {
        worst_value = parseFloat(station.AqhiStatus);
      }
    });
  
    
    // nearest_pm2.forEach((sensor) => {
    //   if (sensor.aqhi_plus && sensor.aqhi_plus > worst_value) {
    //     worst_value = sensor.aqhi_plus;
    //   }
    // });
  
    worst_value = Math.round(worst_value);

    return (
      <div className="w-full mt-4 overflow-hidden"> 
        
        {display_popup && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggle_popup}></div>
          <div className="fixed inset-0 flex items-center justify-center md:justify-end z-50 pr-4 md:pr-8 lg:pr-12 xl:pr-16">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg 
                max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 
                h-4/5 md:h-auto lg:h-auto xl:h-au overflow-y-auto transform scale-75"
            >
            <div className="text-center">

                <div className="flex flex-col md:flex-row justify-between gap-4">
                  {/* GEOMET API STATIONS */}
                  <div className="flex-1 bg-white rounded-lg shadow m-1 p-4 overflow-x-auto">
                    <h4 className="block text-med font-medium border-b text-black-700 text-center"> Continuous Monitoring Stations (NO2, O3, PM2.5)</h4>
                    {/* <h4 className="block text-med font-medium text-gray-700 text-center"> (NO2, O3, PM2.5) </h4> */}
                      <p className="text-center p-2">
                          {/* <strong style={{ fontSize: '20px' }}> */}
                              Community AQHI: {parseFloat(community_AQHI).toFixed(2)}
                          {/* </strong> */}
                      </p>
                      <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="px-3 py-1.5 text-center border-b border-gray-300">Station</th>
                          <th className="px-3 py-1.5 text-center border-b border-gray-300">AQHI</th>
                          <th className="px-3 py-1.5 text-center border-b border-gray-300">Distance (km)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nearest_station_AQHI.map((sensor, index) => (
                          <tr key={index}>
                            <td className="px-3 py-1.5 text-center">{sensor.StationName}</td>
                            <td className="px-3 py-1.5 text-center">{sensor.AqhiStatus}</td>
                            <td className="px-3 py-1.5 text-center">{sensor.distance ? sensor.distance.toFixed(2) : 0 }</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                   {/* PURPLE AIR MONITORS  */}
                  <div className="flex-1 bg-white rounded-lg shadow-md m-1 p-4 overflow-x-auto">
                    <h4 className="block text-med font-medium border-b text-black-700 text-center">Microsensors (PM 2.5)</h4>
                    <p className="text-center p-2">
                         
                    </p>
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="px-3 py-1.5 text-center border-b border-gray-300">Sensor ID</th>
                          <th className="px-3 py-1.5 text-center border-b border-gray-300">PM2.5</th>
                          <th className="px-3 py-1.5 text-center border-b border-gray-300">Distance (km)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nearest_pm2.map((sensor, index) => (
                          <tr key={index}>
                            <td className="px-3 py-1.5 text-center">{sensor[2]}</td>
                            <td className="px-3 py-1.5 text-center">{toggle_sensor === true ? corrected_pm25(sensor[6], sensor[5]).toFixed(2) : sensor[12].toFixed(2)}</td>
                            <td className="px-3 py-1.5 text-center">{sensor[11].toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div> 

                </div>

                {/*<div className="flex justify-center mt-4">
                  <p className="bg-yellow-200 text-center rounded border p-2">
                    <strong style={{ fontSize: '18px' }}>
                        Follow <a href="https://www.canada.ca/en/environment-climate-change/services/air-quality-health-index/understanding-messages.html" className="text-blue-500 underline">recommendations</a> for an AQHI of {worst_value}
                    </strong>
                  </p>
                </div>*/}
                <div className="flex justify-center mt-4">
                  <img src="/img/combined_scale.jpeg" style={{ width: '525px', height: '170px' }} />
                </div>
                

                <button 
                  onClick={toggle_popup} 
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition duration-300">
                  Close
                </button>
              </div>
            </div>
          </div>
          </>
        )}

          <div className="flex items-center mt-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={toggle_sensor}
                onChange={() => set_toggle_sensor(!toggle_sensor)}
              />
              <div className="w-12 h-7 bg-gray-200 rounded-full peer-checked:bg-blue-500 transition-colors duration-300"></div>
              <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 transform peer-checked:translate-x-5"></div>
            </label>
            <span className="ml-3 text-gray-700 font-medium">
              {toggle_sensor ? 'PM2.5 10 Minute Average' : 'PM2.5 60 Minute Average'}
            </span>
          </div>

          <Map all_pm2={all_pm2} lat={lat} lon={lon} all_station_aqhi_map={all_station_aqhi_map} map={map} setMap={setMap} toggle_sensor={toggle_sensor}/>
      </div>
    )
  }, [lat, lon, map, display_popup, all_pm2, all_station_aqhi_map, toggle_sensor])

  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-4xl mb-4">
      <h3 className="text-xl font-semibold mb-4 border-b-2 border-gray-300 pb-2 text-center">Address Search</h3>
      <div className="flex flex-col items-center text-sm font-medium text-gray-700">
        <div className="relative w-full mb-4 max-w-md mx-auto"> 
          <div className="flex">

            <button type="button" onClick={toggle_popup}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded margin-4"
            >
              Show Popup
            </button>
            
            <div className="w-200 h-10"></div>

            { /* @ts-ignore */}
            <input ref={addressSearchRef}
              id="address"
              type="search"
              className="p-2 flex-grow border border-gray-300 rounded-l-md" 
              placeholder="Enter Address"
              onChange={addressSearch}
              value={address}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={getCurrentLocation}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md"
            >
              Use Current Location
            </button>
          </div>
          {addressSearchResults.length > 0 && (
            <div className="absolute z-50 mt-1 rounded-md bg-white w-full max-w-md overflow-auto shadow-lg">
              {addressSearchResults.map((result: any, index) => (
                <button
                  key={index}
                  className="w-full text-left p-2 text-sm hover:bg-gray-100 result"
                  onClick={async () => {
                    setAddress(result.address.freeformAddress);
                    extractCommunityAQHI(extractCityName(result.address.freeformAddress));
                    setLat(result.position.lat);
                    setLon(result.position.lon);

                    const x = await fetch_ACA_Station_AQHI();
                    set_all_station_aqhi_map(x);
                    set_nearest_station_AQHI(add_distance_to_ACA_station(x, result.position.lat, result.position.lon));
                    
                    var purple_with_distance: any[] = [];
                    if (all_pm2.length == 0 ){
                      purple_with_distance = all_pm2.map(item => {
                        item[11] = calculateDistance(item[3], item[4], result.position.lat, result.position.lon);
                        return item;
                      });
                    }
                    else{
                      purple_with_distance = await get_purpleair_sensor_data(PURPLE_AIR_FIELDS, result.position.lat, result.position.lon) ;
                    }

                    set_nearest_pm2(get_three_closest_purple_sensors(purple_with_distance));
                    
                    toggle_popup();
                    setAddressSearchResults([]);
                  }}
                >
                  {result.address.freeformAddress}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {display}
      {/* <img src="/img/AQHI.png" alt="AQHI Scale" className=""/>
      <p className="text-center">This image was retrieved from <a href = "https://prampairshed.ca/aqhi/" className="text-blue-500 underline">https://prampairshed.ca/aqhi/</a></p> */}
    </div>
  );
}

