const fs = require('fs')
const {
    promisify
} = require('util')
const path = require("path");
const Utils = require('../utils.js')
const ErrManager = require('./ErrorManager')
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

const UserManagement = {
    isAdmin: (user) => {
        if(user.type == "admin") return true;
        else return false;
    },
    isStudent: (user) => {
        if(user.type == "student") return true;
        else return false;
    },
    isTeacher: (user) => {
        if(user.type == "classTeacher") return true;
        else return false;
    },
    EditForAllCurrentUsers: async (field, value) => {
        const data = await readFile('./db/users_secure.json', 'utf-8');
        obj = JSON.parse(data);
        for(var i = 0; i < obj.users.length; i++){
            obj.users[i][field] = value;
        }
        var users = obj.users;
        json = JSON.stringify(obj, 2, null);
        await writeFile('./db/users_secure.json', json, 'utf-8');
        return users;
    },
    EditForUser: async (field, value, id) => {
        const data = await readFile('./db/users_secure.json', 'utf-8');
        obj = JSON.parse(data);
        const user = obj.users.find(o => o.id == id);
        user[field] = value;
        var users = obj.users;
        json = JSON.stringify(obj, 2, null);
        await writeFile('./db/users_secure.json', json, 'utf-8');
        return users;
    }
}

module.exports = {
    UserManagement
}