import { Host } from "../components/Host";
import { Storeable } from "../NetworkManager";
import { Frame, FrameType, MacAddr } from "./Ethernet";
import { IPv4Addr, IpPacket, Protocol, Subnetmask } from "./IPv4";
import TM from "../TrafficManager";
import { Service } from "../services/Services";

const DHCP_DISCOVER = Symbol("dhcp-discover")
const DHCP_OFFER = Symbol("dhcp-offer")
const DHCP_REQUEST = Symbol("dhcp-request")
const DHCP_ACK = Symbol("dhcp-ack")

enum DHCPMsgType {
  DISCOVER,
  OFFER,
  REQUEST,
  ACK,
}

enum ServiceState {
  idle, // Initial state
  pending, // Waiting for response
  error, // some error happend
}

class Ipv4Config {
  addr: IPv4Addr;
  snm: Subnetmask;
  gw: IPv4Addr;
  dns: IPv4Addr;

  constructor(addr: IPv4Addr, snm: Subnetmask, gw: IPv4Addr, dns: IPv4Addr) {
    this.addr = addr;
    this.snm = snm;
    this.gw = gw;
    this.dns = dns;
  }
}


class DHCPMsg {
  type: DHCPMsgType
  macAddr: MacAddr
  ipConfig: Ipv4Config
  
  
  constructor(type: DHCPMsgType) {
    this.type = type;
    this.macAddr = null;
    this.ipConfig = null
  }
  
  setIpConfig(conf: Ipv4Config) {
    this.ipConfig = conf;
  }
  
  toString():string {
    return JSON.stringify(this)
  }
  
  static fromString(data: string) {
    const payloadData = JSON.parse(data)
    const payload = new DHCPMsg(payloadData.type)
    payload.macAddr = payloadData.macAddr
    payload.ipConfig = payloadData.ipConfig
    return payload
  }
}

type dhcpConfig = { first: string; last: string; snm: string; gw: string; dns: string; }

export class DHCPClient {
  node: Host
  state: ServiceState

  constructor(node: Host) {
    this.node = node
    this.state = ServiceState.idle
  }

  getAssociatedProtocol(): Protocol {
    return Protocol.DHCPClient
  };

  getState(): ServiceState {
    return this.state
  }

  sendDHCPDiscover() {
    TM.log(`DHCP: ${this.node.name} send ${DHCP_DISCOVER.toString()}`)
    // Send Broadcast to discover DHCP Server.
    const SOURCE_IP = "0.0.0.0"
    const TARGET_IP = "255.255.255.255"  // Broadcast
    const payload = new DHCPMsg(DHCPMsgType.DISCOVER)
    payload.macAddr = this.node.getDefaultIface().getMacAddr()
    const packet = new IpPacket(SOURCE_IP, TARGET_IP, Protocol.DHCPServer, payload.toString())
    this.node.ipHandler.sendPacket(packet)
    this.state = ServiceState.pending
  }

  sendDHCPRequest(to: IPv4Addr) {
    //TM.log(`DHCP: ${this.owner.name} send ${DHCP_REQUEST.toString()}`)
  }

  handleIpPacket(packet: IpPacket) {
    const payload = DHCPMsg.fromString(packet.payload)
    // handle offer
    if ( payload.type = DHCPMsgType.OFFER) {
      // check mac Addr
      const iface = this.node.getIfaceByMacAddr(payload.macAddr)
      if (iface === undefined) return
      TM.log(`DHCP: ${this.node.name} receive ${DHCP_OFFER.toString()}`)
      iface.setConfig(payload.ipConfig)
      this.state = ServiceState.idle
    } else {
      TM.log(`DHCP: ${this.node.name} receive ${payload.type}`)
    }
  };
}

export class DHCPServer extends Service implements Storeable {
  node: Host
  state: ServiceState
  config: {
    first: IPv4Addr,
    last: IPv4Addr,
    snm: Subnetmask,
    gw: IPv4Addr,
    dns: IPv4Addr,
  }
  inUse: Array<IPv4Addr>
  
  constructor(node: Host) {
    super()
    this.node = node
    this.state = ServiceState.idle
    this.config = {
      first: "",
      last: "",
      snm: "",
      gw: "",
      dns: "",
    }
    this.inUse = []
  }

  receiveData (data: any) {
    if (this.isRunning()) {
      this.handleIpPacket(data);
    }
  };
  
  getAssociatedProtocol():Protocol {
    return Protocol.DHCPServer
  };

  getConfig(): dhcpConfig {
    return this.config
  }

  setConfig(conf: dhcpConfig ): void {
    this.config = conf
  }

  getState(): ServiceState {
    return this.state
  }

  sendDHCPOffer(discover: DHCPMsg) {
    TM.log(`DHCP: ${this.node.getName()} send ${DHCP_OFFER.toString()}`)
    // Send Broadcast to discover DHCP Server.
    const SOURCE_IP = this.node.getDefaultIface().getIpAddr()
    const TARGET_IP = "255.255.255.255"  // Broadcast
    const payload = new DHCPMsg(DHCPMsgType.OFFER)
    payload.macAddr = discover.macAddr
    payload.ipConfig = new Ipv4Config(this.getNextFreeIpAddr(), this.config.snm, this.config.gw, this.config.dns)
    const packet = new IpPacket(SOURCE_IP, TARGET_IP, Protocol.DHCPClient, payload.toString())

    const frame = new Frame(this.node.getDefaultIface().getMacAddr(),discover.macAddr, FrameType.IPv4,packet)
    this.node.maController.transmitFrame(frame)
  }

  handleIpPacket(packet: IpPacket) {
    const payload = DHCPMsg.fromString(packet.payload)
    // handle discover
    if ( payload.type === DHCPMsgType.DISCOVER) {
      TM.log(`DHCP: ${this.node.getName()} receive ${DHCP_DISCOVER.toString()}`)
      this.sendDHCPOffer(payload)
    } else {
      TM.log(`DHCP: ${this.node.getName()} receive ${payload.type}`)
    }
  };

  getNextFreeIpAddr() {
    // todo! this function is just a small workaround for testing. does not cover all cases.
    let next = this.config.first
    while (this.inUse.includes(next)) {
      const parts = next.trim().split('.')
      const nums = parts.map((numStr: string) => parseInt(numStr,10))
      nums[3]++;
      next = nums.join('.')

      if (next === this.config.last) {
        throw Error("no free ip adresses")
      }
    } 
      
    this.inUse.push(next)
    return next
  }

  save() : object {
    let data = {}
    data["running"] = this.running
    data["config"] = this.config
    data["used"] = this.inUse 
    return data
  }

  load(data: any) {
    this.config = data.config
    this.inUse = data.used
    //data.used.forEach((addr) => this.inUse.push(addr))
    this.running = data.running
  }
}