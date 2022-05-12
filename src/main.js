import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import "./css/main.css";

import VNetworkGraph from "v-network-graph";
import "v-network-graph/lib/style.css";

import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
import { useNetworkStore } from "./stores/network";

const toastOptions = {
  timeout: 1500,
};

const app = createApp(App);

app.use(createPinia());

try {
  useNetworkStore().loadRecentNetwork();
} catch (error) {
  console.log("could not load network", error);
  useNetworkStore().reset();
}

app.use(router);
app.use(VNetworkGraph);
app.use(Toast, toastOptions);

app.mount("#app");
