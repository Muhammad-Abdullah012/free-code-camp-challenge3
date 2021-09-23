const {EXERCISE, USERS, DESCRIPTION, DURATION, DATE, NAME, _ID} = require('../Constants/Constants');

//Create Tables
const createTable = (db,name) => {
    db.schema.hasTable(name).then((exist) => {
        if(!exist) {
            db.schema.createTable(name, (table)=> {
                table.increments('id').primary();
                switch(name) {
                    case USERS:
                        createUserTable(table);
                        break;
                    case EXERCISE:
                        createExersiceTable(table);
                        break;
                    default:
                        return;
                }
            })
            .catch(err => {
                console.error(err);
            })
        }
        else {
            // Table is already in Database, nothing else needed!
            return;
        }
    })
    .catch(err => {
        console.error(err);
    })
}

const createUserTable = (table) => {
    table.string(NAME);
}
const createExersiceTable = (table) => {
    table.decimal(_ID)
    table.foreign(_ID).references("id").inTable(USERS);
    table.string(DESCRIPTION);
    table.float(DURATION);
    table.date(DATE);
}


const CreateAllTables = (db) => {
    createTable(db, USERS);
    createTable(db, EXERCISE);
}
//----------------------------------------------------------------------//


// Enter Data
const AddUser = async (db, UserName) => {
    let User = await GetUser(db, UserName);
    if(!User || !User.id) {
        return await db(USERS).insert({Name: UserName})
        .then(async () => {return await GetUser(db, UserName)})
        .catch(err => {console.error(err)});
    }
    else {
        return User;
    }
}
const AddExercise = async (db, Exercise) => {
    if(!Exercise[":_id"]) {
        return null;
    }
    return await db.select("id").from(USERS).where("id", "=", Exercise[":_id"]).then(async (data) => {
        if(data.length) {
            const {date} = Exercise;
            let id = Exercise[":_id"];
            return await db(EXERCISE).insert({
                _id: id,
                Description: Exercise.description,
                Duration: Exercise.duration,
                Date: ( date ) ? (new Date(date)).toDateString() : (new Date).toDateString()
                //if date is given, convert it toDateString and store
                //else make new Date and convert it toDateString and store
            }).then(async () => {
                let u = await GetUserByID(db, id);
                Object.assign(u, await GetExercise(db, id));
                return u;
            })
            .catch(err => {console.error(err);});
        }
        else {
            return null;
        }
    })
}

//----------------------------------------------------------------------//


// Retrive Data
const GetUser = async (db, Name) => {
    return await db.select(db.ref(NAME).as(`username`),db.ref(`id`).as(_ID)).from(USERS).where("Name", "=", Name).then(data => {
        return data[0];
    })
    .catch(err => {console.error(err)});
}
const GetUserByID = async (db, id) => {
    return await db.select(db.ref(NAME).as(`username`),db.ref(`id`).as(_ID)).from(USERS).where("id", "=", id).then(data => {
        return data[0];
    })
}
const GetAllUsers = async (db) => {
    return await db.select(db.ref(NAME).as(`username`),db.ref(`id`).as(_ID)).from(USERS).then(data => {
        return data;
    })
    .catch(err=> {console.error(err);});
}
const GetExercise = async (db, _id) => {
    return await db.select(db.ref(DATE).as('date'),db.ref(DESCRIPTION).as('description'),db.ref(DURATION).as("duration")).from(EXERCISE).where("_id", "=", _id).then(data => {
        return data[0];
    })
    .catch(err => {console.error(err);})
}
const getAllExercises = async (db, _id) => {
    console.log("id is : ", _id);
    return await db.select(db.ref(DATE).as('date'),db.ref(DESCRIPTION).as('description'),db.ref(DURATION).as("duration")).from(EXERCISE).where(`${EXERCISE}._id`, "=", _id).then(data => {
        return data;
    })
    .catch(err => {console.error(err);})
}
const GetExerciseLogs = async (db, id, from, to, limit) => {
    let user = await GetUserByID(db, id);
    if(user) {  //if user is in db
        let exerciseLogs = await getAllExercises(db, id);   //then get all exercise logs for that user
        let filteredLogs = [];
        if(from || to) {  //if from or to date is supplied
            let fromDate = (new Date(from)).getTime();  //convert from date into milliseconds
            let toDate = (new Date(to)).getTime();  //convert to date into milliseconds
            filteredLogs = filterDate(fromDate, toDate, exerciseLogs, filteredLogs);    //filter exercise logs from "from date" to "to date"
            if(filteredLogs.length === 0) { //if no match found after filtering
                user.count = 0;
                user.logs = filteredLogs;
                return user;    
            }
        }
        if(limit) { //if limit is supplied
            if(filteredLogs.length > 0) {   //if any logs are filtered 
                if(limit < filteredLogs.length){    //if limit is less than filtered logs otherwise nothing to be done...
                    filteredLogs.length = limit //apply limit to filtered logs
                }
            }
            else {  //else apply limit to unfiltered/actual/complete logs
                if(limit < exerciseLogs.length)
                    exerciseLogs.length = limit;    
            }
        }
        if(filteredLogs.length > 0) {
            user.count = filteredLogs.length;
            user.logs = filteredLogs;
        }
        else {
            user.count = exerciseLogs.length;
            user.logs = exerciseLogs;
        }
    }
    return user;
}

//----------------------------------------------------------------------//
const filterDate = (fromDate, toDate, exerciseLogs, arr) => {
    arr = exerciseLogs.filter((exercise) => {
        if(exercise.Date) {
            let date = (new Date(exercise.Date)).getTime();
            if(fromDate === null)   //if from date is not given, 
                fromDate = 0;   // set fromDate to 0, bcz no starting limit, so start from 0
            if(toDate === null) //if no end Date is given,
                toDate = date;  //then just use date of exercise as limit
            return (date >= fromDate && date <= toDate);    // ? true : false;
        }
        else return false;
    });
    return arr;
}
/*const changeObjProperty = (obj, newName, oldName) => {
    Object.defineProperty(obj, newName, Object.getOwnPropertyDescriptor(obj, oldName));
    delete obj["id"];
}
const getRequiredUserForm = (user) => {
    if(user) {
        changeObjProperty(user, "_id", "id");
    }
}*/

module.exports = {
    CreateAllTables,
    AddUser,
    AddExercise,
    GetAllUsers,
    GetExerciseLogs,
}