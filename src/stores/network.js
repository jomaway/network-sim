import { defineStore } from "pinia";
import { NetworkManager } from "@/core/network/NetworkManager";
import { NodeType } from "@/core/network/components/NetworkComponents";
import { NodeColor } from "../core/network/components/Drawable";

const colorMap = new Map();
colorMap.set(NodeType.Host, NodeColor.Host);
colorMap.set(NodeType.Switch, NodeColor.Switch);
colorMap.set(NodeType.Router, NodeColor.Router);
colorMap.set(NodeType.Cloud, NodeColor.Cloud);

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
      settings: {
        showIpBatches: true,
        showGrid: true,
        panEnabled: true,
        zoomEnabled: true,
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
          type: node.getNodeType(),
          color:
            node.id == state.nodeInfo.nodeID && state.nodeInfo.show
              ? "#FFBF00"
              : colorMap.get(node.getNodeType()), // node.drawable.color,
          dType: node.isType(NodeType.Host) ? "circle" : "rect", // node.drawable.shape,
          size: node.isType(NodeType.Cloud) ? 50 : 26, //.size,
          icon: "&#xe320",
        };
      });
      return nodes;
    },
    getEdges: (state) => {
      let edges = {};
      state.manager.links.forEach((link) => {
        edges[link.id] = {
          source: link.p1.node.getNodeID(),
          target: link.p2.node.getNodeID(),
          animate: link.active,
          //srcmarker: link.p1 === "WAN" ? "circle" : "none",
          //tarmarker: link.p2 === "WAN" ? "circle" : link.active ? "arrow" : "none",
        };
      });
      return edges;
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
      this.layouts.nodes[nodeID] = newPos;
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
      //this.layouts.nodes[node.id] = node.drawable.pos;
    },
    updateLayouts() {
      this.manager.nodes.forEach((node) => {
        this.updateLayoutForNode(node);
      });
    },
    saveNetwork() {
      const data = this.manager.saveNetwork();
      data["layouts"] = this.layouts;
      localStorage.setItem("netsim-network-manager", JSON.stringify(data));
    },
    loadRecentNetwork() {
      if (localStorage["netsim-network-manager"]) {
        const data = JSON.parse(localStorage.getItem("netsim-network-manager"));
        this.layouts.nodes = data.layouts?.nodes ?? {};
        this.manager.loadNetwork(data);
      } else {
        console.warn("No network found");
      }
    },
    saveNetworkAsFile() {
      const filename = "network-sim_example.json"; // filename to download
      const text = this.saveNetwork();

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
      const reader = new FileReader();

      reader.onload = (event) => {
        console.log("Reading file successfully");
        console.log("FILE", event.target.result);
        this.manager.loadNetwork(JSON.parse(event.target.result));
        this.updateLayouts();
        this.saveNetwork();
      };

      reader.readAsText(file);
    },
  },
});
