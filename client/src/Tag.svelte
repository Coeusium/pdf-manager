<script>
    export let tag_id = null;
    let tag = '';
    let count = '';
    export let displayCount = false;

    $: {
        (async () => {
            const res = await fetch(`/api/tag?tag_id=${tag_id}`);
            const data = await res.json();
            tag = data.tag;

            const res2 = await fetch(`/api/tag/count?tag_id=${tag_id}`);
            const data2 = await res2.json();
            count = data2.count;
        })();
    }

</script>

<div>{tag}{displayCount ? `: ${count}` : ''}</div>

<style>
    div {
        margin: 8px;
        background-color: #eee;
        padding: 8px;

    }
</style>
