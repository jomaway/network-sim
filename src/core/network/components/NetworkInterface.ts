import { mdiThermometerMinus } from "@mdi/js";
import { getUniqueMacAddr } from "../NetworkManager";
import {  MacAddr } from "../protocols/Ethernet";
import { IPv4Addr,  isValidIp,  Subnetmask } from "../protocols/IPv4";
import { MediaAccessControll, MediaAccessController } from "../protocols/networkStack";
import { Node } from "./Node";
import { Port } from "./Port";

export class NetworkInterface {
  name: string;
  static: boolean;
  macAddr: MacAddr;
  ipAddr: IPv4Addr;
  snm: Subnetmask;
  gw: IPv4Addr;
  dns: IPv4Addr;
  port: Port;

  constructor(name: string, mac: MacAddr, node: Node) {
    this.name = name;
    this.static = false;
    this.macAddr = mac;
    this.ipAddr = "192.168.30.10";
    this.snm = "255.255.255.0";
    this.gw = "";
    this.dns = "";
    this.port = new Port(node);
  }

  setNetworkInterfaceController(nic: MediaAccessControll) {
    this.port.hookUpMAC(nic)
  }

  getName () : string {
    return this.name;
  }

  setName (name: string) {
    this.name = name;
  }

  /**
   * 
   * @returns the mac address of the interface
   */
  getMacAddr () : MacAddr {
    return this.macAddr;
  };

  getIpAddr () : IPv4Addr {
    return this.ipAddr;
  }

  getSubnetmask () : Subnetmask {
    return this.snm;
  }

  getGateway () : IPv4Addr {
    return this.gw
  }

  getDns () : IPv4Addr {
    return this.dns;
  }

  /**
   * 
   * @param addr a valid ip addr.
   */
  setIpAddr (addr: IPv4Addr) : void {
    if (!isValidIp(addr)) throw new Error("NIC.setIpAddr() - no valid ip address")
    this.ipAddr = addr;
  }

  setSubnetmask (snm: Subnetmask) : void {
    if (!isValidIp(snm)) throw new Error("NIC.setSubnetmask() - no valid snm address")
    this.snm = snm;
  }

  setGateway (gw: IPv4Addr) : void {
    if (!isValidIp(gw) && gw !== "") throw new Error("NIC.setGateway() - no valid ip address")
    this.gw = gw;
  }

  setDns (dns: IPv4Addr) : void {
    if (!isValidIp(dns) && dns !== "") throw new Error("NIC.setDns() - no valid ip address")
    this.dns = dns;
  }

  // for debug only
  getConfig() {
    return {
      name: this.getName(),
      mac: this.getMacAddr(),
      addr: this.getIpAddr(),
      snm: this.getSubnetmask(),
      gw: this.getGateway(),
      dns: this.getDns(),
    }
  }
  setConfig(conf) {
    this.setName(conf.name)
    this.setIpAddr(conf.addr)
    this.setSubnetmask(conf.snm)
    this.setGateway(conf.gw)
    this.setDns(conf.dns)
  }
}