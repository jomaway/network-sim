<script setup>
defineProps({
  position: {
    top: Number,
    right: Number,
  }, // top:
});
</script>

<template>
  <div ref="floatMenuWrapper" class="absolute right-2 top-2">
    <slot />
  </div>
</template>
