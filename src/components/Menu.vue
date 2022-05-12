<script setup>
import { ref, computed } from "vue";
import IconChevRight from "./icons/IconChevRight.vue";

const props = defineProps({
  menuItems: Array,
  show: Boolean,
  level: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["selected", "close"]);

// reference to menu itself
const menuRef = ref();

const selectedItem = ref(null);

const showSubMenu = computed(() => {
  return props.show && selectedItem.value !== null;
});

const reset = () => {
  selectedItem.value = null;
};

defineExpose({ reset });

const toggleMenu = () => {
  emit("close");
  reset();
};

const handleSelect = (itemName) => {
  const item = props.menuItems.find((item) => item.name === itemName);
  if (item["items"]) {
    selectedItem.value = item;
  } else {
    if (item.onSelect) item.onSelect();
    else console.warn("No select handler found for", itemName);
    toggleMenu();
  }
};

/*
const handleSubMenuSelect = (itemName, level) => {
  emit("selected", selectedItem.value.name+">"+itemName, level);
  toggleMenu();
};*/
</script>

<template>
  <div ref="menuRef" v-if="props.show" class="flex gap-1 items-start">
    <div class="min-h-8 min-w-20 bg-white rounded-md">
      <ul class="flex flex-col gap-1">
        <li
          v-for="item in menuItems"
          :key="item.name"
          class="p-2 flex justify-between cursor-pointer hover:bg-amber-200 first:hover:rounded-t-md last:hover:rounded-b-md"
          :class="selectedItem?.name == item.name ? 'bg-amber-200' : ''"
          @click="handleSelect(item.name)"
        >
          {{ item.name }}
          <span v-if="item.items" class="block w-6 h-6 slide-out">
            <icon-chev-right />
          </span>
        </li>
      </ul>
    </div>
    <div v-if="showSubMenu">
      <Menu
        :show="true"
        :menu-items="selectedItem?.items"
        :level="level + 1"
        @close="toggleMenu"
      />
    </div>
  </div>
</template>
