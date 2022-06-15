<script setup>
import { computed, ref, watch } from "vue";

import { Host } from "@/core/network/components/Host";

import IconClose from "./icons/IconClose.vue";
import NetworkInterfaceEdit from "./NetworkInterfaceEdit.vue";
import IpAddrInputField from "./IpAddrInputField.vue";

const props = defineProps({
  node: {
    type: Host,
    required: true,
  },
});

watch(
  () => props.node,
  () => (iface.value = ifaceList.value[0])
);

const emit = defineEmits(["close"]);

const name = computed({
  get: () => props.node.getName(),
  set: (value) => props.node.setName(value),
});

const ifaceList = computed(() => props.node.getIfaceList());
const iface = ref(ifaceList.value[0]);

const dhcpConf = computed({
  get: () => props.node.dhcpServer.getConfig(),
  set: (value) => props.node.dhcpServer.setConfig(value),
});

const dhcpServerRunning = computed(() => props.node.dhcpServer.isRunning());

const toogleDhcpServer = () => {
  dhcpServerRunning.value
    ? props.node.dhcpServer.stop()
    : props.node.dhcpServer.start();
};

const close = () => {
  emit("close");
};
</script>

<template>
  <div class="flex flex-col gap-2 p-2 overflow-y-auto">
    <header class="flex justify-between">
      <h3 class="font-bold">Node {{ node.getNodeID() }} Settings:</h3>
      <icon-close
        @click="close"
        class="w-6 h-6 text-center align-middle bg-gray-700 text-white rounded-full"
      />
    </header>
    <div>
      <span>Name: </span>
      <input
        v-model="name"
        :placeholder="name ?? 'enter new host name'"
        class="rounded p-1"
      />
    </div>

    <div class="flex justify-between border-t pt-2">
      <h3 class="font-bold">IP-Config:</h3>
      <select v-model="iface" class="text-sm rounded">
        <option v-for="iface in ifaceList" :key="iface.name" :value="iface">
          {{ iface.name }}
        </option>
      </select>
    </div>

    <network-interface-edit :iface="iface" />

    <div v-if="node.getName() === 'Server'">
      <!-- ugly workaround fix later. -->
      <div class="flex justify-between border-t pt-2">
        <h3 class="font-bold">DHCP-Server:</h3>
        <button
          class="rounded p-1 text-sm bg-gray-100"
          :class="dhcpServerRunning ? 'bg-red-300' : 'bg-green-300'"
          @click="toogleDhcpServer"
        >
          {{ dhcpServerRunning ? "Stop" : "Start" }}
        </button>
      </div>

      <div class="flex flex-col gap-1 mt-2">
        <ip-addr-input-field v-model="dhcpConf.first" label="Range-Start" />
        <ip-addr-input-field v-model="dhcpConf.last" label="Range-End" />
        <ip-addr-input-field
          v-model="dhcpConf.snm"
          isMask
          label="Subnetzmaske"
        />
        <ip-addr-input-field v-model="dhcpConf.gw" label="Gateway" />
        <ip-addr-input-field v-model="dhcpConf.dns" label="DNS" />
        <p class="text-right">Running: {{ dhcpServerRunning ? "✔️" : "❌" }}</p>
      </div>
    </div>
  </div>
</template>
