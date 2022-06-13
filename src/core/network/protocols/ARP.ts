import { AddressableNode } from "../components/AddressableNode";
import { NetworkInterface } from "../components/NetworkInterface"
import { sleep } from "../Helper"
import TM from "../TrafficManager"
import { Frame, FrameType, MacAddr, MAC_BROADCAST_ADDR } from "./Ethernet"
import { IPv4Addr } from "./IPv4"

const ZERO_MAC = "00-00-00-00-00-00"

enum ArpType {
  Request = "ARP-Request",
  Response = "ARP-Response"
}

export class ArpPacket {
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
  node: AddressableNode
  arpCache: Map<IPv4Addr,MacAddr>
  arpCounter: number;
  onResolve: Function;
  pending: boolean

  constructor(node: AddressableNode) {
    this.node = node
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

  async resolve(ip: IPv4Addr, iface: NetworkInterface) : Promise<string> {
    // check if there is an entry in the arp table
    if (this.knows(ip)) {
      return this.arpCache.get(ip)
    } else {
      if (this.pending) {
        TM.debug("ARP.resolve() busy. Wait for previous operation to finish")
        await this.waitforResult()
        TM.debug("ARP.resolve() continue")
      }

      this.sendArpRequest(iface.getMacAddr(), iface.getIpAddr(), ip)
      
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

  sendArpRequest(srcMac: MacAddr, srcIp: IPv4Addr, dstIp: IPv4Addr) {
    TM.log(`ARP:  Node ${this.node.getNodeID()} (${this.node.getName()}) send Request`)
    const packet = new ArpPacket(ArpType.Request,srcIp,dstIp, srcMac, ZERO_MAC)
    
    const frame = new Frame(srcMac,MAC_BROADCAST_ADDR, FrameType.ARP, packet)
    this.node.maController.transmitFrame(frame)
    this.pending = true // shows that an Request was send.
  }

  sendArpResponse(srcMac: MacAddr, dstMac: MacAddr, srcIp: IPv4Addr, dstIp: IPv4Addr) {
    TM.log(`ARP: Node ${this.node.getNodeID()} (${this.node.getName()}) send Response`)
    const packet = new ArpPacket(ArpType.Response,srcIp, dstIp, srcMac, dstMac)
    const frame = new Frame(srcMac,dstMac, FrameType.ARP, packet)
    this.node.maController.transmitFrame(frame)
  }

  handleArpRequest(packet: ArpPacket, ownMac: MacAddr, ownIp: IPv4Addr) {
    // save senders ARP information
    this.arpCache.set(packet.senderIP, packet.senderMAC)
    // check if packet is for themselve.
    if ( packet.targetIP === ownIp) {
      TM.log(`ARP: Node ${this.node.getNodeID()} (${this.node.getName()}) received Request`)
      this.sendArpResponse(ownMac, packet.senderMAC, ownIp, packet.senderIP)
    } else {
      TM.debug(`Drop: Node ${this.node.getNodeID()} (${this.node.getName()}) dropped ${JSON.stringify(packet)}`)
    }
  }

  handleArpResponse(packet: ArpPacket) {
    TM.log(`ARP: Node ${this.node.getNodeID()} (${this.node.getName()}) received Response`)
    const mac = packet.senderMAC
    const ip = packet.senderIP
    this.arpCache.set(ip,mac)
    this.pending = false
    // todo! notify host about new arpCache entry.
    this.onResolve?.(ip, mac)
  }

  receivePacket(packet: ArpPacket) {
    let iface = this.node.getIfaceByIpAddr(packet.targetIP) 
    
    // if no interface is ofund use default interface instead
    if (iface === undefined) {iface = this.node.getDefaultIface()}

    if ( packet.type === ArpType.Request) {
      // arp request
      this.handleArpRequest(packet, iface.getMacAddr(), iface.getIpAddr() )
    } else {
      // arp response
      this.handleArpResponse(packet)
    }
  }
}

