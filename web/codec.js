
const crypto = require("crypto");

function keyFromMaterial(str, len) {
    const out = Buffer.alloc(len);

    const inBytes = Buffer.from(str);
    if (inBytes.length >= len) {
        inBytes.copy(out, 0, 0, len);
    } else {
        // Need to pad the buffer
        let cursor = 0;
        while (cursor < len) {
            let toCopy = len - cursor;
            if (inBytes.length < toCopy) {
                toCopy = inBytes.length;
            }

            inBytes.copy(out, cursor, 0, toCopy);
            cursor += toCopy;
        }
    }

    return out;
}

function urlSafe(b64) {
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Returns a codec which uses aes-128-cbc. The returned string is a base64
 * encoding of a buffer with the following structure:
 *
 *   Marker : 1 byte = set to 'A' 0x41
 *   ivSeed : 4 bytes = a value which is repeated 4 times to create the
 *                      16 byte iv seed
 *   ciphertext : 32 bytes = the encrypted block of data
 *
 * The encrypted data itself consists of a 4 byte Int32BE and then padding.
 *
 * @param opts
 * @returns {{encode: (function(*=): string)}}
 */
function aesCodec(opts) {

    if (!opts.key) {
        throw new Error("key can not be empty");
    }

    // Always 16 bit key
    const key = keyFromMaterial(opts.key, 16);

    return {
        encode: (idNum) => {
            let ivSeed = crypto.randomBytes(4);

            const iv = Buffer.alloc(16,0);
            ivSeed.copy(iv, 0);
            ivSeed.copy(iv, 4);
            ivSeed.copy(iv, 8);
            ivSeed.copy(iv, 12);

            // AES-128 block must always be 16 bytes long even if we
            // don't use much of it
            const plain = Buffer.alloc(16, 0);
            plain.writeInt32BE(idNum);

            // console.log(key);
            // console.log(iv);
            // console.log(plain);
            const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
            const b1 = cipher.update(plain);
            const b2 = cipher.final();

            const marker = Buffer.alloc(1, 65); // "A"
            const final = Buffer.concat([marker, ivSeed, b1, b2]);

            return urlSafe(final.toString("base64"));
        },


        decode: (str) => {
            const buf = Buffer.from(str, "base64");

            if (buf.length !== 37) {
                throw new Error("Encoded string did not contain 37 bytes of data");
            }

            if (buf[0] !== 65) {
                throw new Error("Marker character invalid");
            }

            const iv = Buffer.alloc(16, 0);
            buf.copy(iv, 0, 1, 5);
            buf.copy(iv, 4, 1, 5);
            buf.copy(iv, 8, 1, 5);
            buf.copy(iv, 12, 1, 5);

            const cBlock = buf.slice(5);

            const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);

            const p1 = decipher.update(cBlock);
            const p2 = decipher.final();

            const id = p1.readInt32BE();

            return id;
        }
    }
}


/**
 * Returns a codec which uses des-cbc. The returned string is a base64
 * url safe encoding of a buffer with the following structure:
 *
 *   Marker : 1 byte = set to 'D' 68
 *   ivSeed : 4 bytes = a value which is repeated twice to create the
 *                      8 byte iv seed
 *   ciphertext : 8 bytes = the encrypted block of data
 *
 * The encrypted data itself consists of a 4 byte Int32BE and then padding.
 *
 * @param opts
 * @returns {{encode: (function(*=): string)}}
 */
function desCodec(opts) {

    if (!opts.key) {
        throw new Error("key can not be empty");
    }

    // Always 8 bit key for des
    const key = keyFromMaterial(opts.key, 8);

    return {
        encode: (idNum) => {
            let ivSeed = crypto.randomBytes(4);

            const iv = Buffer.alloc(8,0);
            ivSeed.copy(iv, 0);
            ivSeed.copy(iv, 4);

            const plain = Buffer.alloc(4, 0);
            plain.writeInt32BE(idNum);

            // console.log("key  ", key);
            // console.log("iv   ", iv);
            // console.log("plain", plain);
            const cipher = crypto.createCipheriv("des-cbc", key, iv);
            const b1 = cipher.update(plain);
            const b2 = cipher.final();

            const marker = Buffer.alloc(1, 68); // "D"
            const final = Buffer.concat([marker, ivSeed, b1, b2]);

            // console.log("final ", final);
            return urlSafe(final.toString("base64"));
        },


        decode: (str) => {
            const buf = Buffer.from(str, "base64");

            if (buf.length !== 13) {
                throw new Error("Encoded string did not contain 21 bytes of data");
            }

            if (buf[0] !== 68) {
                throw new Error("Marker character invalid");
            }

            const iv = Buffer.alloc(8, 0);
            buf.copy(iv, 0, 1, 5);
            buf.copy(iv, 4, 1, 5);

            const cBlock = buf.slice(5);

            const decipher = crypto.createDecipheriv("des-cbc", key, iv);

            const p1 = decipher.update(cBlock);
            const p2 = decipher.final();

            const id = p2.readInt32BE();

            return id;
        }
    }
}


/**
 * Generate a encoder / decoder based on the given options.
 *
 * opts.name = undefined
 *      The default encoder / decoder which is a simple pass through
 *
 * opts.name = "aes"
 *      An aes codec
 *
 *      .key = key string, 16 bytes long or will be repeated
 *
 * opts.name = "des"
 *      A des codec
 *
 *      .key = key string, 8 bytes long or will be repeated
 *
 *
 * The returned coder object has the methods:
 *
 *      encode: (idNum: int) => encodedValue: string
 *
 *      decode: (encodedVal: string) => idNum: int
 *
 *
 * @param opts
 */
module.exports = (opts) => {
    if (!opts.name) {
        throw new Error("No id codec was named");
    }


    if (opts.name === "plain") {
        return {
            encode: (val) => `${val}`,
            decode: (val) => parseInt(val) || 0,
        };
    }

    if (opts.name === "aes") {
        return aesCodec(opts);
    }

    if (opts.name === "des") {
        return desCodec(opts);
    }

    throw new Error(`Unable to find a codec named ${opts.name}`);
};

// ------------------------------------------

if (!module.parent) {
    const name = process.argv[2] || "aes";

    const codec = module.exports({
        name,
        key: "Hello",
    });

    let original = 1001;
    console.log("Original ", original);

    let encoded = codec.encode(original);
    console.log("Encoded ", encoded);

    let decoded = codec.decode(encoded);
    console.log("Decoded ", decoded);

    if (original === decoded) {
        console.log("😍 It worked")
    } else {
        console.error("🚨 Puke")
    }
}
