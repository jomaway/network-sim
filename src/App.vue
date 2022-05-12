<script setup>
import { RouterView } from "vue-router";
import AsideMenu from "./components/AsideMenu.vue";
import NavBar from "./components/NavBar.vue";
import { useLayoutStore } from "./stores/layout";

const layout = useLayoutStore();
</script>

<template>
  <nav-bar />
  <aside-menu />
  <main class="pt-10" :class="layout.isSidebarOpen ? 'md:ml-60' : ''">
    <router-view />
  </main>
</template>

<style></style>
