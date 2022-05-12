<script setup>
import { ref } from "vue";
import IconMenu from "@/components/icons/IconMenu.vue";
import Menu from "./Menu.vue";

defineProps({
  menuItems: Array,
  position: Object, // { bottom: number ,left: number }
});

const menuRef = ref();
const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const close = () => {
  isMenuOpen.value = false;
  menuRef.value.reset();
};

defineExpose({ close });
</script>

<template>
  <div
    ref="floatMenuWrapper"
    class="absolute left-4 bottom-4 flex flex-col-reverse gap-4"
  >
    <div ref="menuButtonRef" class="bg-amber-400 rounded-lg">
      <span class="cursor-pointer" @click="toggleMenu()">
        <icon-menu fill="" />
      </span>
    </div>
    <Menu
      ref="menuRef"
      :menu-items="menuItems"
      :show="isMenuOpen"
      @close="close"
    />
  </div>
</template>
