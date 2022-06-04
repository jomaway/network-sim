import { Router } from "../components/Router";
import { IPv4Addr, Packet } from "./IPv4";
import { Service, SID } from "../services/Services";
import TM from "../TrafficManager";

export class NATHandler  {
  owner: Router
  natTable: Map<IPv4Addr,IPv4Addr>

  constructor(owner: Router){
    this.owner = owner
    this.natTable = new Map()
  }

  translateOutgoing(packet: Packet): Packet {
    const wanIP = this.owner.getWANConf().addr
    this.natTable.set(packet.dst, packet.src)
    TM.log(`NAT Router ${this.owner.getNodeID()} translate outgoing packet: src: ${packet.src} to ${wanIP}`)
    packet.src = wanIP
    return packet
  }

  translateIncoming(packet: Packet): Packet {
    const lanIP = this.owner.getLANConf().addr
    const hostIP = this.natTable.get(packet.src)
    TM.log(`NAT Router ${this.owner.getNodeID()} translate incoming packet: src: ${packet.src} to ${lanIP}, dst: ${packet.dst} to ${hostIP}`)
    packet.src = lanIP
    packet.dst = hostIP
    this.natTable.delete(packet.src)
    return packet
  }

}