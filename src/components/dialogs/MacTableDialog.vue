<script setup lang="ts">
import { Switch } from "../../core/network/components/Switch";
import MacTable from "../MacTable.vue";
import BaseDialog from "./BaseDialog.vue";

const props = defineProps({
  networkSwitch: {
    type: Switch,
    required: true,
  },
});

const emit = defineEmits(["confirm"]);

const confirm = () => {
  emit("confirm");
};

const dialogTitle = `Mac Table ${props.networkSwitch.getName()}`;
</script>

<template>
  <base-dialog :title="dialogTitle" @confirm="confirm">
    <mac-table :data="networkSwitch.getMacTable()" />
  </base-dialog>
</template>
