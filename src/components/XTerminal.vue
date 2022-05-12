<script setup>
import { onMounted, ref } from "vue";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const props = defineProps({
  buffer: {
    type: String,
    default: "$ ping 10.13.200.30",
  },
  title: String,
  commands: Object,
});

const emit = defineEmits(["focus", "blur", "update:title", "update:buffer"]);

const el = ref(null);
let xterm = ref(null);

onMounted(() => {
  let term = new Terminal();
  // Add fit Addon
  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  // Open terminal
  term.open(el.value, true);
  fitAddon.fit();

  if (props.buffer) term.write(props.buffer.replace(/\n/g, "\r\n") + "\r\n");
  term.write("Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ");

  term.onTitleChange(emit("update:title"));
  term.onKey(({ key }) => {
    console.log(key);
    if (key == "\r") {
      onEnter();
    } else {
      term.write(key);
    }
  });

  xterm = term;
});

const onEnter = () => {
  console.log("Enter pressed", props.buffer);
};
</script>

<template>
  <div ref="el">
    <div ref="xterm"></div>
  </div>
</template>
