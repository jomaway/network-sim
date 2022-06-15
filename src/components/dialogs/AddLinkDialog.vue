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
  emit("confirm", {
    from: selection.value.from,
    to: selection.value.to,
  });
};

const selection = ref({
  from: props.from.getNextFreePort(),
  to: props.to.getNextFreePort(),
});
</script>

<template>
  <base-dialog title="Select interfaces" @confirm="confirm">
    <div class="flex gap-4 justify-center">
      <div class="flex flex-col gap-2 w-32">
        <h3>
          From: <b>{{ from.name ?? from.getNodeId() }}</b>
        </h3>
        <select
          class="rounded"
          v-model="selection.from"
          v-if="from.isAddressable()"
        >
          <option
            v-for="iface in from
              .getIfaceList()
              .filter((iface) => !iface.port.isConnected())"
            :key="iface"
            :value="iface.port"
          >
            {{ iface.name }}
          </option>
        </select>
        <p v-else>use free port</p>
      </div>
      <div class="flex flex-col gap-2 w-32">
        <h3>
          To: <b>{{ to.name ?? to.getNodeId() }}</b>
        </h3>
        <select
          class="rounded"
          v-model="selection.to"
          v-if="to.isAddressable()"
        >
          <option
            v-for="iface in to
              .getIfaceList()
              .filter((iface) => !iface.port.isConnected())"
            :key="iface"
            :value="iface.port"
          >
            {{ iface.name }}
          </option>
        </select>
        <p v-else>use free port</p>
      </div>
    </div>
  </base-dialog>
</template>
