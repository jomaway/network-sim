<script setup>
import { computed } from "vue";
import { useLayoutStore } from "@/stores/layout";
import IconAdd from "./icons/IconAdd.vue";

const layout = useLayoutStore();

const isOpen = computed(() => layout.isSidebarOpen);
</script>

<template>
  <button
    :class="[isOpen ? 'bg-amber-400' : '', 'rounded']"
    @click="layout.toggleSidebar"
  >
    <IconAdd />
  </button>
</template>
