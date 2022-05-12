import { Frame, MacAddr } from "../protocols/Ethernet"
import { Link, LinkID } from "./Link"
import { Node, NodeID, NodeType } from "./Node"
import { NodeIcon } from "./Drawable"
import { Connector } from "./Connector"

export class Switch extends Node {
  name: string
  portCount: number;
  macTable: Map<LinkID,Array<MacAddr>>;

  constructor(id: NodeID, ports: number) {
    super(id)
    this.name = `Switch-${ports}`
    this.portCount = ports;
    this.macTable = new Map()
    for (let i = 0; i < ports; i++) {
      this.addConnector()
    }

    // add Drawable
    this.drawable = new NodeIcon("#65A30D","rect")
  }

  receive(orig: Connector, frame: Frame) {
    //console.log(`${this.name} - received frame (${frame.src} -> ${frame.dst})`);
    //this.tm?.emit("NodeActive",`${this.name} - received frame (${frame.src} -> ${frame.dst})`)
    // Add src to macTable
    if (frame.src !== "FF-FF-FF-FF-FF-FF") {
      this.addtoMacTable(orig.id, frame.src)
    }
    
    // Lookup dst MAC Addr
    const dstPortID = this.lookupMac(frame.dst)
    if (dstPortID) {
      this.connectors.find((c) => c.id === dstPortID ).tx(frame)
    } else {
      // Broadcast message
      this.connectors.filter((c : Connector) => c.isConnected())
      .forEach((c: Connector) => {
        if (c !== orig ) c.tx(frame)
      })
    }
  };

  addtoMacTable(portID, macAddr: MacAddr) {
    this.macTable.has(portID) ? 
      this.macTable.set(portID, [... new Set([macAddr, ...this.macTable.get(portID)])]) :
      this.macTable.set(portID, [macAddr]);
  }

  lookupMac(macAddr: MacAddr) {
    for (const [key, value] of this.macTable) {
      if (value.includes(macAddr)) {
        return key
      }
    }
    return null
  }

  getName(): string {
    return this.name
  }

  setName(name: string): void {
    this.name = name
  }

  getNodeType(): NodeType {
      return NodeType.Switch
  }

  /* ---------- Storage methods  ----------*/

  save() {
    let n = super.save()
      n["name"] = this.name
      n["portCount"] = this.portCount
      return n
  }

  load(data: any) {
    super.load(data)
  }
}