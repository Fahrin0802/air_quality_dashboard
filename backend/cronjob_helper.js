const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function fetch_community_names(){
    try{
        const baseUrl = 'https://data.environment.alberta.ca/Services/AirQualityV2/AQHI.svc/CommunityMeasurements';
        const queryParams = new URLSearchParams({
            $format: 'json',
            $filter: "(ReadingDate gt datetime'2023-04-18T11:00:00' and ReadingDate lt datetime'2023-04-28T13:00:00')",
            $select: 'ReadingDate,CommunityName,Value',
            $orderby: 'CommunityName,ReadingDate'
        });

        const url = `${baseUrl}?${queryParams}`;
        // const url = `https://data.environment.alberta.ca/Services/AirQualityV2/AQHI.svc/CommunityMeasurements?$format=json&$filter=(ReadingDate gt datetime'2023-04-18T11:00:00' and ReadingDate lt datetime'2023-04-28T13:00:00')&$select=ReadingDate,CommunityName,Value&$orderby=CommunityName,ReadingDate`;
        const response = await fetch(url, { method: "GET" });
        const data = await response.json();

        const communityNames = data.d.map(entry => entry.CommunityName);
        const uniqueCommunityNames = new Set();
        data.d.forEach(entry => { 
            uniqueCommunityNames.add(entry.CommunityName);
        });
        return  Array.from(uniqueCommunityNames)
  
    } catch (error) {
        console.error("Error fetching station data:", error);
    }
}

async function fetch_all_station_names(){
    const url =  'https://data.environment.alberta.ca/services/airqualityv2/aqhi.svc/Stations?$format=json&$select=Name&$orderby=Name';
    const response = await fetch(url);
    const data = await response.json();

    const station_list = []
    for (const item of data.d){
        station_list.push(item.Name);
    }
    return station_list;
}

/**
 * Fetches most recent Air Quality Health Index (AQHI) data for a specific community. 
 * @param {string} community_name - The name of the community to fetch data for.
 * @returns {string} - The most recent AQHI value for the community
 */
async function fetch_community_AQHI(community_name) {

    // Get current datetime and datetime one hour ago
    const currentDateTime = new Date();
    const twelveHourAgo = new Date(currentDateTime.getTime() - (12 * 60 * 60 * 1000)); // Subtract 12 hour in milliseconds

    // Format datetime strings
    const currentDateTimeString = currentDateTime.toISOString().slice(0, 19);
    const twelveHourAgoString = twelveHourAgo.toISOString().slice(0, 19);

    const encodedCommunityName = encodeURIComponent(community_name);
    //console.log(community_name);
    const baseUrl = 'https://data.environment.alberta.ca/Services/AirQualityV2/AQHI.svc/CommunityMeasurements';
    
    // const filterQuery = `(ReadingDate gt datetime'2024-05-15T10:00:00' and ReadingDate lt datetime'2024-05-15T12:00:00') and (CommunityName eq '${encodedCommunityName}')`;
    const filterQuery = `(ReadingDate gt datetime'${twelveHourAgoString}' and ReadingDate lt datetime'${currentDateTimeString}') and (CommunityName eq '${encodedCommunityName}') and (Value ne null)`;
    const queryParams = new URLSearchParams({
        $format: 'json',
        $filter: filterQuery,
        $select: 'ReadingDate,CommunityName,Value',
        $orderby: 'ReadingDate desc',
        $top: 1 // Return only the top (most recent) record
    });
  
    const url = `${baseUrl}?${queryParams}`;
    
    try{
        const modified_url = url.split('25').join('')
        //console.log(modified_url);
        const response = await fetch(modified_url, { method: "GET" });
        const monitors = await response.json();
        return monitors.d[0].Value;
    }
    catch (error){
        return -1;
    }
}

async function get_most_recent_ACA_station_AQHI(input_station_name) {
    // Get today's date and yesterday's date
    const currentDateTime = new Date();
    const twelveHourAgo = new Date(currentDateTime.getTime() - (24 * 60 * 60 * 1000)); // Subtract 12 hour in milliseconds
    const twelveHourAgoString = twelveHourAgo.toISOString().slice(0, 19);

    const station_name = encodeURIComponent(input_station_name);
    const base_url = 'https://data.environment.alberta.ca/EdwServices/aqhi/odata/StationMeasurements';
    const filterQuery = `$filter=StationName%20eq%20%27${station_name}%27%20and%20DeterminantParameterName%20eq%20%27Air%20Quality%20Health%20Index%27%20and%20ReadingDate%20ge%20${twelveHourAgoString}Z`

    const queryParams = new URLSearchParams({
        $format: "json", 
        $orderby:'ReadingDate desc', $top:'1'
    });

    const call_url_x = `${base_url}?${filterQuery}&${queryParams}`;
    const REQUEST_URL = call_url_x.split('25').join('');
    
    try {
        const response = await fetch(REQUEST_URL);
        const json_response = await response.json();
        // console.log(json_response['value'][0]);
        return json_response['value'][0];

    } catch (error) {
        return [];
    }
}

async function fetch_most_recent_AQHI_community(){
    const map = new Map(); 
    const community_names = await fetch_community_names();

    for (const item of community_names) {
        const most_recent_AQHI = await fetch_community_AQHI(item);
        map.set(item, most_recent_AQHI);
    }
    return map;
}

async function fetch_station_location(stationID) {
    const baseUrl = `https://data.environment.alberta.ca/Services/AirQualityV2/AQHI.svc/Stations(${stationID})`;
    
    const queryParams = new URLSearchParams({
        $format: 'json'
    });
  
    const url = `${baseUrl}?${queryParams}`;

    try{
        const response = await fetch(url, { method: "GET" });
        const monitors = await response.json();

        const map = new Map(); 
        map.set('Latitude', monitors.d.Latitude);
        map.set('Longitude', monitors.d.Longitude);
        return map;
    }
    catch (error){
        return -1;
    }
}

async function add_lat_lon_to_ACA_station(all_station_aqhi_map){
    for (let [key, value] of all_station_aqhi_map) {
        const station_location = await fetch_station_location(key);
        value['lat'] = parseFloat(station_location.get('Latitude'));
        value['lon'] = parseFloat(station_location.get('Longitude'));
    }
    return all_station_aqhi_map;
}

async function get_all_ACA_station_AQHI() {
    // const station_list = [
    //     'AMS #13', 'Beaverlodge', 'Breton', 'Bruderheim', 'Calgary Central 2']
    //     'Calgary Northwest', 'Caroline', 'Carrot Creek', 'Elk Island', 'Fort Chipewyan', 'Fort McKay',
    //     'Fort McMurray Athabasca Valley', 'Fort McMurray Patricia McInnes', 'Fort Saskatchewan', 'Genesee',
    //     'Grande Prairie - Henry Pirker', 'Hightower', 'Lamont County', 'Lethbridge', 'LICA - Portable station', 
    //     'Meadows', 'Medicine Hat - Crescent Heights', 'Powers', 'Range Road 220', 'Red Deer', 'Redwater Industrial', 
    //     'Ross Creek', 'Scotford2', 'St. Lina', 'Steeper', 'Tomahawk', 'Violet Grove', 'Wagner2'
    // ]
    const station_list = await fetch_all_station_names();

    var accumulator = new Map();
    for (const station of station_list){
        const station_map = await get_most_recent_ACA_station_AQHI(station);
        if (station_map?.StationKey) {
            accumulator.set(station_map.StationKey, station_map);
        } else {
           continue;
        }
    }

    const result = await add_lat_lon_to_ACA_station(accumulator);
    console.log(result);
    return result;
}

async function add_ACA_station_AQHI_recent_ToDatabase() {
    // Open a database connection
    const db = await open({
        filename: './air_quality_database_prod.sqlite', // Path to your SQLite database file
        driver: sqlite3.Database
    });

    try {
        const ACA_station_aqhi_recent = await get_all_ACA_station_AQHI();

        // Start a transaction
        await db.exec('BEGIN TRANSACTION');

        // SQL query for inserting data
        const sql = `
            INSERT INTO ACA_STATION_AQHI (
                StationMeasurementKey, StationKey, ParameterKey, DeterminantParameterKey, 
                IndexMethodZoneKey, DateKey, TimeKey, Value, StationName, ParameterName, 
                DeterminantParameterName, ReadingDate, AqhiStatus, IsPilotStation, lat, lon
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            ON CONFLICT(StationKey) DO UPDATE SET 
                StationKey = excluded.StationKey,
                ParameterKey = excluded.ParameterKey,
                DeterminantParameterKey = excluded.DeterminantParameterKey,
                IndexMethodZoneKey = excluded.IndexMethodZoneKey,
                DateKey = excluded.DateKey,
                TimeKey = excluded.TimeKey,
                Value = excluded.Value,
                StationName = excluded.StationName,
                ParameterName = excluded.ParameterName,
                DeterminantParameterName = excluded.DeterminantParameterName,
                ReadingDate = excluded.ReadingDate,
                AqhiStatus = excluded.AqhiStatus,
                IsPilotStation = excluded.IsPilotStation,
                lat = excluded.lat,
                lon = excluded.lon
        `;

        // Iterate over the Map and insert each entry
        for (const [key, value] of ACA_station_aqhi_recent) {
            const values = [
                value.StationMeasurementKey, value.StationKey, value.ParameterKey, value.DeterminantParameterKey,
                value.IndexMethodZoneKey, value.DateKey, value.TimeKey, value.Value, value.StationName, value.ParameterName,
                value.DeterminantParameterName, value.ReadingDate, value.AqhiStatus, value.IsPilotStation, value.lat, value.lon
            ];
            await db.run(sql, values);
        }

        // Commit the transaction
        await db.exec('COMMIT');

    } catch (error) {
        await db.exec('ROLLBACK');
        console.log("Error inserting document:", error);
    } finally {
        await db.close();
    }
}


// async function add_ACA_community_AQHI_recent_ToDatabase(context) {

//     const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//     try {
//         await client.connect();
//         const database = client.db("air-quality-database-prod"); // Replace with your database name
//         const collection = database.collection("ACA_COMMUNITY_AQHI");

//         const ACA_community_aqhi_recent = await fetch_most_recent_AQHI_community();

//         var objectToInsert = {_id: new ObjectId("667cd19b3959c4a97312965d")};
//         for (const [key, value] of ACA_community_aqhi_recent) {
//             objectToInsert[key] = value;
//         }

//         const query = { _id: new ObjectId("667cd19b3959c4a97312965d") };
//         // Perform replaceOne operation
//         const result = await collection.replaceOne(query, objectToInsert);
//         context.log(objectToInsert);

//     } catch (error) {
//         context.log("Error inserting document:", error);
//     } finally {
//         await client.close();
//     }
    
// }

async function add_ACA_community_AQHI_recent_ToDatabase() {
    // Open a database connection
    const db = await open({
        filename: './air_quality_database_prod.sqlite', // Path to your SQLite database file
        driver: sqlite3.Database
    });

    try {
        const ACA_community_aqhi_recent = await fetch_most_recent_AQHI_community();

        // Start a transaction
        await db.exec('BEGIN TRANSACTION');

        // SQL query for inserting data
        const sql = `
            INSERT INTO ACA_COMMUNITY_AQHI (
                CommunityName, AqhiValue
            ) VALUES (
                ?, ?
            )
            ON CONFLICT(CommunityName) DO UPDATE SET 
                CommunityName = excluded.CommunityName,
                AqhiValue = excluded.AqhiValue
        `;

        // Iterate over the Map and insert each entry
        for (const [key, value] of ACA_community_aqhi_recent) {
            const values = [
                key, value
            ];
            await db.run(sql, values);
        }

        // Commit the transaction
        await db.exec('COMMIT');

    } catch (error) {
        await db.exec('ROLLBACK');
        console.log("Error inserting document:", error);
    } finally {
        await db.close();
    }
}





// module.exports = async function (context, myTimer) {
//     var timeStamp = new Date().toISOString();
//     try {
//         await add_ACA_station_AQHI_recent_ToDatabase(context);
//         await add_ACA_community_AQHI_recent_ToDatabase(context);
//     }
//     catch (err) {
//         context.log(err);
//     }
    
//     if (myTimer.isPastDue){
//         context.log('JavaScript is running late!');
//     }
//     context.log('JavaScript timer trigger function ran!', timeStamp);
// };
   

module.exports = {
    add_ACA_station_AQHI_recent_ToDatabase,
    add_ACA_community_AQHI_recent_ToDatabase,
}

