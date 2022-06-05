import { Frame } from "../protocols/Ethernet";
import { Server as DHCPServer } from "../services/DHCP";
import { Connector } from "./Connector";
import { NodeColor, NodeIcon } from "./Drawable";
import { Host } from "./Host";
import { Link } from "./Link";
import { Node, NodeID, NodeType } from "./Node";
import { Switch } from "./Switch";


export class Internet extends Switch {
  connections: Array<Link>
  dhcpServer: DHCPServer

  constructor(id: NodeID) {
    super(id, 999);
    this.name = "Internet"
    this.connections = []
    this.dhcpServer = new DHCPServer(null)  // little workaround.
    this.dhcpServer.setConf({
      first: "80.1.1.10",
      last: "80.255.255.254",
      snm: "255.0.0.0",
      gw: "80.1.1.1",
      dns: "80.1.1.2",
    })

    this.drawable = new NodeIcon(NodeColor.Internet,"circle", 50)
  }

  getName(): string {
    return "Internet"
  }

  getNodeType(): NodeType {
    return NodeType.Internet
  }

  getDynamicIP() {
    return this.dhcpServer.getFreeIpConf()
  }

  /* ---------- Storage methods  ----------*/

  save() {
    let n = super.save()
      n["dhcpConf"] = this.dhcpServer.conf
      return n
  }

  load(data: any) {
    super.load(data)
     this.dhcpServer.setConf(data["dhcpConf"])
  }

}