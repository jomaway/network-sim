import { NodeID, NodeType } from "./NetworkComponents";
import { AddressableNode } from "./AddressableNode";

export class Router extends AddressableNode {

  constructor(id: NodeID, name: string = "Router") {
    super(id);
    this.name = name;
    
    this.addInterface("LAN").setIpAddr("192.168.30.1");
    this.addInterface("WAN");
  }
  
  getNodeType(): NodeType {
    return NodeType.Router
  }
}