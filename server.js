require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const knex = require('knex');

//User-defined modules
const { CreateAllTables, AddUser, AddExercise, GetAllUsers } = require('./dbWork/dbWork');
const {USERS, EXERCISE} = require('./Constants/Constants');

const app = express();

//Create Database -----------//
const db = knex({
  client: "sqlite3",
  connection: { filename: './dbFile/data.db3'},
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


app.get('/api/users', async (req, res) => {
  return res.json( await GetAllUsers(db));
}).post('/api/users' , async (req, res) => {
  return res.json(await AddUser(db, req.body.username));
  
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  //Adding data to exercise table and returning required data....
  let exercise = await AddExercise(db, req.body);
  if(exercise) {
    return res.json(exercise);
  }
  else {
    res.json("No user for this id");
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
