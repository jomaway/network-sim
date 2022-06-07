import { Port } from "../components/Port";
import { Frame, FrameType, MacAddr, MAC_BROADCAST_ADDR } from "./Ethernet";
import { Packet as ArpPacket, ArpHandler } from "../protocols/ARP";
import { IPv4Addr, Packet as IpPacket } from "../protocols/IPv4";
import { NetworkInterface } from "../components/NetworkInterface";
import { AdressableNode, Host, NodeType, Switch } from "../components/NetworkComponents";
import TM from "../TrafficManager";

export class IpHandler {
  node: AdressableNode

  constructor(node: AdressableNode) {
    this.node = node;
  }

  handlePacket(packet: IpPacket) {
    if (this.node.isType(NodeType.Host)) {
      const host = this.node as Host
      // forward to service 
      if (host.hasService(packet.sID)) {
        host.useService(packet.sID)?.handleIpPacket(packet)
      } else {
        TM.log(`Unknown SID: ${packet.sID}`)
      }
    }
  }

  async sendPacket(packet: IpPacket) {
    let dstIp = packet.dst
    // check if the destination is a valid ip address
    if (!this.isValidIp(dstIp)) {
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
    this.node.maController.transmitFrame(frame)
  }

  isValidIp(value:string) : boolean {
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

  isIpBroadcast(addr){
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

export interface MediaAccessControll {
  receiveFrame: (port: Port, frame: Frame) => void ;
  transmitFrame: (frame: Frame) => void;
}

export class SwitchPortController implements MediaAccessControll {
  macTable: Map<Port,Array<MacAddr>>
  device: Switch

  constructor(device: Switch) {
    this.macTable = new Map()
    this.device = device
  }

  receiveFrame (origin: Port, frame: Frame) : void {
    // Add src to macTable
    if (frame.src !== "FF-FF-FF-FF-FF-FF") {
      this.addToMacTable(origin, frame.src)
    }
    
    // Lookup dst MAC Addr
    const dstPort = this.lookUpMacAddr(frame.dst)
    if (dstPort) {
      // forward frame through that port.
      this.device.ports.find((port: Port) => port === dstPort ).tx(frame)
    } else {
      // Broadcast message
      this.device.ports.filter((port : Port) => port.isConnected())
      .forEach((port: Port) => {
        if (port !== origin ) port.tx(frame)
      })
    }
  };

  transmitFrame (frame: Frame) :void {
    // do nothing
  };

  addToMacTable(port: Port, macAddr: MacAddr) {
    this.macTable.has(port) ? 
      this.macTable.set(port, [... new Set([macAddr, ...this.macTable.get(port)])]) :
      this.macTable.set(port, [macAddr]);
  }

  lookUpMacAddr(macAddr: MacAddr) {
    for (const [key, value] of this.macTable) {
      if (value.includes(macAddr)) {
        return key
      }
    }
    return null
  }
}

export class MediaAccessController implements MediaAccessControll {
  node: AdressableNode;
  arpHandler: ArpHandler;
  ipHandler: IpHandler;

  constructor(node: AdressableNode) {
    this.node = node;
    this.arpHandler = node.arpHandler // todo! maybe use getter method
    this.ipHandler = node.ipHandler // todo! maybe use getter method
  };

  receiveFrame (port: Port, frame: Frame) : void {
    //  only process frame if it has a valid destination mac-address
    const macAddressList = this.node.getIfaceList().map((ni: NetworkInterface) => ni.getMacAddr());
    console.log("#Debug: macAddressList", macAddressList);
    
    if( macAddressList.includes(frame.dst) || MAC_BROADCAST_ADDR === frame.dst) {
      //this.owner.receive(this, frame)
      if (frame.type === FrameType.ARP) {
        // let arp handle the packet.
        if (frame.payload instanceof ArpPacket) this.arpHandler.handlePacket(frame.payload)
      } else { // FrameType.IP
        if (frame.payload instanceof IpPacket ) this.ipHandler.handlePacket(frame.payload)
      }
      // else frame will be droped!  
    }
  };

  /**
   * Transmit the frame through the port.
   * this method fires and forgets. If the port is not connected frame will be dropped.
   * 
   * @param frame frame to be transmitted
   */
  transmitFrame (frame: Frame) :void {
    const iface = this.node.getIfaceByMacAddr(frame.src)
    iface.port.tx(frame)
  };
}