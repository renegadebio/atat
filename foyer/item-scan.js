const Log = require("etlogger");

const util = require("util");


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
module.exports = (ctx) => (req, resp) => {

    console.log(util.inspect(req, { depth: 1, colors: true, sorted: true }));

    // ctx.db.newItemScan(req.param.id, )

    resp.redirect(302, config.itemUrl + req.param.id);
};
