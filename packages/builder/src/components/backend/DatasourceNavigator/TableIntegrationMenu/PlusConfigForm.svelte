<script>
  import {
    Heading,
    Body,
    Divider,
    InlineAlert,
    Button,
    notifications,
    Modal,
    Table,
  } from "@budibase/bbui"
  import { datasources, integrations, tables } from "stores/backend"
  import CreateEditRelationship from "components/backend/Datasources/CreateEditRelationship.svelte"
  import CreateExternalTableModal from "./CreateExternalTableModal.svelte"
  import ArrayRenderer from "components/common/renderers/ArrayRenderer.svelte"
  import ConfirmDialog from "components/common/ConfirmDialog.svelte"
  import { goto } from "@roxi/routify"

  export let datasource
  export let save

  let tableSchema = {
    name: {},
    primary: { displayName: "Primary Key" },
  }
  let relationshipSchema = {
    tables: {},
    columns: {},
  }
  let relationshipModal
  let createExternalTableModal
  let selectedFromRelationship, selectedToRelationship
  let confirmDialog

  $: integration = datasource && $integrations[datasource.source]
  $: plusTables = datasource?.plus
    ? Object.values(datasource?.entities || {})
    : []
  $: relationships = getRelationships(plusTables)
  $: schemaError = $datasources.schemaError
  $: relationshipInfo = relationshipTableData(relationships)

  function getRelationships(tables) {
    if (!tables || !Array.isArray(tables)) {
      return {}
    }
    let pairs = {}
    for (let table of tables) {
      for (let column of Object.values(table.schema)) {
        if (column.type !== "link") {
          continue
        }
        // these relationships have an id to pair them to each other
        // one has a main for the from side
        const key = column.main ? "from" : "to"
        pairs[column._id] = {
          ...pairs[column._id],
          [key]: column,
        }
      }
    }
    return pairs
  }

  function buildRelationshipDisplayString(fromCol, toCol) {
    function getTableName(tableId) {
      if (!tableId || typeof tableId !== "string") {
        return null
      }
      return plusTables.find(table => table._id === tableId)?.name || "Unknown"
    }
    if (!toCol || !fromCol) {
      return "Cannot build name"
    }
    const fromTableName = getTableName(toCol.tableId)
    const toTableName = getTableName(fromCol.tableId)
    const throughTableName = getTableName(fromCol.through)

    let displayString
    if (throughTableName) {
      displayString = `${fromTableName} through ${throughTableName} → ${toTableName}`
    } else {
      displayString = `${fromTableName} → ${toTableName}`
    }
    return displayString
  }

  async function updateDatasourceSchema() {
    try {
      await datasources.updateSchema(datasource)
      notifications.success(`Datasource ${name} tables updated successfully.`)
      await tables.fetch()
    } catch (err) {
      notifications.error(`Error updating datasource schema: ${err}`)
    }
  }

  function onClickTable(table) {
    tables.select(table)
    $goto(`../../table/${table._id}`)
  }

  function openRelationshipModal(fromRelationship, toRelationship) {
    selectedFromRelationship = fromRelationship || {}
    selectedToRelationship = toRelationship || {}
    relationshipModal.show()
  }

  function createNewTable() {
    createExternalTableModal.show()
  }

  function relationshipTableData(relations) {
    return Object.values(relations).map(relationship => ({
      tables: buildRelationshipDisplayString(
        relationship.from,
        relationship.to
      ),
      columns: `${relationship.from?.name} to ${relationship.to?.name}`,
      from: relationship.from,
      to: relationship.to,
    }))
  }
</script>

<Modal bind:this={relationshipModal}>
  <CreateEditRelationship
    {datasource}
    {save}
    close={relationshipModal.hide}
    {plusTables}
    fromRelationship={selectedFromRelationship}
    toRelationship={selectedToRelationship}
  />
</Modal>

<Modal bind:this={createExternalTableModal}>
  <CreateExternalTableModal {datasource} />
</Modal>

<ConfirmDialog
  bind:this={confirmDialog}
  okText="Fetch tables"
  onOk={updateDatasourceSchema}
  onCancel={() => confirmDialog.hide()}
  warning={false}
  title="Confirm table fetch"
>
  <Body>
    If you have fetched tables from this database before, this action may
    overwrite any changes you made after your initial fetch.
  </Body>
</ConfirmDialog>

<Divider size="S" />
<div class="query-header">
  <Heading size="S">Tables</Heading>
  <div class="table-buttons">
    <Button secondary on:click={() => confirmDialog.show()}>
      Fetch tables
    </Button>
    <Button cta icon="Add" on:click={createNewTable}>New table</Button>
  </div>
</div>
<Body>
  This datasource can determine tables automatically. Budibase can fetch your
  tables directly from the database and you can use them without having to write
  any queries at all.
</Body>
{#if schemaError}
  <InlineAlert
    type="error"
    header="Error fetching tables"
    message={schemaError}
    onConfirm={datasources.removeSchemaError}
  />
{/if}
<Table
  on:click={({ detail }) => onClickTable(detail)}
  schema={tableSchema}
  data={Object.values(plusTables)}
  allowEditColumns={false}
  allowEditRows={false}
  allowSelectRows={false}
  customRenderers={[{ column: "primary", component: ArrayRenderer }]}
/>
{#if plusTables?.length !== 0}
  <Divider size="S" />
  <div class="query-header">
    <Heading size="S">Relationships</Heading>
    <Button primary on:click={openRelationshipModal}>
      Define relationship
    </Button>
  </div>
  <Body>
    Tell budibase how your tables are related to get even more smart features.
  </Body>
{/if}
<Table
  on:click={({ detail }) => openRelationshipModal(detail.from, detail.to)}
  schema={relationshipSchema}
  data={relationshipInfo}
  allowEditColumns={false}
  allowEditRows={false}
  allowSelectRows={false}
/>

<style>
  .query-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin: 0 0 var(--spacing-s) 0;
  }

  .table-buttons {
    display: flex;
    gap: var(--spacing-m);
  }
</style>
