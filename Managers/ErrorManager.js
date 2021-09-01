const ErrorManagement = {
    ThrowError: {
        Registration: {
            Classes: {
                ClassExists: async () => {
                    return console.log("Class Already Exists");
                }
            }
        }
    }
}

module.exports = {
    ErrorManagement
}