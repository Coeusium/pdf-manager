const Router = require('@koa/router');
const fs = require('fs').promises;
const path = require('path');
const routes = new Router();
const {PDFDocument} = require('pdf-lib');
const {makeid} = require('../utilities/utilities');

const {listPdfs, getPdf, addPdf, getChildrenPdfs, searchPdfs, updatePdfName, updatePdfPages} = require('../utilities/pdf-utilities');
const {listPdfTagsByPdfId, addPdfTag} = require('../utilities/pdf-tag-utilities');

const dbInfo = require('../dbInfo');

routes.get('/', async (ctx) => {
    const {page, limit, pdf_id, parent_id, order, order_by, term} = ctx.query;
    if (pdf_id) {
        ctx.body = await getPdf(dbInfo, pdf_id);
    } else if (parent_id) {
        ctx.body = await getChildrenPdfs(dbInfo, parent_id, page, limit);
    } else {
        if (term) {
            ctx.body = await searchPdfs(dbInfo, term, order_by, order, page, limit);
        } else {
            ctx.body = await listPdfs(dbInfo, order_by, order, page, limit);
        }
    }
});

routes.post('/', async (ctx) => {
    const {pdf_id, name} = ctx.query;
    await updatePdfName(dbInfo, pdf_id, name);
    ctx.body = {};
});

routes.get('/file', async (ctx) => {
    const {pdf_id} = ctx.query;
    const pdfInfo = await getPdf(dbInfo, pdf_id);
    ctx.type = 'application/pdf';
    ctx.attachment(`${pdfInfo.name}.pdf`, {type: 'inline'});
    ctx.body = await fs.readFile(pdfInfo.file_location);
});

routes.delete('/file', async (ctx) => {
    const {pdf_id, pages} = ctx.query;
    const pdfInfo = await getPdf(dbInfo, pdf_id);
    const pdf = await PDFDocument.load(await fs.readFile(pdfInfo.file_location));
    const finalPages = JSON.parse(pages).filter(e => e < pdf.getPageCount()).sort();
    let pagesDeleted = 0;
    finalPages.forEach(e => pdf.removePage(e - pagesDeleted++));
    const finalDoc = await pdf.save();
    await fs.writeFile(pdfInfo.file_location, finalDoc);
    ctx.body = {};
});

routes.post('/file', async (ctx) => {
    const {pdf_id, pages} = ctx.query;
    const pdfInfo = await getPdf(dbInfo, pdf_id);
    const finalId = pdfInfo.parent_id ? pdfInfo.parent_id : pdfInfo.pdf_id;
    const newDoc = await PDFDocument.create();
    const pdf = await PDFDocument.load(await fs.readFile(pdfInfo.file_location));
    const finalPages = JSON.parse(pages).filter(e => e < pdf.getPageCount());
    const copiedPages = await newDoc.copyPages(pdf, finalPages);
    copiedPages.forEach(e => newDoc.addPage(e));
    const finalDoc = await newDoc.save();
    const docPath = path.join(process.env.HOME, 'pdf_data', 'children', `${pdfInfo.name}.child-${makeid(16)}.pdf`);
    await fs.writeFile(docPath, finalDoc);

    const newPdfId = await addPdf(dbInfo, docPath, finalId);

    let page = 0;
    let result = await listPdfTagsByPdfId(dbInfo, finalId, page++, 20);
    while (result.length > 0) {
        for(const {tag_id} of result) {
            await addPdfTag(dbInfo, newPdfId, tag_id);
        }

        result = await listPdfTagsByPdfId(dbInfo, finalId, page++, 20);
    }

    ctx.body = {pdf_id: newPdfId};
})

const router = new Router();

router.use(`/pdf`, routes.routes(), routes.allowedMethods());

module.exports = router;
