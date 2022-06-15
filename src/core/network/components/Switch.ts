import { NodeID, NodeType } from "./NetworkComponents";

import { Port } from "./Port";
import { Link } from "./Link";
import { MediaAccessControll, SwitchPortController } from "../protocols/networkStack";
import { Node } from "./Node";

export class Switch extends Node {
  ports: Array<Port>;
  maController: SwitchPortController;

  constructor(id: NodeID, ports: number) {
    super(id);
    this.name = `Switch-${ports}`;
    this.ports = []
    this.maController = new SwitchPortController(this)
    for (let i = 0; i < ports; i++) {
      // hook up each port with the SwitchPortController
      this.ports.push(new Port(this))
    }
  }

  isAddressable(): boolean {
    return false;
  }

  getNodeType(): NodeType {
      return NodeType.Switch
  }

  disconnectAllLinks(): void {
    this.ports.forEach((port: Port) => port.disconnect());
  }

  getConnectedLinks() : Array<Link> {
    return this.ports.filter((port: Port) => port.isConnected()).map((port: Port) => port.link );
  }

  getMediaAccessControll(): MediaAccessControll {
    return this.maController;
  }

  hasFreePort(): boolean {
    return this.ports.find((port: Port) => !port.isConnected()) !== undefined;
    //return this.networkInterfaces.filter((iface: NetworkInterface) => !iface.port.isConnected()).length > 0;
  }

  getNextFreePort(): Port | undefined {
    return this.ports.find((port: Port) => !port.isConnected())
  }

  getMacTable() {
    return this.maController.macTable
  }
}