<script setup>
import { computed } from 'vue';
import { NetworkInterface } from '@/core/network/components/NetworkInterface';
import IpAddrInputField from "./IpAddrInputField.vue";

const props = defineProps({
  iface: NetworkInterface,
});

const addr = computed({
  get: () => props.iface.getIpAddr(),
  set: (value) => props.iface.setIpAddr(value),
});

const snm = computed({
  get: () => props.iface.getSubnetmask(),
  set: (value) => props.iface.setSubnetmask(value),
});

const gw = computed({
  get: () => props.iface.getGateway(),
  set: (value) => props.iface.setGateway(value),
});

const dns = computed({
  get: () => props.iface.getDns(),
  set: (value) => props.iface.setDns(value),
});

const isStaticConfig = computed(() => props.iface.static);

</script>

<template>
  <div class="flex flex-col gap-1">
    <ip-addr-input-field
      :modelValue="iface.getMacAddr()"
      label="MAC-Adresse"
      disabled
    />
    <ip-addr-input-field v-model="addr" label="IP-Adresse" :disabled="isStaticConfig" />
    <ip-addr-input-field v-model="snm" isMask label="Subnetzmaske" :disabled="isStaticConfig"/>
    <ip-addr-input-field v-model="gw" label="Gateway" :disabled="isStaticConfig"/>
    <ip-addr-input-field v-model="dns" label="DNS" :disabled="isStaticConfig"/>
    <p class="text-right">Static: {{ isStaticConfig ? "✔️" : "❌" }}</p>
    <!--<check-box v-model="isStaticConfig" label="Static Config" class="justify-end"/>-->
  </div>
</template>
