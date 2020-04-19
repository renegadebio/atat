const Log = require("etlogger");

/**
 * The Db class is an abstract class that is extended by specific database
 * implementations.
 */
class Db {
    constructor(uri) {
        this.uri = uri;
    }

    /**
     * Should be called to record a new scan of a barcode. The itemId is
     * expected to be an actual integer and the values object contains
     * key/value pairs that should be recorded against this item id.
     *
     * Generally the fields which should be filled out are:
     *
     *      country
     *      city
     *      region
     *      citLatLong
     *      ip
     *      userAgent
     *
     * Depending on how the foyer endpoint is deployed there may be more or
     * less data available as well.
     *
     * The scan is recorded in the database along with a timestamp of when
     * it happened.
     *
     * @param itemId
     * @param values
     */
    async newItemScan(itemId, values) {

    }
}

module.exports = Db;
