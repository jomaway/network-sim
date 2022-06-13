import { NodeType } from "./NetworkComponents"
import { Switch } from "./Switch"

export class Cloud extends Switch {

  constructor(id) {
    super(id, 100)
  }

  getNodeType(): NodeType {
    return NodeType.Cloud
  }
}

/*
export class Cloud extends Switch {
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
    return NodeType.Cloud
  }

  getDynamicIP() {
    return this.dhcpServer.getFreeIpConf()
  }



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
*/