<script>
  import { goto } from "@roxi/routify"
  import { ActionMenu, MenuItem, Icon, notifications } from "@budibase/bbui"
  import ConfirmDialog from "components/common/ConfirmDialog.svelte"
  import { datasources, queries } from "stores/backend"

  export let query

  let confirmDeleteDialog

  async function deleteQuery() {
    const wasSelectedQuery = $queries.selected
    const selectedDatasource = $datasources.selected
    await queries.delete(query)
    if (wasSelectedQuery === query._id) {
      $goto(`./datasource/${selectedDatasource}`)
    }
    notifications.success("Query deleted")
  }

  async function duplicateQuery() {
    try {
      await queries.duplicate(query)
    } catch (e) {
      notifications.error(e.message)
    }
  }
</script>

<ActionMenu>
  <div slot="control" class="icon">
    <Icon size="S" hoverable name="MoreSmallList" />
  </div>
  <MenuItem icon="Delete" on:click={confirmDeleteDialog.show}>Delete</MenuItem>
  <MenuItem icon="Duplicate" on:click={duplicateQuery}>Duplicate</MenuItem>
</ActionMenu>

<ConfirmDialog
  bind:this={confirmDeleteDialog}
  okText="Delete Query"
  onOk={deleteQuery}
  title="Confirm Deletion"
>
  Are you sure you wish to delete this query? This action cannot be undone.
</ConfirmDialog>

<style>
  div.icon {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
  }
</style>
