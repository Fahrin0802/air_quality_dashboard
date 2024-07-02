

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
  const url = 'https://air-quality-data-transfer.azurewebsites.net/api/ACA_station_AQHI';
  const params = {
      code: 'xy4gCd4k3AupMHOu8Wdm0JsDeISzVSWRF0A8ycvFIQuAAzFuME-Vcw=='
  };

  const queryString = new URLSearchParams(params).toString();
  const fetchUrl = `${url}?${queryString}`;

  try {
      const response = await fetch(fetchUrl)

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      const map = new Map();
      for (const [key, value] of Object.entries(data)) {
          map.set(String(key), value);
      }
      map.delete('_id');
      return map;
      
  } catch (error) {
      console.error('Error fetching air quality data:', error);
      throw error;
  }
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

  return top3Array;
}

function get_three_closest_purple_sensors(data: any[][]): any[][] {
  // Sort the array based on the last element (distance) of each inner array
  data.sort((a, b) => a[a.length - 1] - b[b.length - 1]);

  // Return the first three elements of the sorted array
  console.log(data.slice(0, 3));
  return data.slice(0, 3);
}

/**
* Fetch members of a PurpleAir group with specific fields.
* @param {string} fields - The fields to fetch.
* @returns {Promise<Object>} - The API response.
*/
async function get_purpleair_sensor_data(fields: string, ulat: number, ulon: number) {
  const groupId = 2309;
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
  }
  return data;

  } catch (error) {
  console.error("Error:", error);
  throw error;
  }
}

async function fetch_ACA_Community_AQHI(community_name: string) {
  const url = 'https://air-quality-data-transfer.azurewebsites.net/api/ACA_community_AQHI';
  const params = {
      code: 'ZM7nXmW1vyvoYqfau3jQJk94VpnZ0qf49cIRZHyGEN0XAzFuTcNKoQ=='
  };
  
  const queryString = new URLSearchParams(params).toString();
  const fetchUrl = `${url}?${queryString}`;

  try {
      const response = await fetch(fetchUrl);
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
  fetch_ACA_Community_AQHI
};