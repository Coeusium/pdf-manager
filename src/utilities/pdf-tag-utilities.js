const {execute} = require('@almaclaine/mysql-utils');

async function createPdfTagTable(dbInfo) {
    const createPdfTable = `CREATE TABLE IF NOT EXISTS pdf_tag (
        pdf_id VARCHAR(128) NOT NULL,
        tag_id VARCHAR(16) NOT NULL,
        PRIMARY KEY(pdf_id, tag_id),
        FOREIGN KEY (pdf_id) REFERENCES pdf(pdf_id),
        FOREIGN KEY (tag_id) REFERENCES tag(tag_id)
    );`
    await execute(dbInfo, createPdfTable);
}

async function tagCount(dbInfo, tag_id) {
    const sql = `SELECT COUNT(*) FROM pdf_tag WHERE tag_id = ?;`;
    return (await execute(dbInfo, sql, [tag_id]))[0]["COUNT(*)"];
}

async function tagSearch(dbInfo, tagQ) {
    const sql = `SELECT * from tag WHERE tag LIKE '%${tagQ}%';`;
    return execute(dbInfo, sql);
}

async function addPdfTag(dbInfo, pdf_id, tag_id) {
    const sql = `INSERT INTO pdf_tag (pdf_id, tag_id) VALUES (?, ?);`;
    await execute(dbInfo, sql, [pdf_id, tag_id]);
}

async function deletePdfTag(dbInfo, pdf_id, tag_id) {
    const sql = `DELETE FROM pdf_tag where pdf_id = ? AND tag_id = ?;`;
    await execute(dbInfo, sql, [pdf_id, tag_id]);
}

async function listPdfTagsByPdfId(dbInfo, pdf_id, page = 0, limit = 20) {
    const sql = `SELECT * FROM pdf_tag where pdf_id = ? LIMIT ? OFFSET ?;`;
    return (await execute(dbInfo, sql, [pdf_id, limit, (page * limit)]));
}

async function listPdfTagsByTagId(dbInfo, tag_id, page = 0, limit = 20) {
    const sql = `SELECT * FROM pdf_tag where tag_id = ? LIMIT ? OFFSET ?;`;
    return (await execute(dbInfo, sql, [tag_id, limit, (page * limit)]));
}

async function tagSearchWithTags(dbInfo, term = '', tags = [], type = 'name', order = 'ASC', page = 0, limit = 20) {
    if (tags.length === 0) return [];
    let sql = `SELECT DISTINCT tag.*
               FROM pdf_tag, pdf, tag
               WHERE pdf_tag.tag_id = tag.tag_id
               AND tag LIKE "%${term}%"
               AND (pdf_tag.pdf_id IN 
                 (SELECT pdf_tag.pdf_id
                 FROM pdf_tag, pdf, tag
                 WHERE pdf_tag.tag_id = tag.tag_id
                 AND (tag.tag_id IN (${tags.map(e => `'${e}'`)}))
                 AND pdf.pdf_id = pdf_tag.pdf_id)
               )
               AND pdf.pdf_id = pdf_tag.pdf_id LIMIT ? OFFSET?;`;
    return (await execute(dbInfo, sql, [limit, (page * limit)]));
}

module.exports = {
    createPdfTagTable,
    addPdfTag,
    listPdfTagsByPdfId,
    listPdfTagsByTagId,
    deletePdfTag,
    tagCount,
    tagSearch,
    tagSearchWithTags
};
