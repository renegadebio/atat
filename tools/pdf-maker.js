const fs = require("fs");

const { program } = require("commander");

const PdfPrinter = require("pdfmake");

const codecFactory = require("../web/codec");

function myParseInt(value, dummy) {
    return parseInt(value);
}

program
    .version("0.1.0")
    .option("-o, --out <path>", "output filename", "labels.pdf")
    .option("-s, --start <number>", "starting asset number", myParseInt, 10001)
    .option("-p, --pages <number>", "number of pages to generate", myParseInt, 1)
    .option("-c, --codec <name>", "name of codec to encrypt ids with", "plain")
    .option("-k, --key <secret>", "secret key for id encryption", "secret")
    .option("-u, --url <base>", "base url ids will be appended to", "HTTP://ITEM.EXAMPLE.COM/")
    .option("-l, --logo <filename>", "filename of svg logo file", "./logo.svg")
    .option("-t, --template <name>", "name of template to use", "5523")
    .option("-i, --instruction <instruction>", "instruction text", "Scan this QR code with a phone to update this item's location.")

program.parse(process.argv);

const codec = codecFactory({ name: program.codec, key: program.key });

let logo = false;
try {
    logo = fs.readFileSync(program.logo, "utf8");
} catch (e) {
    console.warn(`Unable to load logo from ${program.logo} :  ${e.message}`);
}

// In points
const logoWidth = 72;
const logoHeight = 12;

const templates = {

    // Avery 5523 WeatherProof 2"x4" Labels
    "5523": {
        columns: 2,
        columnGap: 13.55,

        headerMargin: 36,
        rowsPerPage: 5,

        labelWidth: 288,
        labelHeight: 144,

        pageWidth: 612,
        pageHeight: 792,

        label: () => ({
            columns: [
                {
                    stack: [
                        {
                            svg: logo,
                            fit: [120, 30],
                        },
                        {
                            text: `Item # ${nextId}`,
                            margin: [0, 8, 0, 0],
                        },
                        {
                            text: program.instruction,
                            margin: [0, 8, 0, 0],
                            lineHeight: 1.4,
                        },
                    ],
                    margin: [32, 32, 0, 0],
                },
                {
                    width: "30%",
                    margin: [0, 32, 0, 0],
                    qr: `${program.url}${codec.encode(nextId)}`,
                    eccLevel: 'Q',
                    fit: template.labelWidth / 3,
                }
            ],
                columnGap: 10,
        }),
    },

    // Avery 5195 Return address labels
    "5195": {
        columns: 4,
        columnGap: 21.6,

        headerMargin: 39.6,
        rowsPerPage: 15,

        labelWidth: 126,
        labelHeight: 48,

        pageWidth: 612,
        pageHeight: 792,

        label: () => ({
            columns: [
                {
                    stack: [
                        {
                            svg: logo,
                            fit: [60, 13],
                            alignment: "center",
                        },
                        {
                            text: `Item # ${nextId}`,
                            margin: [0, 6, 0, 0],
                            fontSize: 9,
                            alignment: "center",
                        },
                    ],
                    margin: [8, 8, 0, 0],
                },
                {
                    width: "30%",
                    margin: [0, 4, 0, 0],
                    qr: `${program.url}${codec.encode(nextId)}`,
                    eccLevel: 'L',
                    fit: template.labelHeight - 10,
                    alignment: "center",
                }
            ],
                columnGap: 10,
        }),
    },
};

if (program.template === "big") program.template = "5523";
if (program.template === "small") program.template = "5195";

const template = templates[program.template];

if (!template) {
    console.error(`Unknown template ${program.template}`);
    process.exit(-1);
}

/////////////

const contentWidth = (template.labelWidth * template.columns) +
    (template.columnGap * (template.columns - 1));

const tableWidths = [];
for(let i=0; i < template.columns; i += 1) {
    tableWidths.push(template.labelWidth);
    if (i+1 < template.columns) {
        tableWidths.push(template.columnGap);
    }
}

const doc = {
    pageSize: { width: template.pageWidth, height: template.pageHeight },
    content: [],
    pageMargins: [
        (template.pageWidth - contentWidth) / 2, // Left
        template.headerMargin, // Top
        0, // Right
        0, // Bottom
    ],
    defaultStyle: {
        font: "Helvetica",
    },
}

/////////

let nextId = program.start;

function addPage(pageNum) {
    const pageTable = {
        table: {
            heights: template.labelHeight,
            widths: tableWidths,
            body: [],
        },
        layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0,
        },
    };
    if (pageNum) {
        pageTable.pageBreak = "before";
    }

    const body = pageTable.table.body;

    for (let row = 0; row < template.rowsPerPage; row += 1) {
        const row = [];

        for(let col = 0; col < template.columns; col += 1) {
            row.push(template.label());
            nextId += 1;

            if (col + 1 < template.columns) {
                row.push(""); // empty text for the gap
            }
        }

        body.push(row);
    }

    doc.content.push(pageTable);
}

for (let i=0; i < program.pages; i += 1) {
    addPage(i);
}

const fonts = {
    Courier: {
        normal: 'Courier',
        bold: 'Courier-Bold',
        italics: 'Courier-Oblique',
        bolditalics: 'Courier-BoldOblique'
    },
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    },
    Times: {
        normal: 'Times-Roman',
        bold: 'Times-Bold',
        italics: 'Times-Italic',
        bolditalics: 'Times-BoldItalic'
    },
    Symbol: {
        normal: 'Symbol'
    },
    ZapfDingbats: {
        normal: 'ZapfDingbats'
    }
};

const printer = new PdfPrinter(fonts);
const pdfDoc = printer.createPdfKitDocument(doc);
pdfDoc.pipe(fs.createWriteStream(program.out));
pdfDoc.end();

console.log(program.out);
console.log(`${program.pages} pages, ${program.pages * template.columns * template.rowsPerPage } labels`);
console.log(`[${program.start} to ${nextId - 1}]`);
