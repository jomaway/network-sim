import { NodeID, NodeType } from "./NetworkComponents";
import { Port } from "./Port";
import { Link } from "./Link";
import { MediaAccessControll } from "../protocols/networkStack";

export abstract class Node  {
  id: NodeID
  name: string

  constructor(id: NodeID) {
    this.id = id;
    this.name = "Node"
  }

  getNodeID() {return this.id}
  isNodeWithID(id: number) { return this.id === id };

  getName() : string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  };

  isType(nType : NodeType) : boolean {
    return this.getNodeType() === nType;
  }

  abstract isAddressable () : boolean;

  abstract getNodeType() : NodeType;

  abstract disconnectAllLinks() : void;
  abstract getConnectedLinks(): Array<Link>;
  abstract getMediaAccessControll(): MediaAccessControll

  abstract hasFreePort() : boolean;
  abstract getNextFreePort() : Port;

  save(): any { 
    // do something.
    let n = {}
      n["id"] = this.getNodeID();
      n["type"] = this.getNodeType();
      n["name"] = this.getName();
    return n
  }

  load(data: any): void {
    // do something
    this.id = data.id
    this.name = data.name

    console.log("Load Node:", this.id, this.name, this.getNodeType(), this);
  }

}