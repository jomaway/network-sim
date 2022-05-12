import { SID } from "../services/Services";
import { Packet } from "./IPv4";

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

  getTypeLabel() {
    if (this.type === FrameType.IPv4) {
      const packet = this.payload as Packet
      switch (packet.sID) {
        case SID.ICMP: return "ICMP"
        case SID.DHCPClient: return "DHCP"
        case SID.DHCPServer: return "DHCP"
        default: return "MSG"
      }
    } else {
      return this.type
    }
  }
}