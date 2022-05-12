<script setup>
import { computed } from "vue";
import Menu from "./Menu.vue";

const props = defineProps({
  position: Object, // { x: number, y: number}
  items: Array,
});

const emit = defineEmits(["selected", "close"]);

const style = computed(() => {
  return {
    top: props.position.y + "px",
    left: props.position.x + "px",
  };
});

const close = () => {
  emit("close");
};
</script>

<template>
  <div class="fixed rounded-md" :style="style">
    <Menu :menu-items="items" :show="true" @close="close" />
  </div>
</template>
