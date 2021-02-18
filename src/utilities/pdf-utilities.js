const {execute} = require('@almaclaine/mysql-utils');
const path = require('path');
const fs = require('fs');
const {PDFDocument} = require('pdf-lib');
const {makeid} = require('../utilities/utilities');

async function createDatabase(dbInfo) {
    const createDb = 'CREATE DATABASE IF NOT EXISTS pdf_manager;';
    await execute(dbInfo, createDb);
}

async function createPdfTable(dbInfo) {
    const createPdfTable = `CREATE TABLE IF NOT EXISTS pdf (
        pdf_id VARCHAR(128) NOT NULL UNIQUE,
        date_added timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        size INT NOT NULL,
        name VARCHAR(512) NOT NULL,
        pages INT NOT NULL,
        file_location VARCHAR(1024) NOT NULL,
        parent_id VARCHAR(128) DEFAULT NULL,
        PRIMARY KEY(pdf_id),
        FOREIGN KEY (parent_id) REFERENCES pdf(pdf_id)
    );`
    await execute(dbInfo, createPdfTable);
}

async function updatePdfName(dbInfo, pdf_id, name) {
    const sql = `UPDATE pdf SET name = ? WHERE pdf_id = ?;`;
    await execute(dbInfo, sql, [name, pdf_id]);
}

async function updatePdfPages(dbInfo, pdf_id, pages) {
    const sql = `UPDATE pdf SET pages = ? WHERE pdf_id = ?;`;
    await execute(dbInfo, sql, [pages, pdf_id]);
}


async function addPdf(dbInfo, filePath, parent = '') {
    const name = path.basename(filePath.replace('.pdf', ''));
    let sql = `INSERT INTO pdf (pdf_id, size, name, pages, file_location`;
    if (parent) {
        sql += ', parent_id) VALUES (?, ?, ?, ?, ?, ?);'
    } else {
        sql += ') VALUES (?, ?, ?, ?, ?)';
    }
    const size = fs.statSync(filePath).size;
    const pdfDoc = await PDFDocument.load(fs.readFileSync(filePath));
    const pages = pdfDoc.getPageCount();
    const id = makeid(128);
    if (parent) {
        await execute(dbInfo, sql, [id, size, name, pages, filePath, parent]);
    } else {
        await execute(dbInfo, sql, [id, size, name, pages, filePath]);
    }
    return id;
}

async function getPdf(dbInfo, pdf_id = '') {
    const sql = `SELECT * FROM pdf WHERE pdf_id = ? LIMIT 1;`;
    return (await execute(dbInfo, sql, [pdf_id]))[0];
}

async function listPdfs(dbInfo, type = 'name', order = 'ASC', page = 0, limit = 20) {
    const sql = `SELECT * FROM pdf WHERE parent_id IS NULL ORDER BY ${type} ${order} LIMIT ? OFFSET ?;`;
    return (await execute(dbInfo, sql, [limit, (page * limit)]));
}

async function searchPdfs(dbInfo, term = '', type = 'name', order = 'ASC', page = 0, limit = 20) {
    const sql = `SELECT * FROM pdf WHERE name LIKE '%${term}%' AND parent_id IS NULL ORDER BY ${type} ${order} LIMIT ? OFFSET ?;`;
    return (await execute(dbInfo, sql, [limit, (page * limit)]));
}

async function getChildrenPdfs(dbInfo, parent_id, page = 0, limit = 20) {
    const sql = `SELECT * FROM pdf WHERE parent_id = ? LIMIT ? OFFSET ?;`;
    return (await execute(dbInfo, sql, [parent_id, limit, (page * limit)]));
}
//
// async function tagSearchWithTags(dbInfo, term = '', tags = [], type = 'name', order = 'ASC', page = 0, limit = 20) {
//     if (tags.length === 0) return [];
//     console.log(tags);
//     let sql = `SELECT DISTINCT tag.*
//                FROM pdf_tag, pdf, tag
//                WHERE pdf_tag.tag_id = tag.tag_id
//                AND tag LIKE "%${term}%"
//                AND (pdf_tag.pdf_id IN
//                  (SELECT pdf_tag.pdf_id
//                  FROM pdf_tag, pdf, tag
//                  WHERE pdf_tag.tag_id = tag.tag_id
//                  AND (tag.tag_id IN (${tags.map(e => `'${e}'`)}))
//                  AND pdf.pdf_id = pdf_tag.pdf_id)
//                )
//                AND pdf.pdf_id = pdf_tag.pdf_id LIMIT ? OFFSET?;`;
//     return (await execute(dbInfo, sql, [limit, (page * limit)]));
// }

module.exports = {
    createDatabase,
    createPdfTable,
    addPdf,
    listPdfs,
    searchPdfs,
    getPdf,
    getChildrenPdfs,
    updatePdfName,
    updatePdfPages
}
