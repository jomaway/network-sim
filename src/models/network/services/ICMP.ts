import { Service, SID } from "./Services";
import { Host } from "../components/Host";
import { IPv4Addr,  Packet } from "../protocols/IPv4";
import TM from "../TrafficManager";
import { mdiThumbsUpDown } from "@mdi/js";
import { sleep } from "../Helper";

const ICMP_REQUEST = Symbol("icmp-req")
const ICMP_RESPONSE = Symbol("icmp-res")

enum ResultType {
  pending = "pending",
  success = "success",
  error = "error",
}

export class ICMPHandler implements Service {
  owner: Host
  pending: Boolean
  result: ResultType

  constructor(owner: Host ) {
    this.owner = owner
    this.pending = false
    this.result = null
  }

  getServiceID() {
    return SID.ICMP
  };

  sendRequest(dstIp: IPv4Addr){
    this.sendIcmpRequest(dstIp)
  }

  async ping(dstIp: IPv4Addr) {
    this.sendIcmpRequest(dstIp)
    this.result = ResultType.pending
    const timerID = TM.setTimer(() => this.result = ResultType.error, 10 )
    while (this.result === ResultType.pending) await sleep(1000)
    TM.removeTimer(timerID)
    return this.result
  }

  handleIpPacket(packet: Packet) {
    // check if packet is request or response.
    if (packet.payload === ICMP_REQUEST.toString()) {
      this.handleIcmpRequest(packet)
    } else if (packet.payload === ICMP_RESPONSE.toString()){
      this.handleIcmpResponse(packet)
    } else {
      console.warn("No valid ICMP service packet"); 
    }
  };

  sendIcmpRequest(to: IPv4Addr) {
    TM.log(`"ICMP:" ${this.owner.name} send ping request`)
    const packet = new Packet(this.owner.getIpAddr(), to, SID.ICMP, ICMP_REQUEST.toString())
    this.owner.sendPacket(packet)
  }

  sendIcmpResponse(to: IPv4Addr) {
    TM.log(`"ICMP:" ${this.owner.name} send ping response`)
    const packet = new Packet(this.owner.getIpAddr(), to, SID.ICMP, ICMP_RESPONSE.toString())
    this.owner.sendPacket(packet)
  }

  handleIcmpRequest(packet: Packet) {
    TM.log(`"ICMP:" ${this.owner.name} rcv ping request`)
    this.sendIcmpResponse(packet.src)
  }

  handleIcmpResponse(packet: Packet) {
    TM.log(`"ICMP:" ${this.owner.name} rcv ping response`)
    this.result = ResultType.success
  }
}