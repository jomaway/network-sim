import { Node, NodeID, NodeType } from "./Node"
import { NodeIcon } from "../Drawable"
import { Frame, FrameType, MacAddr, MAC_BROADCAST_ADDR } from "../../protocols/Ethernet";
import { Connectable, Connector, ConnectorID, NIC } from "./Connector";
import { Host } from "./Host";
import {getUniqueMacAddr} from "../../NetworkManager";
import { Service, SID } from "../../services/Services";
import { ICMPHandler } from "../../protocols/ICMP";
import { ArpHandler, Packet as ArpPacket } from "../../protocols/ARP";
import { Packet as IpPacket } from "../../protocols/IPv4";
import { IPv4Config } from "./Adressable";
import { NATHandler } from "../../protocols/NAT";

export class Router extends Host {
  natService: NATHandler;


  constructor(id: NodeID) {
    super(id, `Router-${id}`);
    
    this.connectors.length = 0;  // remove default connector from host constructor
    this.addNIC("LAN") // add one Connector for LAN
    this.addNIC("WAN") // add second Connector for WAN

    this.natService = new NATHandler(this)

    // overwrite Node Drawable
    this.drawable = new NodeIcon("#14B8A6","rect")

  }

  /* ---------- Handle services  ----------*/

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
        if ( frame.payload instanceof IpPacket ) {
          const packet = frame.payload 
          // check if destination is the router or another network
          if (packet.dst !== this.getLANConf().addr) {
            const translatedPacket = this.natService.translateOutgoing(packet)
            this.sendWAN(translatedPacket)
          } else {
            this.handleIpPacket(packet, this.getLANConnector().id)
          }
        }
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
        if ( frame.payload instanceof IpPacket ) {
          const packet = frame.payload
          if (packet.dst === this.getWANConf().addr) {
            const translatedPacket = this.natService.translateIncoming(packet)
            this.sendLAN(translatedPacket)
          } else {
            // Drop Packet // maybee support Port forwarding in future
          }
          
        }
      }
    }
    // else frame will be droped!
  }

  async sendWAN(packet: IpPacket) {
    const frame = new Frame(this.getMacAddr("WAN"), await this.arpService.resolve(packet.dst, this.getWANConnector()) ,FrameType.IPv4, packet)
    this.transmit(this.getWANConnector(), frame)
  }

  async sendLAN(packet: IpPacket) {
    const frame = new Frame(this.getMacAddr("LAN"), await this.arpService.resolve(packet.dst, this.getLANConnector()) ,FrameType.IPv4, packet)
    this.transmit(this.getLANConnector(), frame)
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

  getLANConnector(): NIC {
    return this.getConnectorByID("LAN") as NIC
  }

  getWANConnector() : NIC {
    return this.getConnectorByID("WAN") as NIC
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