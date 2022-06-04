<script setup>
import { ref } from "vue";
import FilePicker from "@/components/FilePicker.vue";
import IconClose from "@/components/icons/IconClose.vue";

defineProps({
  title: {
    type: String,
    default: "File Picker",
  },
});

const emit = defineEmits(["confirm", "cancel"]);
const file = ref();

const onConfirm = () => {
  emit("confirm", file.value);
  file.value = null;
};

const onClose = () => {
  emit("cancel");
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <header class="flex justify-between">
      <h2 class="font-bold">{{ title }}</h2>
      <icon-close class="bg-red-300 rounded-full" @click="onClose"></icon-close>
    </header>
    <file-picker v-model="file" />
    <button v-if="file" class="p-2 rounded bg-green-300" @click="onConfirm">
      Load
    </button>
  </div>
</template>
