import { mdiSleep } from "@mdi/js"
import { Connector, NIC } from "../components/Connector"
import { Host } from "../components/Host"
import { Node } from "../components/Node"
import { sleep } from "../Helper"
import TM, { TrafficEvent } from "../TrafficManager"
import { Frame, FrameType, MacAddr, MAC_BROADCAST_ADDR } from "./Ethernet"
import { IPv4Addr } from "./IPv4"

const ZERO_MAC = "00-00-00-00-00-00"

enum ArpType {
  Request = "ARP-Request",
  Response = "ARP-Response"
}

export class Packet {
  type: ArpType
  senderIP: IPv4Addr
  targetIP: IPv4Addr
  senderMAC: MacAddr
  targetMAC: MacAddr

  constructor(type: ArpType, senderIP: IPv4Addr, targetIP: IPv4Addr, senderMAC: MacAddr, targetMAC: MacAddr) {
    this.type = type;
    this.senderIP = senderIP;
    this.targetIP = targetIP;
    this.senderMAC = senderMAC;
    this.targetMAC = targetMAC;
  }
}


export class ArpHandler {
  owner: Node
  arpCache: Map<IPv4Addr,MacAddr>
  arpCounter: number;
  onResolve: Function;
  pending: boolean

  constructor(owner: Node) {
    this.owner = owner
    this.arpCache = new Map()
    this.arpCounter = 0;
    this.onResolve = null
    this.arpCache.set("255.255.255.255", MAC_BROADCAST_ADDR)
    this.pending = false 
  }

  setOnResolveCb(fn: Function) {
    this.onResolve = fn;
  }

  reset() {
    this.arpCache.clear()
  }

  knows(ip: IPv4Addr) {
    return this.arpCache.has(ip)
  }

  async resolve(ip: IPv4Addr, iface: NIC) : Promise<string> {
    // check if there is an entry in the arp table
    if (this.knows(ip)) {
      return this.arpCache.get(ip)
    } else {
      if (this.pending) {
        TM.debug("ARP.resolve() busy. Wait for previous operation to finish")
        await this.waitforResult()
        TM.debug("ARP.resolve() continue")
      }
      const o = this.owner as Host  // todo pass interface to fn
      this.sendArpRequest(iface.getMacAddr(), o.getIpAddr(iface.id), ip, iface)
      
      const timerID = TM.setTimer(() => this.pending = false, 10 )
      await this.waitforResult()
      TM.removeTimer(timerID)
      
      return this.arpCache.get(ip)
    }
  }

  async waitforResult(){
    while (this.pending) {
      await sleep(1000)
    } 
  }

  sendArpRequest(srcMac: MacAddr, srcIp: IPv4Addr, dstIp: IPv4Addr, connector: Connector) {
    TM.log(`ARP:  Node ${this.owner.getNodeID()} (${this.owner.getName()}) send Request`)
    const packet = new Packet(ArpType.Request,srcIp,dstIp, srcMac, ZERO_MAC)
    const frame = new Frame(srcMac,MAC_BROADCAST_ADDR, FrameType.ARP, packet)
    this.owner.transmit(connector,frame)
    this.pending = true // shows that an Request was send.
  }

  sendArpResponse(srcMac: MacAddr, dstMac: MacAddr, srcIp: IPv4Addr, dstIp: IPv4Addr, connector: Connector) {
    TM.log(`ARP: Node ${this.owner.getNodeID()} (${this.owner.getName()}) send Response`)
    const packet = new Packet(ArpType.Response,srcIp, dstIp, srcMac, dstMac)
    const frame = new Frame(srcMac,dstMac, FrameType.ARP, packet)
    this.owner.transmit(connector,frame)
  }

  handleArpRequest(packet: Packet, ownMac: MacAddr, ownIp: IPv4Addr, connector: Connector) {
    // save senders ARP information
    this.arpCache.set(packet.senderIP, packet.senderMAC)
    // check if packet is for themselve.
    if ( packet.targetIP === ownIp) {
      TM.log(`ARP: Node ${this.owner.getNodeID()} (${this.owner.getName()}) received Request`)
      this.sendArpResponse(ownMac, packet.senderMAC, ownIp, packet.senderIP, connector)
    } else {
      TM.debug(`Drop: Node ${this.owner.getNodeID()} (${this.owner.getName()}) dropped ${JSON.stringify(packet)}`)
    }
  }

  handleArpResponse(packet: Packet) {
    TM.log(`ARP: Node ${this.owner.getNodeID()} (${this.owner.getName()}) received Response`)
    const mac = packet.senderMAC
    const ip = packet.senderIP
    this.arpCache.set(ip,mac)
    this.pending = false
    // todo! notify host about new arpCache entry.
    this.onResolve?.(ip, mac)
  }

  handleArpPacket(packet: Packet, iface: {connector: Connector, mac: MacAddr, ip: IPv4Addr}) {
    if ( packet.type === ArpType.Request) {
      // arp request
      this.handleArpRequest(packet, iface.mac, iface.ip, iface.connector )
    } else {
      // arp response
      this.handleArpResponse(packet)
    }
  }
}

