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

enum DHCPType {
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

class Payload {
  type: DHCPType
  macAddr: MacAddr
  ipConfig: Ipv4Config


  constructor(type: DHCPType) {
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
    const payload = new Payload(payloadData.type)
    payload.macAddr = payloadData.macAddr
    payload.ipConfig = payloadData.ipConfig
    return payload
  }
}

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
    const payload = new Payload(DHCPType.DISCOVER)
    payload.macAddr = this.node.getDefaultIface().getMacAddr()
    const packet = new IpPacket(SOURCE_IP, TARGET_IP, Protocol.DHCPServer, payload.toString())
    this.node.ipHandler.sendPacket(packet)
    this.state = ServiceState.pending
  }

  sendDHCPRequest(to: IPv4Addr) {
    //TM.log(`DHCP: ${this.owner.name} send ${DHCP_REQUEST.toString()}`)
  }

  handleIpPacket(packet: IpPacket) {
    const payload = Payload.fromString(packet.payload)
    // handle offer
    if ( payload.type = DHCPType.OFFER) {
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
  conf: {
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
    this.conf = {
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

  setConf(conf) {
    this.conf = conf
  }

  getState(): ServiceState {
    return this.state
  }

  sendDHCPOffer(discover: Payload) {
    TM.log(`DHCP: ${this.node.getName()} send ${DHCP_OFFER.toString()}`)
    // Send Broadcast to discover DHCP Server.
    const SOURCE_IP = this.node.getDefaultIface().getIpAddr()
    const TARGET_IP = "255.255.255.255"  // Broadcast
    const payload = new Payload(DHCPType.OFFER)
    payload.macAddr = discover.macAddr
    payload.ipConfig = this.getFreeIpConf()
    const packet = new IpPacket(SOURCE_IP, TARGET_IP, Protocol.DHCPClient, payload.toString())

    const frame = new Frame(this.node.getDefaultIface().getMacAddr(),discover.macAddr, FrameType.IPv4,packet)
    this.node.maController.transmitFrame(frame)
  }

  handleIpPacket(packet: IpPacket) {
    const payload = Payload.fromString(packet.payload)
    // handle discover
    if ( payload.type === DHCPType.DISCOVER) {
      TM.log(`DHCP: ${this.node.getName()} receive ${DHCP_DISCOVER.toString()}`)
      this.sendDHCPOffer(payload)
    } else {
      TM.log(`DHCP: ${this.node.getName()} receive ${payload.type}`)
    }
  };

  getFreeIpConf(): Ipv4Config {
    const config = new Ipv4Config(this.getNextFreeIpAddr(), this.conf.snm, this.conf.gw, this.conf.dns)
    return config
  }

  getNextFreeIpAddr() {
    // todo! this function is just a small workaround for testing. does not cover all cases.
    let next = this.conf.first
    while (this.inUse.includes(next)) {
      const parts = next.trim().split('.')
      const nums = parts.map((numStr: string) => parseInt(numStr,10))
      nums[3]++;
      next = nums.join('.')

      if (next === this.conf.last) {
        throw Error("no free ip adresses")
      }
    } 
      
    this.inUse.push(next)
    return next
  }

  save() : object {
    return this.conf
  }

  load(data: object) {
    this.setConf(data)
  }
}