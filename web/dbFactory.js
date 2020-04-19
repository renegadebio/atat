
const DatastoreDB = require("./dbDatastore");

module.exports = (config) => {

    const { dbURI } =  config;

    if (!dbURI) {
        throw new Error("Configuration did not have a dbURI field.");
    }

    const [_, dbType] = /^(.*):/.exec(dbURI);

    switch (dbType) {
        case "gcd":
            return new DatastoreDB(dbURI);

        default:
            throw new Error("Invalid dbURI");
    }
}
