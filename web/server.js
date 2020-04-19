const Log = require("etlogger");

const express = require("express");

const ConfigLoader = require("./configLoader");
const DbFactory = require("./dbFactory");

const itemScan = require("./itemScan");
const scanned = require("./scanned");

////////

const loader = new ConfigLoader({
    port: 3000,

    itemUrl: "/scanned/",
});

loader.tryLoadFromJSONFileSync("./config.json");
loader.loadFromEnv();
loader.logConfig(["codecKey"]);

const context = loader.values;

///////

context.db = DbFactory(context);


///////

const app = express();


app.get("/a/:encid", itemScan(context));

app.get("/scanned/:id", scanned(context));


///////
const port = process.env.PORT || context.port;

app.listen(port, () => {
    Log.info(`Listening on port ${port}`);
});
