import { getUniqueMacAddr } from "../NetworkManager";
import { ArpHandler } from "../protocols/ARP";
import { MacAddr } from "../protocols/Ethernet";
import { IPv4Addr } from "../protocols/IPv4";
import { IpHandler, MediaAccessControll, MediaAccessController, SwitchPortController } from "../protocols/networkStack";
import { ICMPHandler } from "../services/ICMP";
import { Service, SID } from "../services/Services";
import { Link } from "./Link";
import { NetworkInterface } from "./NetworkInterface";
import { Port } from "./Port";
import { Client as DHCPClient, Server as DHCPServer } from "../services/DHCP";

export type NodeID = number;

export enum NodeType {
  Switch,
  Host,
  Router,
  Cloud
}

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

  abstract getMediaAccessControll(): MediaAccessControll;
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

export abstract class AdressableNode extends Node {
  networkInterfaces: Array<NetworkInterface>;
  
  maController: MediaAccessController
  arpHandler: ArpHandler
  ipHandler: IpHandler

  constructor(id: NodeID) {
    super(id);
    this.networkInterfaces = []
    this.ipHandler = new IpHandler(this)
    this.arpHandler = new ArpHandler(this)
    // important init after other handlers
    this.maController = new MediaAccessController(this)
  }

  isAddressable(): boolean {
    return true;
  }

  addInterface(name: string) : NetworkInterface {
    const iface = new NetworkInterface(name, getUniqueMacAddr(), this);
    this.networkInterfaces.push(iface);
    return iface
  }

  /**
   * 
   * @returns a unconnected network interface if available otherwise undefined
   */
  getNextFreeIface() : NetworkInterface {
    return this.networkInterfaces.find((iface) => !iface.port.isConnected())
  }

  /**
   * 
   * @param name name to look for
   * @returns iface with associated name or undefined if it does not exists
   */
  getIfaceByName(name: string) : NetworkInterface {
    return this.networkInterfaces.find((iface) => iface.name === name);
  }

  /**
   * 
   * @param macAddr mac-address to look for
   * @returns iface with associated mac-address or undefined if it does not exists
   */
  getIfaceByMacAddr(macAddr: MacAddr) : NetworkInterface {
    // macs should be unique otherwise only the first one found will be returned. 
    return this.networkInterfaces.find((iface) => iface.macAddr === macAddr);
  }
  
  /**
   * 
   * @param ipAddr ip-address to look for
   * @returns iface with associated ip-address or undefined if it does not exists
   */
  getIfaceByIpAddr(ipAddr: IPv4Addr) : NetworkInterface {
    // if multiple nics have the same ip addr, this will only return the first one. 
    return this.networkInterfaces.find((iface) => iface.ipAddr === ipAddr);
  }

  /**
   * 
   * @returns all network interfaces for that node
   */
  getIfaceList() : Array<NetworkInterface>{
    return this.networkInterfaces
  }

  disconnectAllLinks(): void {
    this.networkInterfaces.forEach((iface: NetworkInterface) => iface.port.disconnect())
  }

  getConnectedLinks() : Array<Link> {
    return this.networkInterfaces.filter((iface: NetworkInterface) => iface.port.isConnected()).map((iface: NetworkInterface) => iface.port.link )
  }

  getMediaAccessControll(): MediaAccessControll {
    return this.maController
  }

  hasFreePort(): boolean {
    return this.networkInterfaces.find((iface: NetworkInterface) => !iface.port.isConnected()) !== undefined;
    //return this.networkInterfaces.filter((iface: NetworkInterface) => !iface.port.isConnected()).length > 0;
  }

  getNextFreePort(): Port {
    return this.getNextFreeIface().port
  }

  /**
   * 
   * @returns the default interface
   */
  getDefaultIface() : NetworkInterface {
    return this.networkInterfaces[0]
  }
}

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

export class Router extends AdressableNode {

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

export class Switch extends Node {
  ports: Array<Port>;
  spc: SwitchPortController;

  constructor(id: NodeID, ports: number) {
    super(id);
    this.name = `Switch-${ports}`;
    this.ports = []
    this.spc = new SwitchPortController(this)
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
    return this.spc;
  }

  hasFreePort(): boolean {
    return this.ports.find((port: Port) => !port.isConnected()) !== undefined;
    //return this.networkInterfaces.filter((iface: NetworkInterface) => !iface.port.isConnected()).length > 0;
  }

  getNextFreePort(): Port {
    return this.ports.find((port: Port) => !port.isConnected())
  }
}

export class Cloud extends Switch {

  constructor(id) {
    super(id, 100)
  }

  getNodeType(): NodeType {
    return NodeType.Cloud
  }
}