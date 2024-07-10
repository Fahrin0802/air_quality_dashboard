

export const MIN_DISTANCE = 0.1;

// Function to calculate distance between two geographical coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const firstLat = toRadians(lat1);
  const secondLat = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(firstLat) *
      Math.cos(secondLat);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

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

async function fetch_ACA_Station_AQHI() {
  const url = 'http://localhost:3000/api/ACA_station_AQHI';
  // const params = {
  //     code: 'xy4gCd4k3AupMHOu8Wdm0JsDeISzVSWRF0A8ycvFIQuAAzFuME-Vcw=='
  // };

  //const queryString = new URLSearchParams(params).toString();
  //const fetchUrl = `${url}?${queryString}`;

  try {
      const response = await fetch(url)

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      const map = new Map();
      for (const [key, value] of Object.entries(data["body"])) {
          map.set(String(key), value);
      }
      return map;
      
  } catch (error) {
      console.error('Error fetching air quality data:', error);
      throw error;
  }
}

function corrected_pm25(raw_average_pm25: number, humidity: number){
  var RH = humidity;
  if (humidity < 30){
    RH = 30;
  } else if (humidity > 70){
    RH = 70;
  }

  const PM = raw_average_pm25 /(1 + (0.24/((100/RH) - 1)));
  // console.log("humidity", humidity, RH);
  return PM;
}


const AQHI_PLUS = (pm25: number) => {
  // DIVIDE BY 10 and ROUND IT UP
  let aqhi_plus = -1;
  if (0 <= pm25 && pm25 < 10){
    aqhi_plus = 1;
  }
  else if (10 <= pm25 && pm25 < 20){
    aqhi_plus = 2;
  }
  else if (20 <= pm25 && pm25 < 30){
    aqhi_plus = 3;
  }
  else if (30 <= pm25 && pm25 < 40){
    aqhi_plus = 4;
  }
  else if (40 <= pm25 && pm25 < 50){
    aqhi_plus = 5;
  }
  else if (50 <= pm25 && pm25 < 60){
    aqhi_plus = 6;
  }
  else if (60 <= pm25 && pm25 < 70){
    aqhi_plus = 7;
  }
  else if (70 <= pm25 && pm25 < 80){
    aqhi_plus = 8;
  }
  else if (80 <= pm25 && pm25 < 90){
    aqhi_plus = 9;
  }
  else if (90 <= pm25 && pm25 < 100){
    aqhi_plus = 10;
  }
  else if (100 <= pm25){
    aqhi_plus = 11;
  }
  return aqhi_plus;
}

function add_distance_to_ACA_station(all_station_aqhi_map: Map<any, any>, ulat: number, ulon: number): Station[] {

  // Calculate distances and store them in an array
  const entriesWithDistance = Array.from(all_station_aqhi_map).map(([key, value]) => {
      if (value && typeof value === 'object' && 'lat' in value && 'lon' in value) {
          const distance = calculateDistance(value['lat'], value['lon'], ulat, ulon);
          return { key, value: { ...value, distance } }; // Spread operator to retain other properties
      }
      return null;
  }).filter(entry => entry !== null) as { key: string, value: Station }[];

  // Sort the entries by distance
  entriesWithDistance.sort((a, b) => {
      const distanceA = a.value.distance || Infinity; // Use Infinity as fallback if distance is undefined
      const distanceB = b.value.distance || Infinity; // Use Infinity as fallback if distance is undefined
      return distanceA - distanceB;
  });

  // Get the top 3 entries with the smallest distance
  const top3Entries = entriesWithDistance.slice(0, 3);

  // Create an array for the top 3 entries
  const top3Array: Station[] = top3Entries.map(entry => entry.value);
  //fahrin
  console.log(top3Array);

  return top3Array;

}

function get_three_closest_purple_sensors(data: any[][]): any[][] {
  // Sort the array based on the last element (distance) of each inner array
  data.sort((a, b) => a[11] - b[11]);

  // Return the first three elements of the sorted array
  console.log(data.slice(0, 3));
  return data.slice(0, 3);
}

function health_recommendation(index: number){
  const array = [];
  array[0]= "Health Risk: Low\nIdeal air quality for outdoor activities" ;
  array[1]= "Health Risk: Low\nIdeal air quality for outdoor activities" ;
  array[2]= "Health Risk: Low\nIdeal air quality for outdoor activities" ;
  array[3]= "Health Risk: Low\nIdeal air quality for outdoor activities" ;
  array[4]= "Health Risk: Moderate\nNo need to modify your usual outdoor\n activities unless you experience symptoms\n such as coughing and throat irritation";
  array[5]= "Health Risk: Moderate\nNo need to modify your usual outdoor\n activities unless you experience symptoms\n such as coughing and throat irritation";
  array[6]= "Health Risk: Moderate\nNo need to modify your usual outdoor\n activities unless you experience symptoms\n such as coughing and throat irritation";
  array[7]= "Health Risk: High\nConsider reducing or rescheduling \n strenuous activities outdoors if you experience\n symptoms such as coughing and throat irritation";
  array[8]= "Health Risk: High\nConsider reducing or rescheduling \n strenuous activities outdoors if you experience\n symptoms such as coughing and throat irritation";
  array[9]= "Health Risk: High\nConsider reducing or rescheduling \n strenuous activities outdoors if you experience\n symptoms such as coughing and throat irritation";
  array[10]= "Health Risk: Very High\nReduce or reschedule strenuous activities \n outdoors, especially if you experience symptoms\n such as coughing and throat irritation.";

  return array[index];
}

/**
* Fetch members of a PurpleAir group with specific fields.
* @param {string} fields - The fields to fetch.
* @returns {Promise<Object>} - The API response.
*/
async function get_purpleair_sensor_data(fields: string, ulat: number, ulon: number) {
  const groupId = 2355;
  const apikey = "7EF0A72B-098D-11EF-B9F7-42010A80000D";
  const url = `https://api.purpleair.com/v1/groups/${groupId}/members`;
  const fullUrl = `${url}?fields=${encodeURIComponent(fields)}`;

  try {
  const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
      "X-API-KEY": apikey
      }
  });

  if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
  }
  const datax = await response.json();
  const data = datax["data"];
  for(const inner of data){
      inner.push(calculateDistance(inner[3], inner[4], ulat, ulon))
      inner.push(corrected_pm25(inner[8], inner[5]));
      inner.push(AQHI_PLUS(inner[12]));
  }
  return data;

  } catch (error) {
  console.error("Error:", error);
  throw error;
  }
}

async function fetch_ACA_Community_AQHI(community_name: string) {
  //const url = 'https://air-quality-data-transfer.azurewebsites.net/api/ACA_community_AQHI';
  const url = 'http://localhost:3000/api/aca_community_aqhi';
  // const params = {
  //     code: 'ZM7nXmW1vyvoYqfau3jQJk94VpnZ0qf49cIRZHyGEN0XAzFuTcNKoQ=='
  // };
  
  // const queryString = new URLSearchParams(params).toString();
  //const fetchUrl = `${url}?${queryString}`;

  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      
      const map = new Map();

      for (const [key, value] of Object.entries(data)) {
          map.set(String(key), String(value));
      }
      console.log(community_name, map);
      return map.get(community_name);

  } catch (error) {
      console.error('Error fetching air quality data:', error);
      throw error;
  }
}

function extractCityName(input_address: any) {
  // Regular expression to match the pattern where city name is usually found
  // This regex captures everything before the two-letter state/province code
  const cityRegex = /, ([a-zA-Z\s]+) [A-Z]{2} \w{2,6}/;
  // Test the regex on the address
  const match = input_address.match(cityRegex);

  if (match && match[1]) {
      // Return the captured city name
      return match[1].trim();
  } else {
      // If no match found, return an appropriate message or handle error
      return 'City name not found';
  }
}

export { 
  calculateDistance,
  extractCityName,
  get_purpleair_sensor_data,
  get_three_closest_purple_sensors,
  fetch_ACA_Station_AQHI,
  add_distance_to_ACA_station,
  fetch_ACA_Community_AQHI,
  AQHI_PLUS,
  corrected_pm25,
  health_recommendation,
  getFullAddress
};


// const getCurrentLocation = () => {
//   if (navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const { latitude, longitude } = position.coords;
//         setLat(latitude);
//         setLon(longitude);
        
//         // Fetch the address using reverse geocoding
//         const address = await getFullAddress(latitude, longitude);
//         setAddress(address);
        
//         extractCommunityAQHI("xx");

//         const x = await fetch_ACA_Station_AQHI();
//         set_all_station_aqhi_map(x);
//         set_nearest_station_AQHI(add_distance_to_ACA_station(x, latitude, longitude));

//         const bushra = await get_purpleair_sensor_data(PURPLE_AIR_FIELDS, latitude, longitude);
//         set_nearest_pm2(get_three_closest_purple_sensors(bushra));

//         toggle_popup();
//       },
//       (error) => {
//         console.error("Error getting user location:", error);
//       }
//     );
//   } else {
//     console.error("Geolocation is not supported by this browser.");
//   }
// };



const getFullAddress = async (lat: number, lon: number) => {
  const apiKey = 'AIzaSyDLgLIvEJqYsfDNyKx-cYxp7hCyzpz-9ng'; // Replace with your API key
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK') {
      const address = data.results[0].formatted_address;
      return address;
    } else {
      console.error('Error fetching address:', data.status);
      return "Address not found";
    }
  } catch (error) {
    console.error('Error:', error);
    return "Address not found";
  }
};


