import { Service, SID } from "./Services";
import { Host } from "../components/Host";
import { IPv4Addr,  Packet } from "../protocols/IPv4";


export class MsgHandler implements Service {
  owner: Host

  constructor(owner: Host) {
    this.owner = owner
  }

  getServiceID() {
    return SID.MSG
  };

  sendRequest(args: any){
    const { dstIp, msg } = args
    const srcIp = this.owner.getIpAddr()
    const packet = new Packet(srcIp,dstIp,SID.MSG,msg)
    this.owner.sendPacket(packet)
  }

  handleIpPacket(packet: Packet) {
    console.log("Msg Handler", packet);
  };
}