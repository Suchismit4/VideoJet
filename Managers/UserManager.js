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

}

module.exports = {
    UserManagement
}