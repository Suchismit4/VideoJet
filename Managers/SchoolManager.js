const fs = require('fs')
const {
    promisify
} = require('util')
const path = require("path");
const Utils = require('../utils.js')
const ErrManager = require('./ErrorManager')
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

const SchoolManagement = {
    GetAllSchools: async () => {
        return ErrManager.ErrorManagement.ThrowError.Development.TODO();
    },
    GetSchool: async (id) => {
        ErrManager.ErrorManagement.ThrowError.Development.TODO();
        return {
            id: id,
            name: "Delhi Public School Ruby Park",
            city: "Kolkata",
            state: "West Bengal",
            classes: [],
        }
    }
}

module.exports = {
    SchoolManagement
}