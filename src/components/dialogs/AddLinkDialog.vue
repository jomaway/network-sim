<script setup>
import { ref } from "vue";
import { Node } from "@/core/network/components/Node";
import BaseDialog from "./BaseDialog.vue";

const props = defineProps({
  from: Node,
  to: Node,
});

const emit = defineEmits(["confirm"]);

const confirm = () => {
  // do something
  console.log("confirm pressed", selection.value.from, selection.value.to);
  emit("confirm", {
    from: props.from.getConnectorByID(selection.value.from),
    to: props.to.getConnectorByID(selection.value.to),
  });
};

const selection = ref({
  from: props.from.getNextFreeConnector().id,
  to: props.to.getNextFreeConnector().id,
});
</script>

<template>
  <base-dialog title="Select interfaces" @confirm="confirm">
    <div class="flex gap-4 justify-center">
      <div class="flex flex-col gap-2 w-32">
        <h3>
          From: <b>{{ from.name ?? from.getNodeId() }}</b>
        </h3>
        <select class="rounded" v-model="selection.from">
          <option v-for="c in from.getFreeConnectors()" :key="c.id">
            {{ c.id }}
          </option>
        </select>
      </div>
      <div class="flex flex-col gap-2 w-32">
        <h3>
          To: <b>{{ to.name ?? to.getNodeId() }}</b>
        </h3>
        <select class="rounded" v-model="selection.to">
          <option v-for="c in to.getFreeConnectors()" :key="c.id">
            {{ c.id }}
          </option>
        </select>
      </div>
    </div>
  </base-dialog>
</template>
