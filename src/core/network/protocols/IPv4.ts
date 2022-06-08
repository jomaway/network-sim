import { NodeType } from "../components/NetworkComponents";
import { AdressableNode } from "../components/AddressableNode";
import { Host } from "../components/Host";
import { NetworkInterface } from "../components/NetworkInterface";
import { Frame, FrameType } from "./Ethernet";
import { NetworkLayer } from "./networkStack";

import TM from "../TrafficManager";

export type IPv4Addr = string;
export type Subnetmask = string;

export enum Protocol {
  MSG,
  ICMP,
  TCP,
  UDP,
  DHCPClient,
  DHCPServer,
  DNSServer,
  DNSClient,
}

export class IpPacket {
  src: IPv4Addr;
  dst: IPv4Addr;
  protocol: Protocol;
  payload: string;

  constructor(from: IPv4Addr, to: IPv4Addr, protocol: Protocol ,msg: string) {
    this.src = from;
    this.dst = to;
    this.protocol = protocol;
    this.payload = msg; 
  }
}

export class IpHandler implements NetworkLayer {
  node: AdressableNode

  constructor(node: AdressableNode) {
    this.node = node;
  }

  receivePacket(packet: IpPacket) {
    if (this.node.isType(NodeType.Host)) {
      const host = this.node as Host
      // forward packet depending on Protocol
      switch (packet.protocol) {
        case Protocol.ICMP:
          host.icmpHandler.handleIpPacket(packet);
          break;
        case Protocol.TCP:
          
          break;
        case Protocol.DHCPClient:
          host.dhcpClient.handleIpPacket(packet);
          break;
        case Protocol.DHCPServer:
          host.dhcpServer.receiveData(packet);
          break;
        default:
          TM.log(`Unknown Protocol: ${packet.protocol}`)
          break;
      }
    }
  }

  async sendPacket(packet: IpPacket) {
    let dstIp = packet.dst
    // check if the destination is a valid ip address
    if (!isValidIp(dstIp)) {
      throw new Error(`can't send packet. ${dstIp} is no valid ip.`)
    }
    // get iface associatet with  the source ip address
    let iface = this.node.getIfaceByIpAddr(packet.src)

    if (iface === undefined) {iface = this.node.getDefaultIface()}

    // check if ip is in the same network
    if (!this.isSameNetwork(dstIp, iface) && !this.isIpBroadcast(dstIp)) {
      TM.log("Destination not in the same network")
      // change dst ip to Gateway
      dstIp = iface.getGateway()
    } 
    const dstMac = await this.node.arpHandler.resolve(dstIp, iface)
    if (!dstMac) {
      TM.log(`Could not resolve the mac for ip ${dstIp} Packet will be droped`);
      return // drop packet
    }
    const frame = new Frame(iface.getMacAddr(),dstMac,FrameType.IPv4,packet)
    this.node.getMediaAccessControll().transmitFrame(frame)
  }

  isIpBroadcast(addr: IPv4Addr){
    return addr === "255.255.255.255"
  }

  isSameNetwork(addr: IPv4Addr, iface: NetworkInterface) : boolean {
    const snm = iface.getSubnetmask().split('.').map((octet) => parseInt(octet))

    const ownNetwork = iface.getIpAddr().split('.').map((octet, idx) => parseInt(octet) & snm[idx]).join('.')
    const otherNetwork = addr.split('.').map((octet, idx) => parseInt(octet) & snm[idx]).join('.')

    //console.log(ownNetwork, otherNetwork, ownNetwork === otherNetwork);
    
    return (ownNetwork === otherNetwork)
  }

}

export function isValidIp(value:string) : boolean {
  const parts = value.trim().split('.')
  if (parts.length !== 4) return false
  //const nums = parts.map((numStr: string) => parseInt(numStr,10))
  
  for (let i=0; i <4; i++) {
    const num = parseInt(parts[i])
    if (isNaN(num)) return false
    if (num < 0 || num > 255) return false
  }
  return true
}

/*
class Address {
  parts: number[]

  constructor() {
    this.parts = [0,0,0,0]
  }

  toString() {
    return `${this.parts[0]}.${this.parts[1]}.${this.parts[2]}.${this.parts[3]}`
  }

  static fromString(addrStr: string) {
    const addr = new Address()
    const partsStr = addrStr.trim().split('.')
    if(partsStr.length !== 4) throw Error("No valid ip addr")
    for (let index = 0; index < partsStr.length; index++) {
      const part = parseInt(partsStr[index])
      if (part < 0 || part > 255 ) throw Error("No valid ip addr. Value is out of bound.")
      addr.parts[index] = parseInt(partsStr[index])  
    }
    return addr
  }

  static isValid(addr: Address) {
    // length check
    if(addr.parts.length !== 4) return false
    // bound check
    addr.parts.forEach((part) => {
      if (part < 0 || part > 255 ) return false
    })
    return true 
  }

  calcNetID(snm: Subnetmask){
    // todo!
    console.error("Not implemented!");
  }

  isSameNetworkAs(addr: Address) {
    console.warn("Not implemented always true");
    return true
  }
}
*/