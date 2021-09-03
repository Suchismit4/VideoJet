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
            TODO: async (err) => {
                return console.log("Error: TODO " + err);
            }
        },
        General: {
            ClassNotFound: (id) => {
                return console.log("Error: Class was not found wih ID: " + id)
            }
        }
    }
}

module.exports = {
    ErrorManagement
}