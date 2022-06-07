<script setup>
import { computed, ref, watch } from "vue";
import { Node } from "@/core/network/components/NetworkComponents";
import IconClose from "./icons/IconClose.vue";
import IpAddrInputField from "./IpAddrInputField.vue";
import { SID } from "../core/network/services/Services";
import { NodeType } from "../core/network/components/NetworkComponents";
import NetworkInterfaceEdit from "./edits/NetworkInterfaceEdit.vue";

const props = defineProps({
  node: {
    type: Node,
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



let dhcpConf = null;
let hasDHCPServer = null;

if (props.node.isType(NodeType.Host)) {
  dhcpConf = computed({
    get: () => props.node.useService(SID.DHCPServer)?.conf,
    set: (value) => props.node.useService(SID.DHCPServer).setConf(value),
  })
  
  hasDHCPServer = computed(() => props.node.services.has(SID.DHCPServer))
}


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

    <network-interface-edit :iface="iface"/>

    <div class=" border-t pt-2" v-if="hasDHCPServer">
      <h3 class="font-bold">DHCP-Server:</h3>
      <div class="flex flex-col gap-1 mt-2">
        <ip-addr-input-field v-model="dhcpConf.first" label="Range-Start" />
        <ip-addr-input-field v-model="dhcpConf.last"  label="Range-End" />
        <ip-addr-input-field v-model="dhcpConf.snm" isMask label="Subnetzmaske" />
        <ip-addr-input-field v-model="dhcpConf.gw" label="Gateway" />
        <ip-addr-input-field v-model="dhcpConf.dns" label="DNS" />
      </div>
    </div>
  </div>
</template>
