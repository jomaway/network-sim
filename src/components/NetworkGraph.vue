<script setup>
import { ref, reactive, computed } from "vue";
import { useToast } from "vue-toastification";
import { useNetworkStore } from "../stores/network";
import * as vNG from "v-network-graph";
import ContextMenu from "@/components/ContextMenu.vue";
import FloatMenu from "@/components/FloatMenu.vue";
import { LinkColor, NodeColor } from "@/models/network/components/Drawable";
import { NodeType } from "../models/network/components/Node";
import { Server as DHCPServer } from "@/models/network/services/DHCP";

defineProps({
  eventHandlers: Object,
});

const networkStore = useNetworkStore();

//networkStore.$subscribe((mutation, state) => {
//console.log("STORE mutation detected", mutation, state);
//});

const toast = useToast();

// ref="graphRef"
const graphRef = ref();

const selectionNodeLimit = ref(1);
const isNodeSelectable = computed(() =>
  selectionNodeLimit.value === -1 ? true : selectionNodeLimit.value
);

const floatMenuRef = ref();
const contextMenuRef = ref();

const contextMenuData = reactive({
  position: { x: 50, y: 10 },
  show: false,
  items: [],
});

const showContextMenu = (params) => {
  const event = params.event;
  event.stopPropagation();
  event.preventDefault();
  contextMenuData.position.x = event.x;
  contextMenuData.position.y = event.y;
  contextMenuData.show = true;
};

const showNodeContextMenu = (params) => {
  showContextMenu(params);
  contextMenuData.items = getNodeContextMenuItems(params.node);
};

const showViewContextMenu = (params) => {
  showContextMenu(params);
  const pos = { x: params.event.x, y: params.event.y };
  const svgPos = graphRef.value.translateFromDomToSvgCoordinates(pos);
  contextMenuData.items = getViewContextMenuItems(svgPos);
};

const showEdgeContextMenu = (params) => {
  showContextMenu(params);
  contextMenuData.items = getLinkContextMenuItems(params.edge);
};

const getViewContextMenuItems = (pos) => {
  return [
    {
      name: "Add Host",
      onSelect: () => {
        const h = networkStore.manager.addHost("New Host");
        h.drawable.pos = pos;
        networkStore.updateLayoutForNode(h);
      },
    },
    {
      name: "Add Server",
      onSelect: () => {
        const h = networkStore.manager.addHost("Server");
        h.drawable.pos = pos;
        h.drawable.color = NodeColor.Server;
        h.registerService(new DHCPServer(h));
        networkStore.updateLayoutForNode(h);
      },
    },
    {
      name: "Add Switch",
      items: [
        {
          name: "5 Ports",
          onSelect: () => {
            const s = networkStore.manager.addSwitch(5);
            s.drawable.pos = pos;
            networkStore.updateLayoutForNode(s);
          },
        },
        {
          name: "8 Ports",
          onSelect: () => {
            const s = networkStore.manager.addSwitch(8);
            s.drawable.pos = pos;
            networkStore.updateLayoutForNode(s);
          },
        },
        {
          name: "16 Ports",
          onSelect: () => {
            const s = networkStore.manager.addSwitch(16);
            s.drawable.pos = pos;
            networkStore.updateLayoutForNode(s);
          },
        },
      ],
    },
    {
      name: "Add Router",
      onSelect: () => {
        const r = networkStore.manager.addRouter();
        r.drawable.pos = pos;
        networkStore.updateLayoutForNode(r);
      },
    },
  ];
};

const getNodeContextMenuItems = (nodeID) => {
  const node = networkStore.manager.getNodeByID(nodeID);
  let items = [
    {
      name: "Remove",
      onSelect: () => {
        networkStore.manager.removeNode(node);
      },
    },
  ];

  if (
    node.hasFreeConnector() &&
    networkStore.isNodeSelected &&
    node.getNodeID() !== networkStore.getSelectedNode.getNodeID()
  ) {
    items.push({
      name: "Add Link to selected",
      onSelect: () => {
        try {
          networkStore.manager.addLink(node, networkStore.getSelectedNode);
        } catch (err) {
          toast.error(err.message);
        }
      },
    });
  } else if (node.getNodeType() !== NodeType.Switch) {
    node.connectors
      .filter((c) => c.isConnected())
      .forEach((c) => {
        items.push({
          name: `Disconnect ${c.id}`,
          onSelect: () => {
            const link = c.link;
            networkStore.manager.removeLink(link);
          },
        });
      });
  }

  switch (node?.getNodeType()) {
    case NodeType.Switch:
      items.push({
        name: "Show MacTable",
        onSelect: () => {
          console.warn("not implemented");
        },
      });
      break;
    case NodeType.Host:
      items.push({
        name: "Edit",

        onSelect: () => {
          networkStore.setEditNode(node.getNodeID());
        },
      });
      items.push({
        name: "ShowTerminal",
        onSelect: () => {
          networkStore.setTermCtxID(node.getNodeID());
          networkStore.terminal.show = true;
        },
      });
      items.push({
        name: "send DHCP discover",
        onSelect: () => {
          const host = node;
          host.getDynamicIpConfig();
        },
      });
      if (
        networkStore.isNodeSelected &&
        networkStore.getSelectedNode.isHost()
      ) {
        items.push({
          name: "ping selected Node",
          onSelect: () => {
            const host = node;
            host.ping(networkStore.getSelectedNode.getIpAddr());
          },
        });
      }
      break;
    case NodeType.Router:
      items.push({
        name: "Edit",
        onSelect: () => {
          networkStore.setEditNode(node.getNodeID());
        },
      });
      break;
    default:
      console.warn("Unknown NodeType error");
      break;
  }
  return items;
};

const getLinkContextMenuItems = (linkID) => {
  return [
    {
      name: "Remove",
      onSelect: () => {
        networkStore.manager.removeLink(
          networkStore.manager.getLinkByID(linkID)
        );
      },
    },
  ];
};

const eventHandlers = {
  "node:click": (data) => {
    contextMenuData.show = false;
    console.log("Node", data.node, "clicked");
    //props.eventHandlers["node:click"](data);
  },
  "node:dragend": (nodes) => {
    for (const nodeID in nodes) {
      networkStore.moveNode(nodeID, nodes[nodeID]);
    }
  },
  "node:contextmenu": showNodeContextMenu,
  "edge:contextmenu": showEdgeContextMenu,
  "view:contextmenu": showViewContextMenu,
  "view:click": () => {
    contextMenuData.show = false;
    floatMenuRef.value.close();
    //props.eventHandlers["view:click"]();
  },
};

const menuItems = [
  {
    name: "Remove selected",
    onSelect: () => {
      for (const nodeID of networkStore.selected.nodes) {
        networkStore.manager.removeNodeWithID(nodeID);
      }
      for (const linkID of networkStore.selected.links) {
        networkStore.manager.removeLinkWithID(linkID);
      }
      toast.warning("All selected nodes removed.");
    },
  },
  {
    name: "Open Recent",
    onSelect: () => {
      networkStore.loadRecentNetwork();
      toast.success("Network loaded");
    },
  },
  {
    name: "Save Network",
    onSelect: () => {
      networkStore.saveNetwork();
      toast.success("Network saved");
    },
  },
  {
    name: "Save As File",
    onSelect: () => {
      networkStore.saveNetworkAsFile();
    },
  },
  {
    name: "Export Graph as SVG",
    onSelect: () => {
      //networkStore.exportGraphAsSvg();
      if (!graphRef.value) {
        const text = graphRef.value.getAsSvg();
        const url = URL.createObjectURL(
          new Blob([text], { type: "octet/stream" })
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = "network-graph.svg"; // filename to download
        a.click();
        window.URL.revokeObjectURL(url);
      }
    },
  },
  {
    name: "Reset",
    onSelect: () => {
      networkStore.reset();
      toast.success("Network reset");
    },
  },
];

const configs = reactive(
  vNG.defineConfigs({
    view: {
      panEnabled: true,
      zoomEnabled: true,
      scalingObjects: true,
      grid: {
        visible: true,
      },
    },
    node: {
      draggable: true,
      selectable: isNodeSelectable,
      normal: {
        radius: 26,
        width: 60,
        height: 30,
        type: (node) => node.dType,
        color: (node) => node.color,
      },
      hover: {
        color: (node) => node.color,
      },
      label: {
        direction: "center",
        color: "#ffffff",
      },
    },
    edge: {
      selectable: true,
      normal: {
        color: (edge) => (edge.animate ? LinkColor.active : LinkColor.idle),
        dasharray: (edge) => (edge.animate ? "4" : "0"),
        animate: (edge) => !!edge.animate,
        linecap: "round",
      },
      marker: {
        source: {
          type: (edge) => edge[0].srcmarker ?? "none",
        },
        target: {
          type: (edge) => edge[0].tarmarker ?? "none",
        },
      },
    },
  })
);

// additional layers definition
const layers = {
  // {layername}: {position}
  msg: "paths",
  batches: "nodes",
};

const calcLinkCenterPos = (link) => {
  const source = link.c1.owner; //as Node
  const target = link.c2.owner; //as Node
  const start = source.drawable.pos;
  const end = target.drawable.pos;
  return {
    x: start.x + (end.x - start.x) * 0.5,
    y: start.y + (end.y - start.y) * 0.5,
  };
};
</script>

<template>
  <v-network-graph
    ref="graphRef"
    v-model:selected-nodes="networkStore.selected.nodes"
    v-model:selected-edges="networkStore.selected.links"
    :nodes="networkStore.getNodes"
    :edges="networkStore.getEdges"
    :layouts="networkStore.layouts"
    :configs="configs"
    :event-handlers="eventHandlers"
    :layers="layers"
  >
    <!-- Additional layer -->
    <template #msg="{ scale }" v-if="layers.msg">
      <!--
        If the `view.scalingObjects` config is `false`(default),
        scaling does not change the display size of the nodes/edges.
        The `scale` is passed as a scaling factor to implement
        this behavior. -->
      <svg
        v-for="link in networkStore.getActiveLinks"
        :key="link.id"
        :x="calcLinkCenterPos(link).x * scale"
        :y="calcLinkCenterPos(link).y * scale"
      >
        <path d="m0 0h20v14h-20zm1 1v12h18v-12zM0 0l10 7 10-7v1l-10 7-10-7z" />
        <text
          x="10"
          y="7"
          font-size="0.5em"
          dominant-baseline="central"
          text-anchor="middle"
          fill="#ff0000"
        >
          {{ link.lastFrame.getTypeLabel() }}
        </text>
        <title>{{ link.lastFrame }}</title>
      </svg>
    </template>
    <template #batches="{ scale }">
      <svg
        v-for="host in networkStore.manager.getAllHosts()"
        :key="host.id"
        :x="host.drawable.pos.x - 20 * scale"
        :y="host.drawable.pos.y - 40 * scale"
      >
        <rect width="100" height="24" rx="15" ry="15" fill="#aed6f1" />
        <text
          :x="100 / 2"
          :y="24 / 2"
          font-size="12px"
          dominant-baseline="central"
          text-anchor="middle"
          fill="#ffffff"
        >
          {{ host.getCIDR() }}
        </text>
      </svg>
      <svg
        v-for="host in networkStore.manager.getAllRouters()"
        :key="host.id"
        :x="host.drawable.pos.x - 60 * scale"
        :y="host.drawable.pos.y - 40 * scale"
      >
        <rect width="100" height="24" rx="15" ry="15" fill="#aed6f1" />
        <text
          :x="100 / 2"
          :y="24 / 2"
          font-size="12px"
          dominant-baseline="central"
          text-anchor="middle"
          fill="#ffffff"
        >
          {{ host.getCIDR("LAN") }}
        </text>
        <rect y="57" x="40" width="100" height="24" rx="15" ry="15" fill="#aed6f1" />
        <text
          :x="100 / 2 + 40"
          :y="24 / 2 + 57"
          font-size="12px"
          dominant-baseline="central"
          text-anchor="middle"
          fill="#ffffff"
        >
          {{ host.getCIDR("WAN") }}
        </text>
      </svg>
    </template>
  </v-network-graph>
  <context-menu
    ref="contextMenuRef"
    v-if="contextMenuData.show"
    :position="contextMenuData.position"
    :items="contextMenuData.items"
    @close="contextMenuData.show = false"
  />
  <float-menu ref="floatMenuRef" :menu-items="menuItems" />
</template>
