<script setup>
import { useNetworkStore } from "@/stores/network";
import BaseDialog from "./BaseDialog.vue";
import CheckBox from "../CheckBox.vue";

const networkStore = useNetworkStore();
</script>

<template>
  <base-dialog title="Settings Dialog">
    <div class="flex flex-col gap-1">
      <h2>Options:</h2>
      <div class="flex flex-col gap-1 align-middle">
        <check-box
          v-for="(value, key) in networkStore.settings"
          :key="key"
          :label="key"
          v-model="networkStore.settings[key]"
        />
      </div>
    </div>
  </base-dialog>
</template>
