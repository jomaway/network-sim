import { Client as DHCPClient } from "../services/DHCP";
import { ICMPHandler } from "../services/ICMP";
import { Service, SID } from "../services/Services";
import { AdressableNode } from "./AddressableNode";
import { NodeID, NodeType } from "./NetworkComponents";

export class Host extends AdressableNode {
  services: Map<SID,Service>

  constructor(id: NodeID, name: string = "Host") {
    super(id)
    this.name = name;
    this.services = new Map();

    this.addInterface("eth 0")

    this.registerService(new ICMPHandler(this))
    this.registerService(new DHCPClient(this)) 
  }

  /*
  getDefaultIface() : NetworkInterface {
    return this.networkInterfaces[0]
  }
  */
  
  getNodeType(): NodeType {
    return NodeType.Host;
  }

  /* ---------- Handle services  ----------*/
  // move later to service handler.

  registerService(service: Service) {
    // todo! warn if this service was already registerd.
    if (this.services.has(service.getServiceID())) console.warn("overwrite service ", service.getServiceID(),"on node", this.getNodeID());
    
    this.services.set(service.getServiceID(), service);
  }

  useService(sID: SID) {
    return this.services.get(sID);
  }

  hasService(sID: SID) {
    return this.services.has(sID)
  }

  /* ---------- Handle user interactions  ----------*/

  async runCommand(cmd: string) {
    // todo!
    // return await this.commandInterpreter.run(cmd)
    // if networkTask 
    //    -> msgBroaker.send()
    // if configTask
    //    taskManager.run()

    const icmpService = this.useService(SID.ICMP) as ICMPHandler
    return icmpService.ping("192.168.30.1");
  }
}