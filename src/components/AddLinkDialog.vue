<script setup>
import { ref } from "vue";
import { Node } from "@/core/network/components/Node";

const props = defineProps({
  from: Node,
  to: Node,
});

const emit = defineEmits(["close", "resolve"]);

const confirm = () => {
  // do something
  console.log("confirm pressed", selection.value.from, selection.value.to);
  emit(
    "resolve",
    props.from.getConnectorByID(selection.value.from),
    props.to.getConnectorByID(selection.value.to)
  );
};

const cancel = () => {
  console.log("cancel pressed");
  emit("close");
};

const selection = ref({
  from: props.from.getNextFreeConnector().id,
  to: props.to.getNextFreeConnector().id,
});
</script>

<template>
  <div class="flex flex-col gap-3">
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
    <menu class="flex gap-2">
      <button @click="cancel" class="rounded bg-red-400 p-2">Cancel</button>
      <button @click="confirm" class="rounded bg-green-500 p-2">Confirm</button>
    </menu>
  </div>
</template>
