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
  fetch_ACA_Community_AQHI
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
  const [lat, setLat] = useState<number>(53.0000);
  const [lon, setLon] = useState<number>(-113.0000);
  const [display_popup, set_display_popup] = useState(false);
  
  const [community_AQHI, set_community_AQHI ] = useState<string>("");
  const [addressSearchResults, setAddressSearchResults] = useState([]);
  const [address, setAddress] = useState("");
  const addressSearchRef = useRef<HTMLElement | null>(null);
  
  const [nearest_station_AQHI, set_nearest_station_AQHI] = useState<Station[]>([]);
  const [all_station_aqhi_map, set_all_station_aqhi_map] = useState<StationMap>({});
  const [nearest_pm2, set_nearest_pm2] = useState<any[][]>([]);
  const [all_pm2, set_all_pm2] = useState<any[][]>([]);


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
        (position) => {
          const { latitude, longitude } = position.coords;
          setLat(latitude);
          setLon(longitude);
          setAddress("Current Location");
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
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [lat, lon]); // Dependency array ensures the effect runs when lat or lon change

  useEffect(() => {
    const fetchData = async () => {
      try {
        set_all_station_aqhi_map(await fetch_ACA_Station_AQHI());
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []); 


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

    // nearest_stations.forEach((station) => {
    //   if (station.aqhi && station.aqhi > worst_value) {
    //     worst_value = station.aqhi;
    //   }
    // });
  
    // nearest_sensors.forEach((sensor) => {
    //   if (sensor.aqhi_plus && sensor.aqhi_plus > worst_value) {
    //     worst_value = sensor.aqhi_plus;
    //   }
    // });
  
    // worst_value = Math.round(worst_value);

    return (
      <div className="w-full mt-4 overflow-hidden"> 
        
        {display_popup && (
          <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggle_popup}></div>
          <div className="fixed inset-0 flex items-center justify-end z-50 pr-100 md:pr-128 lg:pr-128 xl:pr-128">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-center">
                {/* <p>My name is Amina Hussein XOXO</p> */}
                
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
                          <th className="px-4 py-2 text-center border-b border-gray-300">Station</th>
                          <th className="px-4 py-2 text-center border-b border-gray-300">AQHI</th>
                          <th className="px-4 py-2 text-center border-b border-gray-300">Distance (km)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nearest_station_AQHI.map((sensor, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-center">{sensor.StationName}</td>
                            <td className="px-4 py-2 text-center">{sensor.AqhiStatus}</td>
                            <td className="px-4 py-2 text-center">{sensor.distance ? sensor.distance.toFixed(2) : 0 }</td>
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
                          <th className="px-4 py-2 text-center border-b border-gray-300">Sensor ID</th>
                          <th className="px-4 py-2 text-center border-b border-gray-300">PM2.5</th>
                          <th className="px-4 py-2 text-center border-b border-gray-300">Distance (km)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nearest_pm2.map((sensor, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-center">{sensor[2]}</td>
                            <td className="px-4 py-2 text-center">{sensor[8]}</td>
                            <td className="px-4 py-2 text-center">{sensor[11].toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div> 

                  <img src="/img/pm2_scale.png" className="mx-auto my-4 w-30 h-90"/>
                </div>

                <div className="flex justify-center mt-4">
                  {/* <p className="bg-yellow-200 text-center rounded border p-2">
                    <strong style={{ fontSize: '24px' }}>
                        Follow <a href="https://www.canada.ca/en/environment-climate-change/services/air-quality-health-index/understanding-messages.html" className="text-blue-500 underline">recommendations</a> for an AQHI of {worst_value}
                    </strong>
                  </p> */}
                </div>
                <img src="/img/xAQHI.png" className="mx-auto my-4 w-96 h-30"/>

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

          <Map all_pm2={all_pm2} latitude={53.5461} longitude={-113.4937} lat={lat} lon={lon} all_station_aqhi_map={all_station_aqhi_map}/>
      </div>
    )
  }, [lat, lon, display_popup, all_pm2])

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
                    
                    const bushra = await get_purpleair_sensor_data(PURPLE_AIR_FIELDS, result.position.lat, result.position.lon) ;
                    set_nearest_pm2(get_three_closest_purple_sensors(bushra));
                    
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

