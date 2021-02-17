<script>
    import {onMount} from 'svelte';
    import {querystring} from 'svelte-spa-router'
    import queryString from 'query-string';
    import Tag from "./Tag.svelte";

    const {pdf_id} = queryString.parse($querystring);

    let title = '';
    let children = '';
    let toDelete = '';
    let newTags = '';
    let newName = '';
    let src = `/api/pdf/file?pdf_id=${pdf_id}`;
    let tags = [];

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

<div>
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
        Add Tags
        <input type="text" placeholder="separate tags by commas" bind:value={newTags}>
        <button on:click={handleAddTags}>Submit</button>
    </label>

    <label>
        Change Name
        <input type="text" placeholder={title} bind:value={newName}>
        <button on:click={handleChangeName}>Submit</button>
    </label>
</div>

<div style="display: flex;">
    {#each tags as tag}
        <Tag tag_id={tag.tag_id}/>
    {/each}
</div>

<iframe title={title} src={src}></iframe>

<style>
    input {
        width: 320px;
    }

    iframe {
        width: 100%;
        height: 100%;
    }
</style>
