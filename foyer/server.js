const Log = require("etlogger");

const express = require("express");

const ConfigLoader = require("./configLoader");

const loader = new ConfigLoader({
    port: 3000,

    itemUrl: "https://items.renegade.bio/itemScan/",
});

loader.tryLoadFromJSONFileSync("./config.json");
loader.loadFromEnv();
loader.logConfig();

const config = loader.values;

const app = express();

const itemScan = require("./item-scan");

const itemScanHandler = itemScan(config);

app.get("/a/:id", itemScanHandler);
app.get("/A/:id", itemScanHandler);

app.listen(config.port, () => {
    Log.info(`Listening on port ${config.port}`);
});
