const Log = require("etlogger");

const codecFactory = require("./codec");
/**
 * The idea behind the item scan is that we want to capture that you hit this
 * url and whatever data we can record right now, but we don't want to leave
 * you at this URL because you might reload the page in your browser or
 * something like that so we are going to record all your information and
 * then redirect you to a new place where you can maybe add more information
 * about this item.
 *
 * @param ctx
 * @returns {function(...[*]=)}
 */
module.exports = (ctx) => {

    const codec = codecFactory({ name: ctx.codecName, key: ctx.codecKey });

    return async (req, resp) => {

        const { headers } = req;

        const { encid } = req.params;

        let itemId = 0;
        try {
            itemId = codec.decode(encid);
        } catch (e) {
            Log.warn(e);
            resp.status(404).send("Not Found").end();
            return;
        }

        // Don't need to await for this
        try {
            ctx.db.newItemScan(itemId, {
                country: headers["x-appengine-country"],
                city: headers["x-appengine-city"],
                region: headers["x-appengine-region"],
                cityLatLong: headers["x-appengine-citylatlong"],
                ip: headers["x-appengine-user-ip"],
                userAgent: headers["user-agent"],
            });
        } catch (e) {
            Log.error("Saving newItemScan ", e);
        }

        resp.status(200).send({ id: itemId, headers: req.headers });
        // resp.redirect(302, ctx.itemUrl + req.params.id);
    };
};

