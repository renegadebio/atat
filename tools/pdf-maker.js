const fs = require("fs");

const { program } = require("commander");

const PdfPrinter = require("pdfmake");

function myParseInt(value, dummy) {
    return parseInt(value);
}

program
    .version("0.1.0")
    .option("-o, --out <path>", "output filename", "labels.pdf")
    .option("-s, --start <number>", "starting asset number", myParseInt, 10001)
    .option("-p, --pages <number>", "number of pages to generate", myParseInt, 1)

program.parse(process.argv);


let logo = false;
try {
    logo = fs.readFileSync("./logo.svg", "utf8");
} catch (e) {
    console.warn(`Unable to load logo from ./logo.svg :  ${e.message}`);
}

// In points
const logoWidth = 72;
const logoHeight = 12;

// In the future we'll have other label template

// For Avery 5523 WeatherProof 2"x4" Labels
const template = {
    columns: 2,
    columnGap: 13.55,

    headerMargin: 36,
    rowsPerPage: 5,

    labelWidth: 288,
    labelHeight: 144,

    pageWidth: 612,
    pageHeight: 792,
};


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
const instruction = "Please scan this QR code regularly to update the location of this item."

function label() {
    const out = {
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
                        text: instruction,
                        margin: [0, 8, 0, 0],
                        lineHeight: 1.4,
                    },
                ],
                margin: [32, 32, 0, 0],
            },
            {
                width: "30%",
                margin: [0, 32, 0, 0],
                qr: `HTTPS://ITEM.RENEGADE.BIO/A/${nextId}`,
                eccLevel: 'L',
                fit: template.labelWidth / 4,
                align: "center",
            }
        ],
        columnGap: 10,
    };

    nextId += 1;
    return out;
}


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
            row.push(label());

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
