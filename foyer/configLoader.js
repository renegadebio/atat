const Log = require("etlogger");

const fs = require("fs");

class ConfigLoader {

    constructor(defaults) {
        this.values = {};

        if (defaults) {
            this.defaults = defaults;
            Object.entries(defaults).forEach(([k,v]) => {
                this.values[k] = v;
            })
        } else {
            this.defaults = {}
        }
    }

    loadFromEnv(prefix = "RB_") {
        Object.entries(process.env).forEach(([k, v]) => {
            if (!prefix) {
                this.values[k] = v;
                return;
            }

            if (k.startsWith(prefix)) {
                const valKey = k.substring(prefix.length);
                this.values[valKey] = v;
            }
        });

        this.updateCalculatedValues();
    }

    async loadFromJSONFile(filename) {
        const text = await fs.promises.readFile(filename, "utf8");
        this.loadFromJSON(text);
    }

    loadFromJSON(text) {
        const data = JSON.parse(text);

        Object.entries(data).forEach(([k, v]) => {
            this.values[k] = v;
        });

        this.updateCalculatedValues();
    }

    loadFromJSONFileSync(filename) {
        const text = fs.readFileSync(filename, "utf8");
        this.loadFromJSON(text);
    }

    tryLoadFromJSONFileSync(filename) {
        try {
            this.loadFromJSONFileSync(filename);
        } catch (ex) {
            if (ex.code === "ENOENT") {
                Log.debugi("Ignoring missing config file ", filename);
            } else {
                Log.warni("Ignoring failure to load config from ", filename,
                    " : ", ex);
            }
        }
    }

    updateCalculatedValues() {
        this.values.debug = false;

        if (this.values.debug) {
            this.values.isDebug = true;
        }
    }

    logConfig() {
        Log.infoi("config = ", this.values);
    }
}

module.exports = ConfigLoader;