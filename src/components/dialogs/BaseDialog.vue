<script setup>
import IconClose from "@/components/icons/IconClose.vue";
defineProps({
  title: {
    type: String,
    default: "File Picker",
  },
});

const emit = defineEmits(["confirm", "cancel"]);

const onClose = () => {
  emit("cancel");
};

const onConfirm = (data) => {
  emit("confirm", data);
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <header class="flex justify-between gap-2">
      <slot name="header">
        <!-- Default -->
        <h2 class="font-bold">{{ title }}</h2>
      </slot>
      <icon-close class="bg-red-300 rounded-full" @click="onClose"></icon-close>
    </header>
    <main>
      <slot></slot>
    </main>
    <footer>
      <slot name="footer">
        <!-- Default -->
        <button class="rounded p-2 text-sm bg-amber-400" @click="onConfirm">
          Confirm
        </button>
      </slot>
    </footer>
  </div>
</template>
