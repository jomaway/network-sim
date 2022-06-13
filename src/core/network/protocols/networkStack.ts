import { AddressableNode } from "../components/AddressableNode";
import { NetworkInterface } from "../components/NetworkInterface";
import { Switch } from "../components/Switch";
import { Port } from "../components/Port";

import { Frame, FrameType, MacAddr, MAC_BROADCAST_ADDR } from "../protocols/Ethernet";
import { ArpPacket as ArpPacket, ArpHandler } from "../protocols/ARP";
import { IpPacket } from "../protocols/IPv4";
import { TcpSegment } from "./TCP";
import { UdpSegment } from "./UDP";
import TM, { TrafficEvent } from "../TrafficManager";

export interface ApplicationLayer {
  receiveData: (data:any) => void;
} 

export interface TransportLayer {
  receiveSegment: (segment: TcpSegment | UdpSegment) => void;
  sendSegment: (segment: TcpSegment | UdpSegment) => void;
}

export interface NetworkLayer {
  receivePacket: (packet: IpPacket) => void;
  sendPacket: (packet: IpPacket) => void;
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
      this.device.ports.find((port: Port) => port === dstPort )?.tx(frame)
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
  node: AddressableNode;

  constructor(node: AddressableNode) {
    this.node = node;
  };

  async receiveFrame (port: Port, frame: Frame) : Promise<void> {
    //  only process frame if it has a valid destination mac-address
    const macAddressList = this.node.getIfaceList().map((ni: NetworkInterface) => ni.getMacAddr());
    console.log("#Debug: MediaAccessController - Node ", this.node.getNodeID(),  "macAddressList: ", macAddressList);
    
    if( macAddressList.includes(frame.dst) || MAC_BROADCAST_ADDR === frame.dst) {
      //this.owner.receive(this, frame)
      if (frame.type === FrameType.ARP) {
        // let arp handle the packet.
        if (frame.payload instanceof ArpPacket) this.node.arpHandler.receivePacket(frame.payload)
      } else { // FrameType.IP
        if (frame.payload instanceof IpPacket ) this.node.getNetworkLayer().receivePacket(frame.payload)
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
  async transmitFrame (frame: Frame) {
    const iface = this.node.getIfaceByMacAddr(frame.src)
    await TM.notify(TrafficEvent.BeforeTransmit)
    iface?.port.tx(frame)
  };
}