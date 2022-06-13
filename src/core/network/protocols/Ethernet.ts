import { SID } from "../services/Services";
import { IpPacket, Protocol } from "./IPv4";

export type MacAddr = string;

export const MAC_BROADCAST_ADDR = "FF-FF-FF-FF-FF-FF"

export enum FrameType {
  IPv4 = "IPv4",
  ARP = "ARP",
}

export class Frame {
  src: string;
  dst: string;
  type: FrameType;
  payload: any;

  constructor(src: string, dst: string, type: FrameType, payload: any) {
    this.src = src;
    this.dst = dst;
    this.type = type;
    this.payload = payload;
  }

  stringify() {
    return `Frame: \n  src: ${this.src} \n  dst: ${this.dst} \n  type: ${this.type === FrameType.IPv4 ? 'IPv4' : 'ARP'}`
  }

  /**
   * TODO! move to gui part. 
   * @returns a label for the frame to display on the graph msg 
   */
  getTypeLabel() {
    if (this.type === FrameType.IPv4) {
      const packet = this.payload as IpPacket
      switch (packet.protocol) {
        case Protocol.ICMP: return "ICMP"
        case Protocol.DHCPClient: return "DHCP"
        case Protocol.DHCPServer: return "DHCP"
        default: return "MSG"
      }
    } else {
      return this.type
    }
  }
}