<script setup>
import MainSection from "@/components/MainSection.vue";
import { useNetworkStore } from "@/stores/network";
import Terminal from "@/components/Terminal.vue";
import NetworkGraph from "@/components/NetworkGraph.vue";
import FloatElement from "@/components/FloatElement.vue";
import HostEdit from "@/components/HostEdit.vue";
import SimulationControls from "@/components/SimulationControls.vue";
import { computed } from "vue";
import MacTable from "../components/MacTable.vue";

const networkStore = useNetworkStore();

const terminalNode = computed(() =>
  networkStore.manager.getNodeByID(networkStore.terminal.context.nodeID)
);

const editNode = computed(() =>
  networkStore.manager.getNodeByID(networkStore.nodeInfo.nodeID)
);

const closeTerminal = () => {
  networkStore.terminal.show = false;
};
</script>

<template>
  <div id="n-container" class="flex flex-col items-stretch">
    <div
      class="relative bg-slate-100"
      :class="networkStore.isTerminalVisible ? 'h-2/3' : 'h-full'"
    >
      <main-section class="relative h-full">
        <network-graph />
        <float-element
          v-if="networkStore.nodeInfo.show"
          class="bg-amber-400 rounded"
        >
          <host-edit
            :node="editNode"
            @close="networkStore.nodeInfo.show = false"
          />
        </float-element>
        <simulation-controls
          class="absolute top-10 left-20 bg-amber-400 rounded p-2"
        />
      </main-section>
    </div>
    <div v-if="networkStore.isTerminalVisible" class="bg-gray-800 h-1/3">
      <terminal :node="terminalNode" @close="closeTerminal" />
    </div>
  </div>
</template>

<style scoped>
#n-container {
  height: calc(100vh - 2.5rem);
  height: -o-calc(100% - 40px); /* opera */
  height: -webkit-calc(100% - 40px); /* google, safari */
  height: -moz-calc(100% - 40px); /* firefox */
}

pre {
  scrollbar-width: thin;
}
</style>
