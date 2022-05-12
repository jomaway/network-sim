import { Packet } from "../protocols/IPv4";

export enum SID {
  MSG,
  ICMP,
  DHCPClient,
  DHCPServer,
}

export interface Service {
  getServiceID: () => SID;
  //getState: () => ServiceState;
  sendRequest: (args?: any) => void;
  handleIpPacket: (packet: Packet) => void;
}

export enum ServiceState {
  idle, // Initial state
  pending, // Waiting for response
  error, // some error happend
}