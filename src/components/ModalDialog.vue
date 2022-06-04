<script lang="ts" setup>
import { onMounted, ref, watchEffect } from "vue";

const dialog = ref();
const internalOpen = ref(false);

const props = defineProps({
  open: Boolean,
  inline: Boolean,
});

function openCloseDialog() {
  if (!dialog?.value) return;
  if (props.open) dialog.value.show();
  else dialog.value.close();
}

function showHideDialog() {
  if (!dialog?.value) return;
  if (props.open) dialog.value.showModal();
  else dialog.value.close();
}

onMounted(() => {
  watchEffect(() => {
    if (props.open !== internalOpen.value) {
      props.inline ? openCloseDialog() : showHideDialog();
      internalOpen.value = props.open;
    }
  });
});
</script>

<template>
  <Transition name="fade">
    <dialog ref="dialog" role="dialog" class="rounded">
      <slot />
    </dialog>
  </Transition>
</template>
