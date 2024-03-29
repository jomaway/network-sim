<script setup>
import { ref, reactive, computed } from "vue";
import { useToast } from "vue-toastification";
import { useNetworkStore } from "../stores/network";
import * as vNG from "v-network-graph";

import { LinkColor } from "@/core/network/components/Drawable";
import { NodeType } from "@/core/network/components/NetworkComponents";

import FloatMenu from "@/components/FloatMenu.vue";
import ContextMenu from "@/components/ContextMenu.vue";
import AddLinkDialog from "@/components/dialogs/AddLinkDialog.vue";
import FilePickerDialog from "@/components/dialogs/FilePickerDialog.vue";
import DialogWrapper from "@/components/dialogs/DialogWrapper.vue";
import SettingsDialog from "./dialogs/SettingsDialog.vue";
import MacTableDialog from "./dialogs/MacTableDialog.vue";
import IconCloud from "./icons/nodes/IconCloud.vue";
import SwitchIcon from "@/assets/SwitchIcon.svg?component";
import HostIcon from "@/assets/HostIcon.svg?component";
import RouterIcon from "@/assets/RouterIcon.svg?component";

defineProps({
  eventHandlers: Object,
});

const networkStore = useNetworkStore();
const dialogWrapperRef = ref();

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
  let items = [
    {
      name: "Add Host",
      onSelect: () => {
        const h = networkStore.manager.addHost("New Host");
        networkStore.moveNode(h.getNodeID(), pos);
        //networkStore.updateLayoutForNode(h);
      },
    },
    {
      name: "Add Server",
      onSelect: () => {
        const h = networkStore.manager.addHost("Server");
        networkStore.moveNode(h.getNodeID(), pos);
        h.dhcpServer.start(); // init host with running dhcp server.
      },
    },
    {
      name: "Add Switch",
      items: [
        {
          name: "5 Ports",
          onSelect: () => {
            const s = networkStore.manager.addSwitch(5);
            networkStore.moveNode(s.getNodeID(), pos);
            //networkStore.updateLayoutForNode(s);
          },
        },
        {
          name: "8 Ports",
          onSelect: () => {
            const s = networkStore.manager.addSwitch(8);
            networkStore.moveNode(s.getNodeID(), pos);
            //networkStore.updateLayoutForNode(s);
          },
        },
        {
          name: "16 Ports",
          onSelect: () => {
            const s = networkStore.manager.addSwitch(16);
            networkStore.moveNode(s.getNodeID(), pos);
            //networkStore.updateLayoutForNode(s);
          },
        },
      ],
    },
    {
      name: "Add Router",
      onSelect: () => {
        const r = networkStore.manager.addRouter();
        networkStore.moveNode(r.getNodeID(), pos);
        //networkStore.updateLayoutForNode(r);
      },
    },
  ];

  if (!networkStore.manager.hasCloud()) {
    items.push({
      name: "Add Cloud",
      onSelect: () => {
        const c = networkStore.manager.addCloud();
        networkStore.moveNode(c.getNodeID(), pos);
        //networkStore.updateLayoutForNode(i);
      },
    });
  }
  return items;
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
    node.hasFreePort() &&
    networkStore.isNodeSelected &&
    node.getNodeID() !== networkStore.getSelectedNode.getNodeID() &&
    networkStore.getSelectedNode.hasFreePort()
  ) {
    items.push({
      name: "Connect to selected Node",
      onSelect: async () => {
        try {
          const { from, to } = await dialogWrapperRef.value.openDialog(
            AddLinkDialog,
            { from: node, to: networkStore.getSelectedNode }
          );
          networkStore.manager.addLink(from, to);
        } catch (err) {
          toast.error(err.message);
        }
      },
    });
  } /* else if (!node.isType(NodeType.Switch)) {
    // todo! fix this later .... old style
    node<AddressableNode>.getIfaceList()
      .filter((c) => c.port.isConnected())
      .forEach((c) => {
        items.push({
          name: `Disconnect ${c.id}`,
          onSelect: () => {
            const link = c.link;
            networkStore.manager.removeLink(link);
          },
        });
      });
  }*/

  switch (node?.getNodeType()) {
    case NodeType.Switch:
      items.push({
        name: "Show MacTable",
        onSelect: async () => {
          //console.warn("not implemented");
          await dialogWrapperRef.value.openDialog(MacTableDialog, {
            networkSwitch: node,
          });
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
          node.dhcpClient.sendDHCPDiscover();
        },
      });
      if (
        networkStore.isNodeSelected &&
        networkStore.getSelectedNode.isType(NodeType.Host)
      ) {
        items.push({
          name: "ping selected Node",
          onSelect: () => {
            const host = node;
            host
              .command()
              .ping(networkStore.getSelectedNode.getDefaultIface().getIpAddr());
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
      if (!node.getIfaceByName("WAN").port.isConnected()) {
        items.push({
          name: "Connect to Cloud",
          onSelect: () => {
            try {
              networkStore.manager.addLink(
                node.getIfaceByName("WAN").port,
                networkStore.manager.getCloud().getNextFreePort()
              );
              const ipconf = networkStore.manager.getCloud().getDynamicIP();
              node.setIpConfig(ipconf, "WAN");
            } catch (err) {
              toast.error(err.message);
            }
          },
        });
      } else {
        items.push({
          name: "Get conf from ISP",
          onSelect: () => {
            const ipconf = networkStore.manager.getCloud().getDynamicIP();
            node.setIpConfig(ipconf, "WAN");
          },
        });
      }
      break;
    case NodeType.Internet:
      items.push({
        name: "Check",
        onSelect: () => {
          throw new Error("Method not implemented.");
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
  },
  //"node:dragend": (nodes) => {},
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
    name: "Restore Recent",
    onSelect: () => {
      networkStore.loadRecentNetwork();
      toast.success("Network loaded");
    },
  },
  {
    name: "Quick Save",
    onSelect: () => {
      networkStore.saveNetwork();
      toast.success("Network saved");
    },
  },
  {
    name: "Save to File",
    onSelect: () => {
      networkStore.saveNetworkAsFile();
    },
  },
  {
    name: "Load from File",
    onSelect: async () => {
      const file = await dialogWrapperRef.value.openDialog(FilePickerDialog);
      if (file !== "cancel") {
        try {
          networkStore.loadNetworkFromFile(file);
        } catch (error) {
          toast.error(error.message);
        }
      }
    },
  },
  {
    name: "Export Graph as SVG",
    onSelect: () => {
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
    name: "Settings",
    onSelect: async () => {
      await dialogWrapperRef.value.openDialog(SettingsDialog);
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

networkStore.$subscribe(() => {
  configs.view.grid.visible = networkStore.settings.showGrid;
  configs.view.panEnabled = networkStore.settings.panEnabled;
  configs.view.zoomEnabled = networkStore.settings.zoomEnabled;
});

const configs = reactive(
  vNG.defineConfigs({
    view: {
      panEnabled: networkStore.settings.panEnabled,
      zoomEnabled: networkStore.settings.zoomEnabled,
      scalingObjects: true,
      grid: {
        visible: networkStore.settings.showGrid,
      },
    },
    node: {
      draggable: true,
      selectable: isNodeSelectable,
      normal: {
        radius: (node) => node.size,
        width: 60,
        height: 30,
        type: (node) => node.dType,
        color: (node) => node.color,
      },
      hover: {
        color: (node) => node.color,
      },
      label: {
        direction: "south",
        color: "#000000",
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
  const source = link.p1.node.getNodeID(); //as Node
  const target = link.p2.node.getNodeID(); //as Node
  const start = networkStore.layouts.nodes[source]; // source.drawable.pos;
  const end = networkStore.layouts.nodes[target]; //target.drawable.pos;
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
    <!-- Replace the node component -->
    <template #override-node="{ nodeId, scale, config, ...slotProps }">
      <icon-cloud
        x="-80"
        y="-60"
        width="160"
        height="120"
        :fill="config.color"
        v-if="nodeId === '-100'"
        v-bind="slotProps"
      />
      <host-icon
        :width="60 * scale"
        :height="60 * scale"
        :x="-30 * scale"
        :y="-30 * scale"
        v-if="networkStore.getNodes[nodeId].type === NodeType.Host"
        v-bind="slotProps"
      />
      <switch-icon
        :width="60 * scale"
        :height="30 * scale"
        :x="-30 * scale"
        :y="-15 * scale"
        v-if="networkStore.getNodes[nodeId].type === NodeType.Switch"
      />
      <router-icon
        :width="60 * scale"
        :height="30 * scale"
        :x="-30 * scale"
        :y="-15 * scale"
        v-if="networkStore.getNodes[nodeId].type === NodeType.Router"
      />
    </template>
    <!-- Replace the node labels -->
    <template
      #override-node-label="{
        nodeId,
        scale,
        text,
        x,
        y,
        config,
        textAnchor,
        dominantBaseline,
      }"
    >
      <text
        v-if="networkStore.getNodes[nodeId].type === NodeType.Host"
        x="0"
        y="0"
        :font-size="9 * scale"
        text-anchor="middle"
        dominant-baseline="central"
        fill="#ffffff"
        >{{ text }}</text
      >
      <text
        v-else
        :x="x"
        :y="y"
        :font-size="config.fontSize * scale"
        :text-anchor="textAnchor"
        :dominant-baseline="dominantBaseline"
        :fill="config.color"
        >{{ text }}</text
      >
    </template>
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
    <template #batches="{ scale }" v-if="networkStore.settings.showIpBatches">
      <svg
        v-for="host in networkStore.manager.getAllHosts()"
        :key="host.id"
        :x="networkStore.layouts.nodes[host.id].x - 20 * scale"
        :y="networkStore.layouts.nodes[host.id].y - 40 * scale"
      >
        <rect width="100" height="24" rx="15" ry="15" fill="#aed6f1" />
        <text
          :x="100 / 2"
          :y="24 / 2"
          font-size="12px"
          dominant-baseline="central"
          text-anchor="middle"
          fill="#000"
        >
          {{ host.getDefaultIface().getCIDR() }}
        </text>
      </svg>
      <!-- 
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
        <rect
          y="57"
          x="40"
          width="100"
          height="24"
          rx="15"
          ry="15"
          fill="#aed6f1"
        />
        <text
          :x="100 / 2 + 40"
          :y="24 / 2 + 57"
          font-size="12px"
          dominant-baseline="central"
          text-anchor="middle"
          fill="#ffffff"
        >
          W: {{ host.getCIDR("WAN") }}
        </text>
      </svg> 
      -->
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
  <dialog-wrapper ref="dialogWrapperRef" />
</template>
