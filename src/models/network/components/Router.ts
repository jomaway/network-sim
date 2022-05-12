import { Node, NodeID, NodeType } from "./Node"
import { NodeIcon } from "./Drawable"
import { Frame, FrameType, MacAddr, MAC_BROADCAST_ADDR } from "../protocols/Ethernet";
import { Connectable, Connector, ConnectorID } from "./Connector";
import { Host } from "./Host";
import {getUniqueMacAddr} from "../NetworkManager";
import { Service, SID } from "../services/Services";
import { ICMPHandler } from "../services/ICMP";
import { ArpHandler, Packet as ArpPacket } from "../protocols/ARP";
import { Packet as IpPacket } from "../protocols/IPv4";
import { IPv4Config } from "./Adressable";

export class Router extends Host {
  name: string;
  //lanMacAddr: MacAddr;
  //wanMacAddr: MacAddr;
  arpService: ArpHandler;
  ipConfig: Map<string, IPv4Config>
  services: Map<SID,Service>


  constructor(id: NodeID) {
    super(id, `Router-${id}`);
    //this.name = `Router-${id}`
    //this.lanMacAddr = getUniqueMacAddr()
    //this.wanMacAddr = getUniqueMacAddr()
    //this.ipConfig = new Map()
    
    this.connectors.length = 0;
    this.addNIC("LAN") // add one Connector for LAN
    this.addNIC("WAN") // add second Connector for WAN

    // overwrite Node Drawable
    this.drawable = new NodeIcon("#14B8A6","rect")

    // add ArpHandler
    //this.arpService = new ArpHandler(this)

    // register services
    // this.services = new Map()
  }

  /* ---------- Handle services  ----------*/

  registerService(service: Service) {
    // todo! warn if this service was already registerd.
    this.services.set(service.getServiceID(), service);
  }

  useService(sID: SID) {
    return this.services.get(sID);
  }

  hasService(sID: SID) {
    return this.services.has(sID)
  }

  getName(): string {
    return this.name
  }

  setName(name: string): void {
    this.name = name
  }

  getNodeType(): NodeType {
      return NodeType.Router
  }

  receive(orig: Connector, frame: Frame): void {
    if (orig.id === "LAN") {
      this.receiveOverLAN(frame)
    } else if (orig.id === "WAN") {
      this.receiveOverWAN(frame)
    }
    // else frame will be droped!  
  }

  receiveOverLAN(frame: Frame) {
    if (frame.type === FrameType.ARP) {
      // let arp handle the packet.
      if (frame.payload instanceof ArpPacket) this.arpService.handleArpPacket(frame.payload, {connector: this.getConnectorByID("LAN"), mac: this.getMacAddr("LAN"), ip: this.getLANConf()?.addr})
    } else { // FrameType.IP
      if (this.getMacAddr("LAN") === frame.dst) {
        // handle ipv4 packets
        if ( frame.payload instanceof IpPacket ) this.handleIpPacket(frame.payload, "LAN")
      } 
    }
    // else frame will be droped!
  }

  receiveOverWAN(frame: Frame) {
    if (frame.type === FrameType.ARP) {
      // let arp handle the packet.
      if (frame.payload instanceof ArpPacket) this.arpService.handleArpPacket(frame.payload, {connector: this.getConnectorByID("WAN"), mac: this.getMacAddr("WAN"), ip: this.getWANConf()?.addr})
    } else { // FrameType.IP
      if (this.getMacAddr("WAN") === frame.dst) {
        // handle ipv4 packets
        if ( frame.payload instanceof IpPacket ) this.handleIpPacket(frame.payload, "WAN")
      }
    }
    // else frame will be droped!
  }

  handleIpPacket(packet: IpPacket, orig: ConnectorID) {
    this.tm?.emit("NodeActive",`${this.name} rx packet over ${orig}`)
    const newPacket = this.performNAT(packet)
    if (orig === "LAN") {
      this.sendWAN(newPacket)
    } else if (orig === "WAN") {
      this.sendLAN(newPacket)
    }
  }

  performNAT(packet: IpPacket): IpPacket {
    return packet
  }

  sendWAN(packet: IpPacket) {
    
    if (this.arpService.knows(packet.dst)) {
      const frame = new Frame(this.getMacAddr("WAN"), this.arpService.resolve(packet.dst) ,FrameType.IPv4, packet)
      this.transmit(this.getWANConnector(), frame)
    } else {
      this.arpService.sendArpRequest(this.getMacAddr("WAN"), this.getWANConf().addr, packet.dst, this.getWANConnector())
      this.arpService.setOnResolveCb(() => { this.sendWAN(packet) })
    }
  }

  sendLAN(packet: IpPacket) {
    if (this.arpService.knows(packet.dst)) {
      const frame = new Frame(this.getMacAddr("LAN"), this.arpService.resolve(packet.dst) ,FrameType.IPv4, packet)
      this.transmit(this.getLANConnector(), frame)
    } else {
      this.arpService.sendArpRequest(this.getMacAddr("LAN"), this.getLANConf().addr, packet.dst, this.getLANConnector())
      this.arpService.setOnResolveCb(() => { this.sendLAN(packet) })
    }
  }

  setLAN(conf: IPv4Config) {
    this.ipConfig.set("LAN", conf)
  }

  setWAN(conf: IPv4Config) {
    this.ipConfig.set("WAN", conf)
  }

  getLANConf(): IPv4Config {
    return this.ipConfig.get("LAN")
  }

  getWANConf(): IPv4Config {
    return this.ipConfig.get("WAN")
  }

  getLANConnector() {
    return this.getConnectorByID("LAN")
  }

  getWANConnector() {
    return this.getConnectorByID("WAN")
  }

  /* ---------- Storage methods  ----------*/
  save() {
    let n = super.save()
      n["name"] = this.name
      n["lanMacAddr"] = this.getMacAddr("LAN")
      n["wanMacAddr"] = this.getMacAddr("WAN")
      n["lanipConfig"] = this.ipConfig.get("LAN")
      n["wanipConfig"] = this.ipConfig.get("WAN")
      n["services"] = []
      this.services.forEach((service) => n["services"].push(service.getServiceID()))
      return n
  }

  load(data: any) {
    super.load(data)
    //this.name = data.name
    //this.lanMacAddr = data.lanMacAddr
    //this.wanMacAddr = data.wanMacAddr
    //this.setLAN(data.lanipConfig)
    //this.setWAN(data.wanipConfig)
    // todo! load services
  }
}