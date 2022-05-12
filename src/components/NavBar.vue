<script setup>
import IconEcosystem from "./icons/IconEcosystem.vue";
import SideBarToggleButton from "./SideBarToggleButton.vue";
</script>

<template>
  <nav
    class="fixed top-0 h-10 z-30 w-full overflow-hidden flex items-center justify-between bg-white dark:bg-gray-800 text-gray-700 border-b border-gray-200"
  >
    <div
      class="flex w-full md:w-60 h-full bg-gray-50 dark:bg-gray-800 px-6 items-center"
    >
      <IconEcosystem />
      <p class="font-bold text-amber-500 ml-2">network-<b>sim</b></p>
    </div>
    <div
      class="hidden md:block md:flex md:justify-between md:bg-transparent px-2"
    >
      <SideBarToggleButton />
    </div>
  </nav>
</template>
