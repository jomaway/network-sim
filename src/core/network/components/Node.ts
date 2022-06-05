//import { IPv4 } from "ip-num/IPv4"  // did not work. needs more testing
import { Frame } from "../protocols/Ethernet"
import { Connectable, Connector, ConnectorID, NIC } from "./Connector"
import { Drawable } from "./Drawable"
import TM, { TrafficEvent, TrafficManager } from "../TrafficManager";
import { Storeable } from "../NetworkManager";

export type NodeID = number;

export abstract class Node implements Connectable, Storeable {
  id: NodeID;
  connectors: Array<Connector>;
  drawable: Drawable;
  tm: TrafficManager

  constructor(id: NodeID) { 
    this.id = id;
    this.connectors = [];
    this.drawable = null;
    this.tm = TM
  }

  attachTrafficManager(tm: TrafficManager) {
    this.tm = tm
  };

  getNodeID() {return this.id}
  isNodeWithID(id: number) { return this.id === id };

  addConnector(id?: string) {
    this.connectors.push(new Connector(id??`C#${this.id}-${this.connectors.length+1}`,this))
  }

  hasFreeConnector() : boolean {
    return this.connectors.filter((c) => !c.isConnected()).length > 0
  }

  getNextFreeConnector() : Connector {
    for (const c of this.connectors) {
      if (!c.isConnected()) {
        return c
      }
    }
    return null
  }

  getFreeConnectors(): Array<Connector> {
    return this.connectors.filter((c) => !c.isConnected())
  }

  getConnectorByID(id:string) {
    return this.connectors.find((c) => c.id === id)
  }

  getConnectorList() : Array<string> {
    return this.connectors.map((c) => c.id)
  }

  /* layer 2 ethernet transmit method */
  // todo! rethink if this needs to be async here
  async transmit(connector: Connector, frame: Frame) {
    await this.tm?.notify(TrafficEvent.BeforeTransmit, this)
    try {
      connector.tx(frame)
    } catch (e) {
      TM.log(`Node ${this.getNodeID()} transmit error: ${e} Drop frame`)
    }
  }

  abstract getName() : string;
  abstract setName(name: string): void;
  abstract receive(orig: Connector, frame: Frame): void;
  abstract getNodeType() : NodeType;

  isHost() {
    return this.getNodeType() === NodeType.Host
  }

  /* ----------- Storable methods  ---------------- */

  save() {
    let n = {}
      n["id"] = this.getNodeID()
      n["type"] = this.getNodeType()
      n["connectors"] = this.connectors.map((c) => c.id)
      n["drawable"] = this.drawable
    return n
  };

  load(data: any) {
    this.id = data.id

    // set Connectors
    data.connectors.forEach((cID: ConnectorID ,idx: number) => {
      const c = new Connector(cID,this)
      this.connectors[idx] = c;
    })

    // load drawables
    this.drawable = data.drawable
  };
}

export enum NodeType {
  Switch,
  Host,
  Router,
  Internet
}


