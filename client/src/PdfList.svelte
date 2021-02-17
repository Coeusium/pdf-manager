<script>
    import {onMount} from 'svelte';
    import PdfResult from "./PdfResult.svelte";
    import Tag from "./Tag.svelte";

    let limit = 20;
    let page = 0;
    let data = [];
    let order = 'asc';
    let orderedBy = 'name';
    let term = '';
    let tags = [];

    $: {
        (async () => {
            const res = await fetch(`/api/pdf?limit=${limit}&page=${page}&order=${order}&order_by=${orderedBy}&term=${term}`);
            data = await res.json();

            if(!term) {
                tags = [];
            } else {
                const res2 = await fetch(`/api/tag/search?tagQ=${term}`);
                tags = await res2.json();
            }
        })();
    }

    async function orderBy(type) {
        if (order === 'desc' && orderedBy === type) {
            order = 'asc';
        } else {
            order = 'desc';
            orderedBy = type;
        }

        const res = await fetch(`/api/pdf?limit=${limit}&page=${page}&order=${order}&order_by=${orderedBy()}&term=${term}`);
        data = await res.json();
    }

    onMount(() => {
        document.body.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                if (page > 0) page--;
            }
            if (e.key === 'ArrowRight') {
                if (data.length === limit) {
                    page++;
                }
            }
        });
    });
</script>
<label>
    Results
    <input type="number" bind:value={limit}>
</label>
<label>
    Page
    <input type="number" bind:value={page}>
</label>
<label>
    Search
    <input type="text" bind:value={term}>
</label>
<div style="display: flex;">
    {#each tags as tag}
        <Tag tag_id={tag.tag_id} displayCount={true}/>
    {/each}
</div>
<div class="pdf-table-container">
    <table>
        <tr>
            <th on:click={()=>orderBy('name')}>Name</th>
            <th on:click={()=>orderBy('size')}>Size</th>
            <th on:click={()=>orderBy('pages')}>Pages</th>
            <th on:click={()=>orderBy('date_added')}>Date</th>
        </tr>
        {#each data as pdf}
            <PdfResult pdf={pdf}/>
        {/each}
    </table>
</div>

<style>
    th {
        margin: 0;
        padding: 16px;
        background-color: black;
        color: white;
        font-family: Helvetica, serif;
    }

    th:hover {
        color: black;
        background-color: white;
    }

    .pdf-table-container {
        height: 100%;
        display: flex;
        justify-content: center;
    }

    table {
        margin: 64px;
        width: 80vw;
        max-width: 1280px;
        border-spacing: 0;
    }
</style>
