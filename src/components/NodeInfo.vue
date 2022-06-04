<script setup>
import { computed, ref, watch } from "vue";
import { Node } from "../models/network/components/Node";

const props = defineProps({
  node: {
    type: Node,
    required: true,
  },
});

watch(
  () => props.node,
  () => (ifaceName.value = ifaceList.value[0])
);

const emit = defineEmits(["close"]);

const name = computed({
  get: () => props.node.getName(),
  set: (value) => props.node.setName(value),
});

const ifaceList = computed(() => props.node.getConnectorList());

const ifaceName = ref(ifaceList.value[0]);

const ipConf = computed({
  get: () => props.node.getIpConfig(ifaceName.value),
  set: (value) => props.node.setIpConfig(value, ifaceName.value),
});

const onEnter = () => {
  //save();
};

const close = () => {
  emit("close");
};

/*
const save = () => {
  toast.success("Node Settings saved");
};
*/
</script>

<template>
  <div class="flex flex-col gap-2 p-2 overflow-y-auto">
    <div class="flex justify-between">
      <h3 class="font-bold">Node Settings:</h3>
      <button
        class="w-6 h-6 text-center align-middle bg-gray-600 text-white rounded-full"
        @click="close"
      >
        x
      </button>
    </div>
    <p>ID: {{ node.getNodeID() }}</p>
    <div>
      <span>Name: </span>
      <input
        v-model="name"
        :placeholder="name ?? 'enter new host name'"
        @keyup.enter="onEnter"
        class="rounded"
      />
    </div>
    <div class="flex flex-col gap-1">
      <span>IP Config: </span>
      <select v-model="ifaceName" class="text-sm rounded">
        <option v-for="ifaceName in ifaceList" :key="ifaceName">
          {{ ifaceName }}
        </option>
      </select>
      <div class="flex gap-1">
        <p>Static:</p>
        <p>{{ ipConf.static }}</p>
      </div>
      <div class="flex gap-1">
        <p>Addr:</p>
        <input
          v-model.trim="ipConf.addr"
          :placeholder="ipConf.addr ?? 'enter new ip addr'"
          @keyup.enter="onEnter"
          class="rounded px-1 w-full invalid:bg-red-300"
          pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
        />
      </div>
      <div class="flex gap-1">
        <p>SNM:</p>
        <input
          v-model.trim="ipConf.snm"
          :placeholder="ipConf.snm ?? 'enter new snm'"
          @keyup.enter="onEnter"
          class="rounded px-1 w-full invalid:bg-red-300"
          pattern="^(((255\.){3}(255|254|252|248|240|224|192|128|0+))|((255\.){2}(255|254|252|248|240|224|192|128|0+)\.0)|((255\.)(255|254|252|248|240|224|192|128|0+)(\.0+){2})|((255|254|252|248|240|224|192|128|0+)(\.0+){3}))$"
        />
      </div>
      <div class="flex gap-1">
        <p>GW:</p>
        <input
          v-model.trim="ipConf.gw"
          :placeholder="ipConf.gw ?? 'enter new gateway'"
          @keyup.enter="onEnter"
          class="rounded px-1 w-full invalid:bg-red-300"
          pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
        />
      </div>
      <div class="flex gap-1">
        <p>DNS:</p>
        <input
          v-model.trim="ipConf.dns"
          :placeholder="ipConf.dns ?? 'enter new dns'"
          @keyup.enter="onEnter"
          class="rounded px-1 w-full invalid:bg-red-300"
          pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
        />
      </div>
    </div>
    <!-- <button class="bg-red-400 rounded p-2 mt-4" @click="save">Save</button> -->
  </div>
</template>
