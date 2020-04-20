const Log = require("etlogger");

const { Datastore } = require("@google-cloud/datastore");

const db = require("./db");

class DatastoreDB extends db {

    constructor(uri) {
        super(uri);

        // Basically ignore the URI, if we are being created just get
        // the credentials from the local environment letting the
        // datastore library take care of itself

        this.datastore = new Datastore();
    }

    /**
     * Google's best practices doc says you want to avoid monotonically
     * increasing ids, so instead of using item ids directly (which are
     * simple integers for human readability), this method reverses them
     * lexically so that they are more distributed numerically. We also
     * go ahead and convert them to a datastore int type since that is
     * almost certainly how we will use them immediately after this call.
     *
     * Best practices reference: https://cloud.google.com/datastore/docs/best-practices
     *
     * @param itemId
     */
    dsItemIdFor(itemId) {
        if (typeof itemId !== "number" || !itemId) {
            throw new Error("Invalid item id");
        }

        const idStr = `${itemId}`;
        let reversed = "";
        for (let i = idStr.length - 1; i >= 0; i -= 1) {
            reversed += idStr[i];
        }
        for (let i = idStr.length - 1; i >= 0; i -= 1) {
            reversed += idStr[i];
        }

        return this.datastore.int(reversed);
    }

    async newItemScan(itemId, values) {
        Log.debugi("newItemScan(", itemId, ") : ", values);

        const { datastore } = this;

        const dsItemId = this.dsItemIdFor(itemId);

        const scanKey = datastore.key(["Item", dsItemId, "Scan"]);

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
