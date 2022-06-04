<script setup>
import ModalDialog from "@/components/dialogs/ModalDialog.vue";
import { ref, shallowRef } from "vue";

const dialogRef = shallowRef();
const isVisible = ref(false);
const dialogInstance = ref();

const openDialog = (component, props) => {
  isVisible.value = true;
  return new Promise((resolve) => {
    dialogRef.value = {
      childComponent: component,
      props: props,
      resolve: resolve,
    };
  });
};

const hideDialog = () => {
  isVisible.value = false;
};

const onClose = () => {
  hideDialog();
  dialogRef.value.resolve("cancel");
  dialogRef.value = null;
};

const onConfirm = (data) => {
  hideDialog();
  if (data) dialogRef.value.resolve(data);
  else dialogRef.value.resolve("confirm");
  dialogRef.value = null;
};

defineExpose({ openDialog });
</script>

<template>
  <modal-dialog :open="isVisible">
    <component
      :is="dialogRef.childComponent"
      v-if="dialogRef"
      v-bind="dialogRef.props"
      ref="dialogInstance"
      @confirm="onConfirm"
      @cancel="onClose"
    />
  </modal-dialog>
</template>
