<script>
  import { Icon } from "@budibase/bbui"
  import { createEventDispatcher } from "svelte"

  export let icon
  export let withArrow = false
  export let withActions = true
  export let indentLevel = 0
  export let text
  export let border = true
  export let selected = false
  export let opened = false
  export let draggable = false
  export let iconText
  export let iconColor

  const dispatch = createEventDispatcher()

  function onIconClick(event) {
    event.stopPropagation()
    dispatch("iconClick")
  }
</script>

<div
  class="nav-item"
  class:border
  class:selected
  style={`padding-left: ${indentLevel * 14}px`}
  {draggable}
  on:dragend
  on:dragstart
  on:dragover
  on:drop
  on:click
  ondragover="return false"
  ondragenter="return false"
>
  <div class="content">
    {#if withArrow}
      <div class:opened class="icon arrow" on:click={onIconClick}>
        <Icon size="S" name="ChevronRight" />
      </div>
    {/if}

    <slot name="icon" />
    {#if iconText}
      <div class="iconText" style={iconColor ? `color: ${iconColor};` : ""}>
        {iconText}
      </div>
    {:else if icon}
      <div class="icon">
        <Icon color={iconColor} size="S" name={icon} />
      </div>
    {/if}
    <div class="text">{text}</div>
    {#if withActions}
      <div class="actions">
        <slot />
      </div>
    {/if}
  </div>
</div>

<style>
  .nav-item {
    border-radius: var(--border-radius-s);
    cursor: pointer;
    color: var(--grey-7);
    transition: background-color
      var(--spectrum-global-animation-duration-100, 130ms) ease-in-out;
  }
  .nav-item.selected {
    background-color: var(--grey-2);
    color: var(--ink);
  }
  .nav-item:hover {
    background-color: var(--grey-3);
  }
  .nav-item:hover .actions {
    visibility: visible;
  }

  .content {
    padding: 0 var(--spacing-s);
    height: 32px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .icon {
    font-size: 16px;
    flex: 0 0 20px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }
  .icon.arrow {
    margin: 0 -2px 0 -6px;
    font-size: 12px;
  }
  .icon.arrow.opened {
    transform: rotate(90deg);
  }
  .icon + .icon {
    margin-left: -4px;
  }

  .text {
    flex: 1 1 auto;
    font-weight: 600;
    font-size: var(--spectrum-global-dimension-font-size-75);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .actions {
    visibility: hidden;
    width: 20px;
    height: 20px;
    cursor: pointer;
    position: relative;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  .iconText {
    margin-top: 1px;
    font-size: var(--spectrum-global-dimension-font-size-50);
  }
</style>
