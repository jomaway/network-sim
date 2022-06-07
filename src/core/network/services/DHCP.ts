import { IPv4Config } from "../components/Adressable";
import { Host } from "../components/Host";
import { Storeable } from "../NetworkManager";
import { Frame, FrameType, MacAddr } from "../protocols/Ethernet";
import { IPv4Addr, Packet, Subnetmask } from "../protocols/IPv4";
import TM from "../TrafficManager";
import { Service, SID, ServiceState } from "./Services";

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

class Payload {
  type: DHCPType
  macAddr: MacAddr
  ipConfig: IPv4Config


  constructor(type: DHCPType) {
    this.type = type;
    this.macAddr = null;
    this.ipConfig = null
  }

  setIpConfig(conf: IPv4Config) {
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

export class Client implements Service {
  owner: Host
  state: ServiceState

  constructor(owner: Host) {
    this.owner = owner
    this.state = ServiceState.idle
  }

  getServiceID():SID {
    return SID.DHCPClient
  };

  getState(): ServiceState {
    return this.state
  }

  sendDHCPDiscover() {
    TM.log(`DHCP: ${this.owner.name} send ${DHCP_DISCOVER.toString()}`)
    // Send Broadcast to discover DHCP Server.
    const SOURCE_IP = "0.0.0.0"
    const TARGET_IP = "255.255.255.255"  // Broadcast
    const payload = new Payload(DHCPType.DISCOVER)
    payload.macAddr = this.owner.getMacAddr()
    const packet = new Packet(SOURCE_IP, TARGET_IP, SID.DHCPServer, payload.toString())
    this.owner.sendPacket(packet)
    this.state = ServiceState.pending
  }

  sendDHCPRequest(to: IPv4Addr) {
    //TM.log(`DHCP: ${this.owner.name} send ${DHCP_REQUEST.toString()}`)
  }

  sendRequest(args?: any) {
    // send
    this.sendDHCPDiscover()
  };

  handleIpPacket(packet: Packet) {
    const payload = Payload.fromString(packet.payload)
    // handle offer
    if ( payload.type = DHCPType.OFFER) {
      // check mac Addr
      if (this.owner.getMacAddr() !== payload.macAddr) return
      TM.log(`DHCP: ${this.owner.name} receive ${DHCP_OFFER.toString()}`)
      this.owner.setIpConfig(payload.ipConfig)
      this.state = ServiceState.idle
    } else {
      TM.log(`DHCP: ${this.owner.name} receive ${payload.type}`)
    }
  };
}

export class Server implements Service, Storeable {
  owner: Host
  state: ServiceState
  conf: {
    first: IPv4Addr,
    last: IPv4Addr,
    snm: Subnetmask,
    gw: IPv4Addr,
    dns: IPv4Addr,
  }
  inUse: Array<IPv4Addr>

  constructor(owner: Host) {
    this.owner = owner
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

  getServiceID():SID {
    return SID.DHCPServer
  };

  setConf(conf) {
    this.conf = conf
  }

  getState(): ServiceState {
    return this.state
  }

  sendDHCPOffer(discover: Payload) {
    TM.log(`DHCP: ${this.owner.name} send ${DHCP_OFFER.toString()}`)
    // Send Broadcast to discover DHCP Server.
    const SOURCE_IP = this.owner.getIpAddr()
    const TARGET_IP = "255.255.255.255"  // Broadcast
    const payload = new Payload(DHCPType.OFFER)
    payload.macAddr = discover.macAddr
    payload.ipConfig = this.getFreeIpConf()
    const packet = new Packet(SOURCE_IP, TARGET_IP, SID.DHCPClient, payload.toString())
    const frame = new Frame(this.owner.getMacAddr(),discover.macAddr, FrameType.IPv4,packet)
    this.owner.sendFrame(frame)
  }

  sendRequest(args?: any) {
    // do nothing. allways wait for discover
  };

  handleIpPacket(packet: Packet) {
    const payload = Payload.fromString(packet.payload)
    // handle discover
    if ( payload.type === DHCPType.DISCOVER) {
      TM.log(`DHCP: ${this.owner.name} receive ${DHCP_DISCOVER.toString()}`)
      this.sendDHCPOffer(payload)
    } else {
      TM.log(`DHCP: ${this.owner.name} receive ${payload.type}`)
    }
  };

  getFreeIpConf(): IPv4Config {
    const config = new IPv4Config()
    config.static = false;
    config.addr = this.getNextFreeIpAddr()
    config.snm = this.conf.snm
    config.gw = this.conf.gw
    config.dns = this.conf.dns
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