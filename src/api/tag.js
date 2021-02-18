const {getTagScopedRouter, setupTagSystem} = require('sql-tag-system-koa-route');
const Router = require('@koa/router');
const dbInfo = require('../dbInfo');
const {addPdfTag, deletePdfTag, listPdfTagsByPdfId, listPdfTagsByTagId, createPdfTagTable, tagCount, tagSearch, tagSearchWithTags} = require('../utilities/pdf-tag-utilities');

setupTagSystem(dbInfo).then(() => createPdfTagTable(dbInfo).then(() => {
}));
const router = getTagScopedRouter(dbInfo);

const pdfRouter = new Router();

pdfRouter.post('/', async (ctx) => {
    const {pdf_id, tag_id} = ctx.query;
    await addPdfTag(dbInfo, pdf_id, tag_id);
    ctx.body = {};
});

pdfRouter.delete('/', async (ctx) => {
    const {pdf_id, tag_id} = ctx.query;
    await deletePdfTag(dbInfo, pdf_id, tag_id);
    ctx.body = {};
});

pdfRouter.get('/', async (ctx) => {
    const {pdf_id, tag_id, page, limit} = ctx.query;
    if (pdf_id) {
        ctx.body = await listPdfTagsByPdfId(dbInfo, pdf_id, page, limit);
    } else if (tag_id) {
        ctx.body = await listPdfTagsByTagId(dbInfo, tag_id, page, limit);
    } else {
        ctx.body = [];
    }
});

const countRouter = new Router();

countRouter.get('/', async (ctx) => {
    const {tag_id} = ctx.query;
    ctx.body = {count: await tagCount(dbInfo, tag_id), tag_id};
});

const searchRouter = new Router();

searchRouter.get('/', async (ctx) => {
    const {tagQ, tags} = ctx.query;
    if (tags) {
        ctx.body = await tagSearchWithTags(dbInfo, tagQ, JSON.parse(tags));
    } else {
        ctx.body = await tagSearch(dbInfo, tagQ);
    }
})

router.use('/tag/pdf', pdfRouter.routes(), pdfRouter.allowedMethods());
router.use('/tag/count', countRouter.routes(), countRouter.allowedMethods());
router.use('/tag/search', searchRouter.routes(), searchRouter.allowedMethods());

module.exports = router;
