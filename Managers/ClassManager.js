const fs = require('fs')
const {
    promisify
} = require('util')
const path = require("path");
const Utils = require('../utils.js')
const ErrManager = require('./ErrorManager');
const { UserManagement } = require('./UserManager.js');
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

let classes = []

const ClassManagement = {
    GetClasses: async () => {
        const data = await readFile('../db/classes/all.json', 'utf-8');
        obj = JSON.parse(data);
        classes = obj.classes;
        return classes;
    },
    RegisterClass: async (grade, section, classTeacher, admin, schoolID) => {
        if(!UserManagement.isAdmin(admin)) return ErrManager.ThrowError.Permissions.Insufficient();
        GetClasses();
        if (Utils.ClassExists(grade, section, classes))
            return ErrManager.ThrowError.Registration.Classes.ClassExists();
        let newClass = {
            id: Date.now().toString(),
            grade: grade,
            section: section,
            classTeacher: classTeacher,
            createdBy: admin,
            students: [],
            schedule: [],
            schoolID: schoolID,
        }
        classes.push(newClass);
        const data = await readFile('../db/classes/all.json', 'utf-8');
        obj = JSON.parse(data);
        var classes = obj.classes;
        classes.push(newClass)
        json = JSON.stringify(obj, 2, null);
        await writeFile('../db/classes/all.json', json, 'utf-8');
        return newClass;
    }
}

module.exports = {
    ClassManagement
}