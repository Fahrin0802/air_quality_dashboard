const { MongoClient, ObjectId } = require("mongodb");
const uri = "mongodb://air-quality-database-prod:B4Ba5ujoB3f391pbs9sjyL7GQsynr6Ucd3Pxb0Ghxcfw0pSrkcrazI7O58fswh4Bdz6Jjlpzd712ACDbbAOm2w==@air-quality-database-prod.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@air-quality-database-prod@";
  
async function get_most_recent_ACA_station_AQHI(input_station_name) {
    // Get today's date and yesterday's date
    const currentDateTime = new Date();
    const twelveHourAgo = new Date(currentDateTime.getTime() - (12 * 60 * 60 * 1000)); // Subtract 12 hour in milliseconds
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
        // console.log(json_response['value'][0])
        return json_response['value'][0];
    } catch (error) {
        console.error('Error fetching data:', error);
    }
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
    const station_list = [
        'AMS #13', 'Beaverlodge', 'Breton', 'Bruderheim', 'Calgary Central 2',
        'Calgary Northwest', 'Caroline', 'Carrot Creek', 'Elk Island', 'Fort Chipewyan', 'Fort McKay',
        'Fort McMurray Athabasca Valley', 'Fort McMurray Patricia McInnes', 'Fort Saskatchewan', 'Genesee',
        'Grande Prairie - Henry Pirker', 'Hightower', 'Lamont County', 'Lethbridge', 'LICA - Portable station', 
        'Meadows', 'Medicine Hat - Crescent Heights', 'Powers', 'Range Road 220', 'Red Deer', 'Redwater Industrial', 
        'Ross Creek', 'Scotford2', 'St. Lina', 'Steeper', 'Tomahawk', 'Violet Grove', 'Wagner2'
    ]

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
    return result;
}



async function add_ACA_station_AQHI_recent_ToDatabase(context) {

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    try {
        await client.connect();
        const database = client.db("air-quality-database-prod"); // Replace with your database name
        const collection = database.collection("ACA_STATION_AQHI");

        const ACA_station_aqhi_recent = await get_all_ACA_station_AQHI();
        var objectToInsert = {_id: new ObjectId("667cd19b3959c4a97312965d"),};
        for (const [key, value] of ACA_station_aqhi_recent) {
            objectToInsert[key] = value;
        }

        context.log(objectToInsert);
        const query = { _id: new ObjectId("667cd19b3959c4a97312965d") };

        // Perform replaceOne operation
        const result = await collection.replaceOne(query, objectToInsert);

    } catch (error) {
        context.log("Error inserting document:", error);
    } finally {
        await client.close();
    }
}

module.exports = async function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    try {
        await add_ACA_station_AQHI_recent_ToDatabase(context);
    }
    catch (err) {
        context.log(err);
    }
    
    if (myTimer.isPastDue){
        context.log('JavaScript is running late!');
    }
    context.log('JavaScript timer trigger function ran!', timeStamp);
};