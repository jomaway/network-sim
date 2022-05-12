import { defineStore } from "pinia";
import { NetworkManager } from "@/models/network/NetworkManager";
import { NodeType } from "@/models/network/components/Node";

export const useNetworkStore = defineStore({
  id: "network",

  state: () => {
    const nm = new NetworkManager();
    return {
      manager: nm,
      layouts: {
        nodes: {},
      },
      selected: {
        nodes: [],
        links: [],
      },
      nodeInfo: {
        show: false,
        nodeID: -1,
      },
      terminal: {
        show: false,
        context: {
          nodeID: -1,
        },
      },
    };
  },
  getters: {
    getNodes: (state) => {
      let nodes = {};
      state.manager.nodes.forEach((node) => {
        nodes[node.id] = {
          id: node.id,
          name: node.getName(),
          color:
            node.id == state.nodeInfo.nodeID && state.nodeInfo.show
              ? "#FFBF00"
              : node.drawable.color,
          dType: node.drawable.shape,
        };
      });
      return nodes;
    },
    getEdges: (state) => {
      let edges = {};
      state.manager.links.forEach((link) => {
        edges[link.id] = {
          source: link.c1.getNodeID(),
          target: link.c2.getNodeID(),
          animate: link.active,
          srcmarker: link.c1.id === "WAN" ? "circle" : "none",
          tarmarker:
            link.c2.id === "WAN" ? "circle" : link.active ? "arrow" : "none",
        };
      });
      return edges;
    },
    getLayouts: (state) => {
      let layouts = {
        nodes: {},
      };
      state.manager.nodes.forEach((node) => {
        layouts.nodes[node.id] = node.drawable.pos;
      });
      return layouts;
    },
    getActiveLinks: (state) => {
      return state.manager.links.filter((link) => link.active);
    },
    isNodeSelected: (state) => {
      return state.selected.nodes.length !== 0;
    },
    getSelectedNode: (state) => {
      return state.isNodeSelected
        ? state.manager.getNodeByID(state.selected.nodes[0])
        : null;
    },
    isTerminalVisible: (state) => {
      return (
        state.terminal.show &&
        state.manager
          .getNodeByID(state.terminal.context.nodeID)
          ?.getNodeType() === NodeType.Host
      );
    },
    getEditNode: (state) => {
      return state.manager.getNodeByID(state.nodeInfo.nodeID);
    },
    getFirstSelectedNode: (state) => {
      return state.manager.getNodeByID(state.selected.nodes[0]);
    },
    getHostList: (state) => {
      return state.manager.getAllFromType(NodeType.Host).map((host) => {
        return { id: host.id, name: host.name };
      });
    },
  },
  actions: {
    moveNode(nodeID, newPos) {
      const node = this.manager.getNodeByID(nodeID);
      node.drawable.pos = newPos;
    },
    setTermCtxID(id) {
      if (typeof id === "string") {
        id = parseInt(id);
      }
      this.terminal.context.nodeID = id;
    },
    setEditNode(nodeID) {
      this.nodeInfo.nodeID = nodeID;
      this.nodeInfo.show = true;
    },
    reset() {
      this.manager.reset();
      this.$reset;
    },
    updateLayoutForNode(node) {
      this.layouts.nodes[node.id] = node.drawable.pos;
    },
    saveNetwork() {
      localStorage.setItem(
        "netsim-network-manager",
        this.manager.saveNetwork()
      );
    },
    loadRecentNetwork() {
      if (localStorage["netsim-network-manager"]) {
        this.manager.loadNetwork(
          JSON.parse(localStorage.getItem("netsim-network-manager"))
        );
        this.manager.nodes.forEach((node) => {
          this.updateLayoutForNode(node);
        });
      } else {
        console.warn("No network found");
      }
    },
    saveNetworkAsFile() {
      const filename = "network-sim_example.json"; // filename to download
      const text = this.manager.saveNetwork();

      const url = URL.createObjectURL(
        new Blob([text], { type: "octet/stream" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    loadNetworkFromFile(file) {
      console.log("try to load network from ", file);
      const reader = new FileReader();

      reader.onload = (event) => {
        console.log("Reading file successfully");
        this.manager.loadNetwork(event.target.result);
        this.saveNetwork();
      };

      reader.readAsText(file);
    },
  },
});
