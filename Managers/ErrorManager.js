const ErrorManagement = {
    ThrowError: {
        Registration: {
            Classes: {
                ClassExists: async () => {
                    return console.log("Error: Class Already Exists");
                }
            }
        },
        Permissions: {
            Insufficient: async () => {
                return console.log("Error: Insufficient permissions to do this task");
            }
        },
        Development: {
            TODO: async () => {
                return console.log("Error: TODO");
            }
        }
    }
}

module.exports = {
    ErrorManagement
}