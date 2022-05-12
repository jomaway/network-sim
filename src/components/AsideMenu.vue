<script setup>
import { useLayoutStore } from "../stores/layout";
import { RouterLink } from "vue-router";
import IconSupport from "./icons/IconSupport.vue";
import IconNetwork from "./icons/IconNetwork.vue";
import IconDocumentation from "./icons/IconDocumentation.vue";

const layout = useLayoutStore();
</script>

<template>
  <aside
    class="w-60 fixed top-0 left-0 h-screen z-20 rounded transition-position bg-red-400 dark:bg-gray-800 pt-14 hidden"
    :class="[layout.isSidebarOpen ? 'md:block' : 'hidden']"
    aria-label="Sidebar"
  >
    <div class="overflow-y-auto py-4 px-3">
      <ul class="space-y-2">
        <li>
          <router-link
            to="/tutorial"
            class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <IconSupport
              class="flex-shrink-0 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
            />
            <span class="ml-3">Tutorial</span>
          </router-link>
        </li>
        <li>
          <router-link
            to="/network"
            class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <IconNetwork
              class="flex-shrink-0 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
            />
            <span class="ml-3">Network</span>
          </router-link>
        </li>
        <div class="devider"></div>
        <li>
          <router-link
            to="/about"
            class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <IconDocumentation
              class="flex-shrink-0 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
            />
            <span class="ml-3">About</span>
          </router-link>
        </li>
      </ul>
    </div>
  </aside>
</template>
