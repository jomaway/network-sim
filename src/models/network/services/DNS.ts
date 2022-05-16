import { Packet } from "../protocols/IPv4";
import { Service, SID } from "./Services";

export class DNSServer implements Service {
  
  getServiceID: () => SID;
  sendRequest: (args?: any) => void;
  handleIpPacket: (packet: Packet) => void;

}