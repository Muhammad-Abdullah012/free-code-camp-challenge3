require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const knex = require('knex');
const fs = require('fs');

//User-defined modules
const { CreateAllTables, AddUser, AddExercise, GetAllUsers, GetExerciseLogs } = require('./dbWork/dbWork');


const app = express();


//Create Database -----------//
const db = knex({
  client: "sqlite3",
  connection: () => { 
    const filename = './data.db3';
    if(!fs.existsSync(filename)){
      let createFile = fs.createWriteStream(filename);
      createFile.end();
    }
    return { filename }
  },
  useNullAsDefault: true
});
CreateAllTables(db);  //Create All Tables in database.
//----------------------------

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});


app.route('/api/users')
  .get( async (req, res) => {
    let allUsers = await GetAllUsers(db);
    let a = allUsers.length;
    for(let i = 0; i < a; i++) {
      Object.assign(allUsers[i], {__v: 0});
    }
    return res.json( allUsers );
  }).post( async (req, res) => {
      return res.json(await AddUser(db, req.body.username));
    });
//You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used.
app.post('/api/users/:_id/exercises', async (req, res) => {
  //Adding data to exercise table and returning required data....
  let exercise = await AddExercise(db, req.body);
  if(exercise) {
    return res.json(exercise);
  }
  else {
    res.json("Not found");
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  let {from, to , limit} = req.query;
  let id = req.params["_id"];
  let ExLogs = await GetExerciseLogs(db, id, from, to, limit );
  if(ExLogs) {
    return res.json(ExLogs);
  }
  else {
    res.json(`No user for id: ${id}`);
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
