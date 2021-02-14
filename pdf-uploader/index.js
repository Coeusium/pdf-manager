const fs = require('fs');
const path = require('path');
const FileType = require('file-type');
const {addPdf} = require('../src/utilities/pdf-utilities');
const {execute} = require("@almaclaine/mysql-utils");

const dataPath = process.argv[2];
const filePath = process.argv[3];

if (!dataPath) throw new Error('Must pass valid data directory path as first parameter to pdf-uploader');
if (!filePath) throw new Error('Must pass valid files directory path as second parameter to pdf-uploader');

// Check and create data directory

const resolvedDataPath = path.resolve(dataPath);
if (fs.existsSync(resolvedDataPath)) {
    if (!fs.statSync(resolvedDataPath).isDirectory()) {
        throw new Error(`${resolvedDataPath} exists but is not a directory`);
    }
} else {
    try {
        fs.mkdirSync(resolvedDataPath);
        console.log('Succeeded making data directory');
    } catch (e) {
        console.error(e);
    }
}

// Check file path directory exists

const resolvedFilePath = path.resolve(filePath);
if (fs.existsSync(resolvedFilePath) && !fs.statSync(resolvedFilePath).isDirectory()) {
    throw new Error(`${resolvedFilePath} exists but is not a directory`);
}

const directories = [resolvedFilePath];
let files = [];

(async () => {
    while (directories.length > 0) {
        const tmpDir = directories.shift();
        files = fs.readdirSync(tmpDir);
        for (const file of files) {
            const tmpPath = path.join(tmpDir, file);
            if (fs.statSync(tmpPath).isDirectory()) {
                directories.push(tmpPath);
            } else {
                const {ext} = await FileType.fromStream(fs.createReadStream(tmpPath)) || {};
                if (ext === 'pdf') {
                    const firstLetter = file[0];
                    if (firstLetter === '.') continue;
                    const tmpSubDir = path.join(resolvedDataPath, firstLetter);
                    if (!fs.existsSync(tmpSubDir)) fs.mkdirSync(tmpSubDir);
                    const newFileName = file.replace(/ /g, '_');
                    const newFilePath = path.join(tmpSubDir, newFileName);
                    if(fs.existsSync(newFilePath)) continue;
                    console.log(`Loading File: ${newFilePath}`);
                    const data = fs.readFileSync(tmpPath);
                    fs.writeFileSync(newFilePath, data);
                    const dbInfo = {
                        host: 'localhost',
                        user: 'root',
                        database: 'pdf_manager',
                        password: process.env.MYSQL_PW
                    }
                    await addPdf(dbInfo, newFilePath);
                }
            }
        }
    }
    process.exit(0);
})();
