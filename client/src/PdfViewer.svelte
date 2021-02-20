<script>
    import {onMount} from 'svelte';
    import {querystring} from 'svelte-spa-router'
    import queryString from 'query-string';
    import Tag, {tag_id} from "./Tag.svelte";

    const {pdf_id} = queryString.parse($querystring);

    let title = '';
    let children = '';
    let toDelete = '';
    let newTags = '';
    let newName = '';
    let openControls = false;
    let showModal = false;
    let src = `/api/pdf/file?pdf_id=${pdf_id}`;
    let tags = [];

    let tagToDelete = '';
    let tagToDeleteName = ''

    $: {
        (async () => {
            const res = await fetch(`/api/tag?tag_id=${tagToDelete}`);
            const data = await res.json();
            tagToDeleteName = data.tag;
        })();
    }

    function handleConfirmDelete(tag_id) {
        tagToDelete = tag_id;
        showModal = true;
    }

    function unsetDelete() {
        tagToDelete = '';
        tagToDeleteName = '';
        showModal = false;
    }

    async function handleDeleteTag() {
        await fetch(`/api/tag/pdf?tag_id=${tagToDelete}&pdf_id=${pdf_id}`, {method: 'DELETE'});
        unsetDelete();
        await getTags();
    }

    async function handleAddChildren() {
        const pageList = children.split(",")
            .map(e => e.replace(/ $/, '').replace(/^ /, ''))
            .map(e => parseInt(e))
            .filter(e => !isNaN(e))
            .map(e => e - 1);
        await fetch(`/api/pdf/file?pdf_id=${pdf_id}&pages=${JSON.stringify(pageList)}`, {method: 'POST'});
        children = '';
    }

    async function handleDeletePages() {
        const pageList = toDelete.split(",")
            .map(e => e.replace(/ $/, '').replace(/^ /, ''))
            .map(e => parseInt(e))
            .filter(e => !isNaN(e))
            .map(e => e - 1);
        await fetch(`/api/pdf/file?pdf_id=${pdf_id}&pages=${JSON.stringify(pageList)}`, {method: 'DELETE'});
        children = '';
        // trigger refresh
        const tmpSrc = src;
        src = '';
        setTimeout(() => src = tmpSrc, 0);
        toDelete = '';
    }

    let minPage = 0;
    let maxPage = 0;

    async function handleDeletePagesRange() {
        if(minPage === 0 || maxPage === 0) return;
        const pageList = [];
        for(let i = minPage; i <= maxPage; i++) pageList.push(i - 1);
        console.log(pageList);
        minPage = 0;
        maxPage = 0;
        await fetch(`/api/pdf/file?pdf_id=${pdf_id}&pages=${JSON.stringify(pageList)}`, {method: 'DELETE'});
        children = '';
        // trigger refresh
        const tmpSrc = src;
        src = '';
        setTimeout(() => src = tmpSrc, 0);
        toDelete = '';
    }

    async function getTags() {
        const res = await fetch(`/api/tag/pdf?pdf_id=${pdf_id}`);
        tags = await res.json();
    }

    async function handleAddTags() {
        const tags = newTags.split(",")
            .map(e => e.replace(/ $/, '').replace(/^ /, '')).join(',');
        const res = await fetch(`/api/tag?tag=${tags}`, {method: 'POST'});
        const newTagIds = await res.json();
        await Promise.all(newTagIds.map(async e => await fetch(`/api/tag/pdf?tag_id=${e}&pdf_id=${pdf_id}`, {method: 'POST'})));
        await getTags();
        newTags = '';
    }

    async function handleChangeName() {
        await fetch(`/api/pdf?pdf_id=${pdf_id}&name=${newName}`, {method: 'POST'});
        newName = '';
        await getTitle();
    }

    async function getTitle() {
        const res = await fetch(`/api/pdf?pdf_id=${pdf_id}`);
        title = (await res.json()).name;
        newName = title;
        await getTags();
    }

    onMount(getTitle);

</script>

{#if openControls}
    <label>
        Save Pages To Child
        <input type="text" placeholder="separate pages by commas" bind:value={children}>
        <button on:click={handleAddChildren}>Submit</button>
    </label>

    <label>
        Delete Pages
        <input type="text" placeholder="separate pages by commas" bind:value={toDelete}>
        <button on:click={handleDeletePages}>Submit</button>
    </label>
    <label>
        Delete Pages min/max
        <input type="number" min={0} bind:value={minPage}>
        <input type="number" min={0} bind:value={maxPage}>
        <button on:click={handleDeletePagesRange}>Submit</button>
    </label>
    <label>
        Add Tags
        <input type="text" placeholder="separate tags by commas" bind:value={newTags}>
        <button on:click={handleAddTags}>Submit</button>
    </label>

    <label>
        Change Name
        <input type="text" placeholder={title} bind:value={newName}>
        <button on:click={handleChangeName}>Submit</button>
    </label>
    <div style="display: flex;">
        {#each tags as tag}
            <div on:click={() => handleConfirmDelete(tag.tag_id)}>
                <Tag tag_id={tag.tag_id}/>
            </div>
        {/each}
    </div>
{/if}
<div class="opener" on:click={() => openControls = !openControls}>
    {openControls ? 'Close' : 'Open'}
</div>

<iframe title={title} src={src}></iframe>

{#if showModal}
    <div on:click|self={unsetDelete} class="delete-modal">
        <div class="confirm-delete">
            <h1>Delete?</h1>
            <h2 style="text-align: center;">{tagToDeleteName}</h2>
            <div class="confirm-buttons">
                <button on:click={handleDeleteTag}>Yes</button>
                <button on:click={unsetDelete}>No</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .delete-modal {
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .confirm-buttons {
        margin-top: 12px;
    }

    .confirm-delete {
        background-color: white;
        border-radius: 8px;
        padding: 32px;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    h1 {
        color: black;
    }

    input {
        width: 320px;
    }

    iframe {
        width: 100%;
        height: 100%;
    }
</style>
