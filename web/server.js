const Log = require("etlogger");

const express = require("express");

const ConfigLoader = require("./configLoader");
const DbFactory = require("./dbFactory");

const loader = new ConfigLoader({
    port: 3000,

    itemUrl: "/scan/",
});

loader.tryLoadFromJSONFileSync("./config.json");
loader.loadFromEnv();
loader.logConfig();

const context = loader.values;

///////

context.db = DbFactory(context);


///////

const app = express();

const itemScan = require("./item-scan");

app.get("/a/:encid", itemScan(context));

const port = process.env.PORT || context.port;

app.listen(port, () => {
    Log.info(`Listening on port ${port}`);
});
