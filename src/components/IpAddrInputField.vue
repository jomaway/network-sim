<script lang="ts" setup>
import { computed } from "vue";
//import { IPv4Addr } from "@/core/network/protocols/IPv4";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  label: String,
  isMask: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const computedValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit("update:modelValue", value);
  },
});

const onEnter = () => {
 // do nothing yet
}

</script>

<template>
  <label class="inline-flex items-center justify-end gap-2">
    <span class="text-right">{{ label }}:</span>
    <input
      v-model.trim="computedValue"
      :placeholder="'none'"
      @keyup.enter="onEnter"
      class="rounded px-1 w-36 invalid:bg-red-300"
      :pattern="
        isMask
          ? '^(((255\.){3}(255|254|252|248|240|224|192|128|0+))|((255\.){2}(255|254|252|248|240|224|192|128|0+)\.0)|((255\.)(255|254|252|248|240|224|192|128|0+)(\.0+){2})|((255|254|252|248|240|224|192|128|0+)(\.0+){3}))$'
          : '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
      "
    />
  </label>
</template>
