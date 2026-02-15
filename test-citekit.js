
const { CiteKitClient } = require('citekit');

async function test() {
    console.log("Initializing CiteKit...");
    const client = new CiteKitClient();
    try {
        console.log("Listing maps...");
        const maps = client.listMaps();
        console.log("Maps:", maps);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
