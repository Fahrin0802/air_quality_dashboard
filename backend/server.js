const express = require('express');
const cron = require('node-cron');
const { add_ACA_station_AQHI_recent_ToDatabase } = require('./cronjob_helper');
const { add_ACA_community_AQHI_recent_ToDatabase } = require('./cronjob_helper');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
// Use the cors middleware
app.use(cors());
app.use(express.json());

// GET API Endpoint 1

app.get('/api/ACA_station_AQHI', async (req, res) => {

  let db = new sqlite3.Database('./air_quality_database_prod.sqlite', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error(err.message);
        reject(err);
        return;
    }
    console.log('Connected to the SQLite database.');
  });

  // SQL query to select all data from the table
  const SQL_QUERY = 'SELECT * FROM ACA_STATION_AQHI;';

  // Function to format the rows
  function formatRows(rows) {
    let result = {};
    rows.forEach(row => {
        result[row.StationKey] = row;
    });
    return result;
  }

  // Query the database and format the output
  db.all(SQL_QUERY, [], (err, rows) => {
    if (err) {
        console.log(err);
        db.close((closeErr) => {
            if (closeErr) {
                console.error(closeErr.message);
            }
            console.log('Closed the database connection.');
        });
        reject(err);
        return;
    }

    // Format the rows in the desired format
    const formattedRows = formatRows(rows);
    // resolve(formattedRows);
    res.send({
      body: formattedRows
    });

    // Close the database connection
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
    });
  });

  
});

// GET API Endpoint 2
app.get('/api/aca_community_aqhi', (req, res) => {

  let db = new sqlite3.Database('./air_quality_database_prod.sqlite', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error(err.message);
        reject(err);
        return;
    }
    console.log('Connected to the SQLite database.');
  });

  // SQL query to select all data from the table
  const SQL_QUERY = 'SELECT * FROM ACA_COMMUNITY_AQHI;';

  // Function to format the rows
  function formatRows(rows) {
    let result = {};
    rows.forEach(row => {
        result[row.CommunityName] = row.AqhiValue;
    });
    return result;
  }

  // Query the database and format the output
  db.all(SQL_QUERY, [], (err, rows) => {
    if (err) {
        console.log(err);
        db.close((closeErr) => {
            if (closeErr) {
                console.error(closeErr.message);
            }
            console.log('Closed the database connection.');
        });
        reject(err);
        return;
    }

    // Format the rows in the desired format
    const formattedRows = formatRows(rows);
    // resolve(formattedRows);
    res.send( formattedRows );

    // Close the database connection
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
    });
  });
});

// Cron Job 1: Runs every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  var timeStamp = new Date().toISOString();
  try {
      await add_ACA_station_AQHI_recent_ToDatabase();
      await add_ACA_community_AQHI_recent_ToDatabase();
  }
  catch (err) {
      console.log(err);
  }
  console.log('JavaScript timer trigger function ran!', timeStamp);
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


