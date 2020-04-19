const Log = require("etlogger");

const { Datastore } = require("@google-cloud/datastore");

const datastore = new Datastore();

const db = require("./db");

class DatastoreDB extends db {

    constructor(uri) {
        super(uri);

        // Basically ignore the URI, if we are being created just get
        // the credentials from the local environment letting the
        // datastore library take care of itself
    }

    async newItemScan(itemId, values) {
        Log.debugi("newItemScan(", itemId, ") : ", values);
        if (typeof itemId !== "number") {
            throw new Error("Invalid item id");
        }

        const scanKey = datastore.key(["Item", datastore.int(itemId), "Scan"]);

        const data = {
            ...values,
            createdAt: Date.now(),
        }

        await datastore.save({ key: scanKey, data });

        Log.info("Saved scan with id ", scanKey.id);

        return scanKey.id;
    }
};

module.exports = DatastoreDB;
