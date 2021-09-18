const {EXERCISE, USERS, DESCRIPTION, DURATION, DATE} = require('../Constants/Constants');

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
    table.string("Name");
}
const createExersiceTable = (table) => {
    table.decimal("_id");
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
    return await db.select("*").from(USERS).where("id", "=", Exercise[":_id"]).then(async (data) => {
        if(data.length) {
            const {date} = Exercise;
            let id = Exercise[":_id"];
            return await db(EXERCISE).insert({
                _id: id,
                Description: Exercise.description,
                Duration: Exercise.duration,
                Date: (date.length > 0 ) ? (new Date(date)).toDateString() : (new Date).toDateString()
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
    return await db.select("*").from(USERS).where("Name", "=", Name).then(data => {
        let user = data[0];
        getRequiredUserForm(user);
        return user;
    })
    .catch(err => {console.error(err)});
}
const GetUserByID = async (db, id) => {
    return await db.select("*").from(USERS).where("id", "=", id).then(data => {
        let user = data[0];
        getRequiredUserForm(user);
        return user;
    })
}
const GetAllUsers = async (db) => {
    return await db.select("*").from(USERS).then(data => {
        const usersData = data.map((user)=> {
            getRequiredUserForm(user);
            return user;
        })
        return usersData;
    })
    .catch(err=> {console.error(err);});
}
const GetExercise = async (db, _id) => {
    return await db.select("*").from(EXERCISE).where("_id", "=", _id).then(data => {
        return data[0];
    })
    .catch(err => {console.error(err);})
}
const getAllExercises = async (db, _id) => {
    return await db.select(DESCRIPTION, DURATION, DATE).from(EXERCISE).where("_id", "=", _id).then(data => {
        return data;
    })
    .catch(err => {console.error(err);})
}
const GetExerciseLogs = async (db, id, from, to, limit) => {
    let user = await GetUserByID(db, id);
    if(user) {
        let exerciseLogs = await getAllExercises(db, id);
        if(limit) {
            exerciseLogs.length = limit;
        }
        user.logs = exerciseLogs;
    }
    return user;
}

//----------------------------------------------------------------------//
const changeObjProperty = (obj, newName, oldName) => {
    Object.defineProperty(obj, newName, Object.getOwnPropertyDescriptor(obj, oldName));
    delete obj["id"];
}
const getRequiredUserForm = (user) => {
    if(user) {
        changeObjProperty(user, "_id", "id");
    }
}

module.exports = {
    CreateAllTables,
    AddUser,
    AddExercise,
    GetAllUsers,
    GetExerciseLogs,
}