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
    let tags = new Set();
    let selectedTags = new Set();

    let combinedTags;

    $: {
        combinedTags = new Set([
            ...(Array.from(tags).map(e => e.tag_id)),
            ...selectedTags
        ]);
        console.log(combinedTags);
    }

    async function search() {
        const searchTags = Array.from(selectedTags.keys());
        const res = await fetch(`/api/pdf?limit=${limit}&page=${page}&order=${order}&order_by=${orderedBy}&term=${term}&tags=${searchTags.length === 0 ? '' : JSON.stringify(searchTags)}`);
        data = await res.json();
    }

    $: {
        (async () => {
            await search();

            if (term) {
                const searchTags = Array.from(selectedTags.keys());
                const res2 = await fetch(`/api/tag/search?tagQ=${term}&tags=${searchTags.length === 0 ? '' : JSON.stringify(searchTags)}`);
                tags = new Set(await res2.json());
            } else {
                tags = [];
            }
        })();
    }

    async function toggleTag(tag_id) {
        if (selectedTags.has(tag_id)) {
            selectedTags.delete(tag_id)
        } else {
            selectedTags.add(tag_id);
        }
        // force refresh
        const tmpSet = selectedTags;
        selectedTags = tmpSet;
    }

    async function orderBy(type) {
        if (order === 'desc' && orderedBy === type) {
            order = 'asc';
        } else {
            order = 'desc';
            orderedBy = type;
        }

        await search();
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
    {#each Array.from(combinedTags) as tag}
        <div on:click={() => toggleTag(tag)} style="margin: 8px;"
             class={selectedTags.has(tag) ? "selected-tag" : ''}>
            <Tag tag_id={tag} displayCount={true}/>
        </div>
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
    .selected-tag {
        border-radius: 8px;
        border: 4px solid gold;
    }

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
