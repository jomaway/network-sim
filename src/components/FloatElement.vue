<script setup>
defineProps({
  position: Object, // top:
});
</script>

<template>
  <div ref="floatMenuWrapper" class="absolute right-0 top-2 w-60">
    <slot />
  </div>
</template>
