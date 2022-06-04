<script setup>
defineProps({
  modelValue: File,
  text: {
    type: String,
    default: "Upload",
  },
});

const emit = defineEmits(["update:modelValue"]);
const handleFileChange = (e) => {
  console.log("test", e.target.files[0]);
  emit("update:modelValue", e.target.files[0]);
};
</script>

<template>
  <div class="flex items-stretch justify-start relative">
    <label class="inline-flex">
      <span class="bg-teal-400 p-2 rounded-l-md">{{ text }}</span>
      <input type="file" @change="handleFileChange" class="hidden" />
    </label>
    <div>
      <span
        v-if="modelValue"
        class="inline-flex px-4 py-2 justify-center bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-r"
      >
        {{ modelValue.name }}
      </span>
      <span
        v-else
        class="inline-flex px-4 py-2 justify-center bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-r"
      >
        No file selected
      </span>
    </div>
  </div>
</template>
