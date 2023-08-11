const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

let db = null;
const dbPath = path.join(__dirname, "covid19India.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectToResponseObject1 = (dbObject) => {
  return {
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertDbObjectToResponseObject2 = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//1.Get states API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT *
    FROM state
    ORDER BY state_id;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((each) => convertDbObjectToResponseObject(each))
  );
});

//2.Get state API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * 
     FROM state 
     WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(state));
});

//3.Add Districts API
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `INSERT INTO 
        district (district_name,state_id,cases,cured,active,deaths)
    VALUES 
        (
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        );`;
  const dbResponse = await db.run(addDistrictQuery);
  const districtId = dbResponse.lastID;
  response.send("District Successfully Added");
});

//4.Get district API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * 
     FROM district 
     WHERE district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDbObjectToResponseObject2(district));
});

//5.Delete district API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDeleteQuery = `DELETE FROM 
            district
    WHERE 
            district_id = ${districtId};`;
  await db.run(districtDeleteQuery);
  response.send("District Removed");
});

//6.Update district API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const districtUpdateQuery = `UPDATE district
    SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE 
        district_id = ${districtId};`;
  await db.run(districtUpdateQuery);
  response.send("District Details Updated");
});

//7.Get the statistics of a particular state
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT sum(cases) as totalCases,
                                sum(cured) as totalCured,
                                sum(active) as totalActive,
                                sum(deaths) as totalDeaths
     FROM district  
     WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(state);
});

//8.Get state name based on district_id API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `SELECT state_name as stateName 
     FROM state 
     WHERE state_id IN (SELECT state_id 
                       FROM district 
                       WHERE district_id = ${districtId});`;
  const state = await db.get(getStateNameQuery);
  response.send(state);
});

module.exports = app;
