import { Host } from "../components/Host"
import { NetworkInterface } from "../components/NetworkInterface"
import { IPv4Addr } from "../protocols/IPv4"
import { SID } from "./Services"

enum ReturnState {
  SUCCESS,
  ERROR,
}

export class CommandHandler {
  host: Host

  constructor(host: Host) {
    this.host = host
  }

  async run(cmd: string) {
    throw new Error("unimplemented")
  }

  ping(dstIp: IPv4Addr) : object {
    const ret = this.host.icmpHandler.ping(dstIp)
    return {status: "success", msg: ret}
  }

  ipconfig() : object {
    let retVal = {}
    this.host.getIfaceList().forEach((iface: NetworkInterface) =>{
      retVal[iface.getName()] = iface.getConfig()
    })
    return retVal;
  }

  message(dstIp: IPv4Addr, msg: string) : void {
    // this.host.msgHandler.send(dstIp, msg)
  }

  getDynamicIpConfig() : void {
    this.host.dhcpClient.sendDHCPDiscover()
  }

}