<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { Node } from "@/core/network/components/Node";

const props = defineProps({
  node: {
    type: Node,
    required: true,
  },
});

watch(
  () => props.node,
  () => {
    output.value = [
      "$ logged in to terminal on node " + hostname.value + ".",
      " Run help for a list of all available commands",
    ];
    stdinRef.value.focus();
  }
);

const emit = defineEmits(["close"]);

const hostname = computed(() => props.node.getName());

const stdout = ref(null);
const stdin = ref("");
const history = ref(["ping 10.13.200.1"]);
const cmdSelect = ref(history.value.length);

const output = ref([]);

const onEnter = () => {
  console.log("enter pressed. cmd= ", stdin.value);
  if (stdin.value === "") {
    return;
  }
  if (!history.value.includes(stdin.value)) {
    history.value.push(stdin.value);
  } else {
    history.value.push(
      history.value.splice(history.value.indexOf(stdin.value), 1)[0]
    );
  }
  cmdSelect.value = history.value.length;

  runCommand(stdin.value);
  stdin.value = "";
  scroll();
};

async function runCommand(input) {
  const parts = input.split(" ");
  const cmd = parts[0];
  const args = parts[1] ?? "";
  switch (cmd) {
    case "help":
      output.value = [
        "$ help",
        "ip : show the own ip addr",
        "ping : check if node is available",
      ];
      break;
    case "ping": {
      output.value = [`$ ping ${args} ...`];
      const retVal = await props.node.ping(args);
      output.value.push(retVal);
      break;
    }
    case "ip":
      output.value = ["$ ip info", props.node.getIpConfig()];
      break;
    default:
      output.value = ["Command not found: " + input];
      break;
  }
}

const onKeyUp = (event) => {
  switch (event.key) {
    case "ArrowUp":
      console.log("key ArrowUp pressed");
      cmdSelect.value = cmdSelect.value > 0 ? (cmdSelect.value -= 1) : 0;
      stdin.value = history.value[cmdSelect.value];
      break;
    case "ArrowDown":
      console.log("key ArrowDown pressed");
      cmdSelect.value =
        cmdSelect.value < history.value.length - 1
          ? (cmdSelect.value += 1)
          : history.value.length - 1;
      stdin.value = history.value[cmdSelect.value];
      break;
    default:
  }
};

const stdinRef = ref();

onMounted(() => {
  output.value = [" Run help for a list of all available commands"];
  stdinRef.value.focus();
  //scroll();
});

const scroll = () => {
  stdout.value.lastElementChild.scrollIntoView();
};

const closeTerminal = () => {
  emit("close");
};
</script>

<template>
  <div class="flex flex-col gap-2 h-full w-full items-stretch">
    <div class="py-1 px-2 flex justify-between border-b border-gray-400">
      <p class="font-bold text-white">Host: {{ hostname }}</p>
      <button @click="closeTerminal">
        <p class="px-4 font-bold text-white">x</p>
      </button>
    </div>
    <ul
      ref="stdout"
      class="px-2 flex-grow overflow-hidden overflow-y-scroll text-white"
    >
      <li v-for="entry in output" :key="entry">{{ entry }}</li>
    </ul>
    <div class="w-full px-2 pb-1">
      <input
        ref="stdinRef"
        type="text"
        v-model="stdin"
        placeholder="Type command"
        class="w-full h-10 px-2 rounded bg-gray-600 text-gray-100 border-rose-600 focus:border-sky-500 focus:ring-sky-500 disabled:border-gray-600"
        @keyup.enter="onEnter"
        @keyup="onKeyUp"
        :disabled="!node"
      />
    </div>
  </div>
</template>
