import { Frame, MacAddr, MAC_BROADCAST_ADDR } from "../protocols/Ethernet"
import { Link } from "./Link"
import { NodeID } from "./Node";

export interface Connectable {
  connectors: Array<Connector>;

  getNodeID: () => NodeID;

  hasFreeConnector: () => boolean;
  getNextFreeConnector: () => Connector;
  getFreeConnectors: () => Array<Connector>;
  getConnectorList: () => Array<string>;
  getConnectorByID: (id: ConnectorID) => Connector;

  receive: (orig: Connector, frame: Frame) => void;
}

export type ConnectorID = string
export class Connector {
  id: string
  link: Link
  owner: Connectable
  
  constructor(id: string, owner: Connectable) {
    this.id = id
    this.owner = owner
    this.link = null
  }

  connect(link: Link) {
    this.link = link
  }

  disconnect() {
    this.link = null
  }

  isConnected() {
    return (this.link !== null)
  }

  tx(frame: Frame) {
    if (this.isConnected()) {
      this.link.transfer(this, frame)
    } else {
      // todo!() think about how this should be handled
      throw new Error(`${this.id}: No link connected`)
    }
  }

  rx(frame: Frame) {
    this.owner.receive(this, frame)
  }

  getNodeID() {
    return this.owner.getNodeID()
  }
}

export class NIC extends Connector {
  macAddr: MacAddr

  constructor(mac: MacAddr, id: ConnectorID, owner: Connectable) {
    super(id, owner)
    this.macAddr = mac
  }

  rx(frame: Frame) {
    if(frame.dst === this.macAddr || MAC_BROADCAST_ADDR === frame.dst) {
      this.owner.receive(this, frame)
    }
  }

  getMacAddr() {
    return this.macAddr
  }
}