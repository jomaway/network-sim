import { NodeID } from "./NetworkComponents";
import { Node } from "./Node";
import { Port } from "./Port";
import { Link } from "./Link";
import { NetworkInterface } from "./NetworkInterface";
import { getUniqueMacAddr } from "../NetworkManager";

import { MediaAccessControll, MediaAccessController } from "../protocols/networkStack";
import { MacAddr } from "../protocols/Ethernet";
import { IPv4Addr, IpHandler } from "../protocols/IPv4";
import { ArpHandler } from "../protocols/ARP";
import { ICMPHandler } from "../protocols/ICMP";

export abstract class AddressableNode extends Node {
  networkInterfaces: Array<NetworkInterface>;
  
  maController: MediaAccessController
  arpHandler: ArpHandler
  ipHandler: IpHandler
  icmpHandler: ICMPHandler

  constructor(id: NodeID) {
    super(id);
    this.networkInterfaces = []
    this.maController = new MediaAccessController(this)
    this.arpHandler = new ArpHandler(this)
    this.ipHandler = new IpHandler(this)
    this.icmpHandler = new ICMPHandler(this)
    // important init after other handlers
  }

  getNetworkLayer() {
    return this.ipHandler
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
  getNextFreeIface() : NetworkInterface | undefined {
    return this.networkInterfaces.find((iface) => !iface.port.isConnected())
  }

  /**
   * 
   * @param name name to look for
   * @returns iface with associated name or undefined if it does not exists
   */
  getIfaceByName(name: string) : NetworkInterface | undefined {
    return this.networkInterfaces.find((iface) => iface.name === name);
  }

  /**
   * 
   * @param macAddr mac-address to look for
   * @returns iface with associated mac-address or undefined if it does not exists
   */
  getIfaceByMacAddr(macAddr: MacAddr) : NetworkInterface | undefined {
    // macs should be unique otherwise only the first one found will be returned. 
    return this.networkInterfaces.find((iface) => iface.macAddr === macAddr);
  }
  
  /**
   * 
   * @param ipAddr ip-address to look for
   * @returns iface with associated ip-address or undefined if it does not exists
   */
  getIfaceByIpAddr(ipAddr: IPv4Addr) : NetworkInterface | undefined {
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

  /**
   * 
   * @returns 
   */
  save(): object { 
    // do something.
    let n = super.save()
    n["ipconfig"] = this.getDefaultIface().save()
    return n
  }

  load(data: any): void {
    // do something
    super.load(data);

    this.getDefaultIface().load(data.ipconfig)
  }
}