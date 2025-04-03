const { repairJson } = require('json-repair-js');
const { exec } = require('child_process');

const printerName = "HP";
const printerUri = "ipp://localhost:60000/ipp/print";

const PagesOnPage = {
    SINGLE: 1,
    TWO: 2,
    FOUR: 4,
    EIGHT: 8,
    NINE: 9,
    SIXTEEN: 16
};

const Sides = {
    ONE: "one-sided",
    TWO_PORTRAIT: "two-sided-long-edge",
    TWO_LANDSCAPE: "two-sided-short-edge"
};

const Orientation = {
    PORTRAIT: 3,
    LANDSCAPE_NORMAL: 4,
    LANDSCAPE_REVERSED: 5,
    PORTRAIT_REVERSED: 6
};

class PrinterInfo {
    constructor() {
        this.name = printerName;
        this.model = '';
        this.media = [];
        this.color = false;
        this.sides = '';
        this.alerts = [];
    }
}

function perror(message) {
    console.error("ERROR:", message);
}

function getPrinterInfo(callback) {
    exec(`ipptool -j ${printerUri} get-printer-attributes.test`, (error, stdout, stderr) => {
        if (error) {
            perror(`Error executing command: ${stderr}`);
            return callback(error);
        }

        const outputFixed = repairJson(stdout);
        let jsonOutput;

        try {
            jsonOutput = JSON.parse(outputFixed);
        } catch (e) {
            perror("Failed to parse JSON");
            return callback(e);
        }

        const info = new PrinterInfo();
        for (const obj of jsonOutput) {
            if (obj['group-tag'] === 'printer-attributes-tag') {
                info.model = obj['printer-info'];
                info.media = obj['media-supported'];
                info.color = obj['color-supported'];
                info.sides = obj['sides-supported'];
                info.alerts = obj['printer-state-reasons'];
            }
        }
        callback(null, info);
    });
}

function sendToPrinter(filePath, mediaSize = "A4", copies = 1, sides = Sides.ONE, orientation = Orientation.PORTRAIT, startPage = 0, endPage = 0, pagesOnPage = PagesOnPage.SINGLE, callback) {
    const options = [
        '-E',
        '-d', printerName,
        '-o', `"print-quality=4 media=${mediaSize} copies=${copies} sides=${sides} orientation-requested=${orientation}"`
    ];

    if (endPage !== 0) {
        options.push('-o');
        if (startPage === endPage) {
            options.push(`page-ranges=${startPage}`);
        } else {
            options.push(`page-ranges=${startPage}-${endPage}`);
        }
    }

    if (pagesOnPage !== PagesOnPage.SINGLE) {
        options.push('-o');
        options.push(`number-up=${pagesOnPage}`);
    }

    options.push(filePath);
    console.log(options);

    exec(`lp ${options.join(' ')}`, (error, stdout, stderr) => {
        if (error) {
            perror("Printing failed!");
            return callback(error);
        }
        callback(null, true);
    });
}

const args = process.argv.slice(2);
if (args.length !== 1) {
    console.log("Usage: node main.js [file]");
    process.exit(1);
}

const filePath = args[0];

getPrinterInfo((error, info) => {
    if (error) {
        perror("Can't retrieve printer info");
    } else {
        console.log('Printer info:', info);
    }
});

sendToPrinter(filePath, "A5", 1, Sides.ONE, Orientation.LANDSCAPE_NORMAL, 0, 0, PagesOnPage.SINGLE, (error, success) => {
    if (error) {
        console.log("Something went wrong");
    } else {
        console.log(`File ${filePath} has been sent to printer successfully`);
    }
});
