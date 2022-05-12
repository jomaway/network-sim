<script setup>
import { useNetworkStore } from "@/stores/network";
import { reactive } from "vue";

const networkStore = useNetworkStore();

const panel = reactive({
  tool: "link",
  nodeInfo: {},
});

const msgVal = reactive({
  src: 1,
  dst: 7, // change with dynamical loaded values
  msg: "test",
});

const sendTestMessage = () => {
  const src = networkStore.manager.getNodeByID(msgVal.src);
  const dst = networkStore.manager.getNodeByID(msgVal.dst);
  src.sendMsg(msgVal.msg, dst);
};

const sendPing = () => {
  const src = networkStore.manager.getNodeByID(msgVal.src);
  const dst = networkStore.manager.getNodeByID(msgVal.dst);
  src.ping(dst.ipConfig.addr);
};
</script>

<template>
  <main-section class="h-full">
    <div class="rounded bg-amber-200 h-full p-2 flex gap-2">
      <!-- Node Info -->
      <div class="basis-1/4 flex flex-col gap-2 items-stretch">
        <h3 class="text-lg">Node Info:</h3>
        <pre class="text-xs overflow-y-auto">{{ panel.nodeInfo }}</pre>
      </div>
      <!-- Traffic Info -->
      <div class="basis-1/4 flex flex-col flex-wrap gap-2 items-stretch">
        <h3 class="text-lg">Traffic Test:</h3>
        <div class="flex gap-1 items-center">
          <p>src :</p>
          <select v-model="msgVal.src" class="text-sm">
            <option
              v-for="host in networkStore.getHostList"
              :key="host.id"
              :value="host.id"
            >
              {{ host.name }} ({{ host.id }})
            </option>
          </select>
        </div>
        <div class="flex gap-1 items-center">
          <p>dst :</p>
          <select v-model="msgVal.dst" class="text-sm">
            <option
              v-for="host in networkStore.getHostList"
              :key="host.id"
              :value="host.id"
            >
              {{ host.name }} ({{ host.id }})
            </option>
          </select>
        </div>
        <input
          v-model="msgVal.msg"
          type="text"
          class="rounded text-sm"
          placeholder="Enter message"
        />
        <button class="rounded bg-teal-400 p-1" @click="sendTestMessage()">
          Send Message
        </button>
        <button class="rounded bg-teal-400 p-1" @click="sendPing()">
          Send Ping Request
        </button>
      </div>
    </div>
  </main-section>
</template>
