import { Node, NodeID, NodeType } from "./components/Node";
import { Host } from "./components/Host";
import { Switch } from "./components/Switch";
import { Router } from "./components/Router";
import { Link, LinkID } from "./components/Link";
import { Connectable, Connector } from "./components/Connector";
import TM, { TrafficManager } from "./TrafficManager";
import { Cloud } from "./components/Cloud";

export class NetworkManager {
  nodes: Array<Node>
  links: Array<Link>
  lastUsedID: NodeID
  tm: TrafficManager
  cloud: Cloud

  constructor() {
    this.nodes = []
    this.links = []
    this.lastUsedID = 0
    this.tm = TM
  }

  hasCloud() : boolean{
    return this.nodes.filter((node) => node.getNodeType() === NodeType.Cloud).length === 1
  }

  addCloud() : Cloud {
    if (!this.hasCloud()) {
      const cloud = new Cloud(-100);
      this.nodes.push(cloud);
      return cloud
    } else {
      return this.getCloud()
    }
  }

  getCloud() : Cloud {
    return this.nodes.find((node) => node.id === -100) as Cloud
  }

  addNode(node: Node) {
    this.nodes.push(node)
  }

  removeNode(node: Node) {
    // check if node is connected
    node.connectors.forEach((c) => {
      if(c.isConnected()) {
        // remove Link
        this.removeLink(c.link)
      }
    })

    this.nodes.splice(this.nodes.indexOf(node),1)
  }

  removeNodeWithID(nodeID: NodeID) {
    this.removeNode(this.getNodeByID(nodeID))
  }

  addHost(name: string) : Host {
    const h = new Host(this.getNextID(), name)
    this.addNode(h)
    return h
  }
  
  addSwitch(ports: number) {
    const s = new Switch(this.getNextID(), ports)
    this.addNode(s)
    return s
  }

  addRouter() {
    const r = new Router(this.getNextID())
    this.addNode(r)
    return r
  }

  addLink(from: Connector | Connectable, to: Connector | Connectable) {
    // Get Free connectors
    const c1 = from instanceof Connector ? from : from.getNextFreeConnector()
    const c2 = to instanceof Connector ? to : to.getNextFreeConnector()
    
    if ( c1 && c2 && !c1.isConnected() && !c2.isConnected()) {
      const link = new Link(`l${this.getNextID()}`, c1,c2)
      this.links.push(link)
    } else {
      throw new Error("Could not add link")
    }
  }

  removeLink(link: Link) {
    link.disconnect() // disconnect first.
    this.links.splice(this.links.indexOf(link),1)
  }

  removeLinkWithID(linkID: LinkID) {
    this.removeLink(this.getLinkByID(linkID))
  }

  getNextID() : NodeID {
    return ++this.lastUsedID
  }

  getNodeByID(id: NodeID) : Node {
    if (typeof(id) === "string") {
      id = parseInt(id)
    }
    return this.nodes.find((node) => node.id === id)
  }

  getHostByID(id: NodeID): Host {
    return this.getAllHosts().find((host) => host.id === id )
  }

  getLinkByID(id: string) : Link {
    return this.links.find((link) => link.id === id)
  }

  getAllFromType(nodeType: NodeType) {
    return this.nodes.filter((node) => node.getNodeType() === nodeType)
  }

  getAllHosts() : Host[] {
    return this.getAllFromType(NodeType.Host).map((node) => node as Host)
  }

  getAllRouters() : Router[] {
    return this.getAllFromType(NodeType.Router).map((node) => node as Router)
  }

  randomIPs() {
    const hosts = this.getAllHosts()
    const tmp = []

    hosts.forEach((host) => {
      const randomIp = "10.13.200." + Math.floor(Math.random() * 255 )
      host.setIpAddr(randomIp)
      tmp.push(randomIp)
    })
  }

  saveNetwork() : string {
    let result = {}
    result["lastUsedID"] = this.lastUsedID
    result["nodes"] = this.nodes.map((node) => {
      return node.save()
    })

    result["links"] = this.links.map((link) => {
      let l = {}
      l["c1"] = link.c1.owner.getNodeID()
      l["c2"] = link.c2.owner.getNodeID()
      return l
    })

    return JSON.stringify(result)
  }

  loadNetwork(data) {
    // reset components
    this.nodes = []
    this.links = []
    this.lastUsedID = data.lastUsedID
    
    // Load nodes
    data.nodes.forEach((node: any) => {
      let n : Node = null
      switch (node.type) {
        case NodeType.Host:
          n = new Host(node.id, node.name)
          break;
        case NodeType.Switch:
          n = new Switch(node.id, node.portCount)
          break;
        case NodeType.Router:
          n = new Router(node.id)
          break;
        case NodeType.Cloud:
          n = this.addCloud()
        default:
          break;
      }

      // resotre node settings
      n.load(node)
      this.addNode(n)
    });
    // Load links
    data.links.forEach((link) => {
      const n1 = this.getNodeByID(link.c1);
      const n2 = this.getNodeByID(link.c2);
      this.addLink(n1, n2);
    });
  }

  reset() {
    this.nodes = []
    this.links = []
    this.lastUsedID = 0
  }
}


export interface Storeable {
  save: () => object
  load: (data: object) => void 
}

export function isStoreable(object: any) : object is Storeable {
  return object.save !== undefined;
}

export function getUniqueMacAddr() : string {
  // not unique yet, just random
  return "XX:XX:XX:XX:XX:XX".replace(/X/g, () => "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16)));
}