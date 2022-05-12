import { defineStore } from "pinia";

export const useLayoutStore = defineStore({
  id: "layout",
  state: () => ({
    sidebar: false,
    dark: false,
    fullscreen: false,
  }),
  getters: {
    isSidebarOpen: (state) => state.sidebar,
    isFullScreen: (state) => state.fullscreen,
    isDark: (state) => state.dark,
  },
  actions: {
    closeSidebar() {
      this.isSidebarOpen = false;
    },
    openSidebar() {
      this.isSidebarOpen = true;
    },
    toggleSidebar() {
      this.sidebar = !this.sidebar;
    },
  },
});
