<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  label: String,
});

const emit = defineEmits(["update:modelValue"]);

const computedValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit("update:modelValue", value);
  },
});
</script>

<template>
  <label class="inline-flex items-center mt-3">
    <input
      type="checkbox"
      class="form-checkbox h-5 w-5 text-teal-600 rounded"
      v-model="computedValue"
    /><span class="ml-2 text-gray-700">{{ label }}</span>
  </label>
</template>
