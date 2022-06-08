import { AdressableNode } from "../components/AddressableNode";
import { IPv4Addr,  IpPacket, Protocol } from "./IPv4";
import TM from "../TrafficManager";
import { sleep } from "../Helper";

const ICMP_REQUEST = Symbol("icmp-req")
const ICMP_RESPONSE = Symbol("icmp-res")

enum ResultType {
  pending = "pending",
  success = "success",
  error = "error",
}

export class ICMPHandler {
  node: AdressableNode
  pending: Boolean
  result: ResultType

  constructor(node: AdressableNode ) {
    this.node = node
    this.pending = false
    this.result = null
  }

  getAssociatedProtocol() {
    return Protocol.ICMP
  };

  async ping(dstIp: IPv4Addr) {
    this.sendIcmpRequest(dstIp)
    this.result = ResultType.pending
    const timerID = TM.setTimer(() => this.result = ResultType.error, 10 )
    while (this.result === ResultType.pending) await sleep(1000)
    TM.removeTimer(timerID)
    return this.result
  }

  handleIpPacket(packet: IpPacket) {
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
    TM.log(`"ICMP:" ${this.node.name} send ping request`)
    const packet = new IpPacket(this.node.getDefaultIface().getIpAddr(), to, Protocol.ICMP, ICMP_REQUEST.toString())
    this.node.ipHandler.sendPacket(packet)
  }

  sendIcmpResponse(to: IPv4Addr) {
    TM.log(`"ICMP:" ${this.node.name} send ping response`)
    const packet = new IpPacket(this.node.getDefaultIface().getIpAddr(), to, Protocol.ICMP, ICMP_RESPONSE.toString())
    this.node.ipHandler.sendPacket(packet)
  }

  handleIcmpRequest(packet: IpPacket) {
    TM.log(`"ICMP:" ${this.node.name} rcv ping request`)
    this.sendIcmpResponse(packet.src)
  }

  handleIcmpResponse(packet: IpPacket) {
    TM.log(`"ICMP:" ${this.node.name} rcv ping response`)
    this.result = ResultType.success
  }
}