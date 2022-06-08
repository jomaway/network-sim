import { Service, SID } from "./Services";
import { Host } from "../components/NetworkComponents";
import { IPv4Addr,  Packet } from "../protocols/IPv4";


export class MsgHandler implements Service {
  node: Host

  constructor(owner: Host) {
    this.node = owner
  }

  getServiceID() {
    return SID.MSG
  };

  sendRequest(args: any){
    const { dstIp, msg } = args
    const srcIp = this.node.getDefaultIface().getIpAddr()
    const packet = new Packet(srcIp,dstIp,SID.MSG,msg)
    this.node.ipHandler.sendPacket(packet)
  }

  handleIpPacket(packet: Packet) {
    console.log("Msg Handler", packet);
  };
}