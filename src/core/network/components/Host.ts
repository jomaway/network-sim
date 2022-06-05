import { Frame, MacAddr, MAC_BROADCAST_ADDR, FrameType } from "../protocols/Ethernet"
import { ArpHandler, Packet as ArpPacket} from "../protocols/ARP";
import {  Packet, Subnetmask, IPv4Addr } from "../protocols/IPv4"
import { Node, NodeID, NodeType } from "./Node"
import { NodeIcon } from "./Drawable"
import { Connector, ConnectorID, NIC } from "./Connector";
import { getUniqueMacAddr, isStoreable } from "../NetworkManager";
import { TrafficEvent } from "../TrafficManager";
import { Service, SID } from "../services/Services";
import { ICMPHandler } from "../services/ICMP";
import { Client as DHCPClient, Server as DHCPServer } from "../services/DHCP";
import { Adressable, IPv4Config } from "./Adressable";
import { Octet } from "ip-num";


export class Host extends Node implements Adressable {
  name: string;
  macConfig: Map<ConnectorID, MacAddr>
  ipConfig: Map<ConnectorID, IPv4Config>

  arpService: ArpHandler;
  tts: number; // tries to send
  services: Map<SID,Service>
  
  constructor(id:NodeID, name: string) {
    super(id);
    this.name = name;
    this.ipConfig = new Map()

    this.addNIC() // add one NIC

    this.arpService = new ArpHandler(this)
    this.tts = 0 

    // add Drawable
    this.drawable = new NodeIcon("#EF4444","circle")

    // register services
    this.services = new Map()
    this.registerService(new ICMPHandler(this))
    this.registerService(new DHCPClient(this))
  }

  /* ---------- Node Overwrites --------------- */

  addNIC(id?: string) {
    const mac = getUniqueMacAddr()
    const nID = id??`eth${this.connectors.length}`
    this.connectors.push(new NIC(mac, nID,this))
    //this.macConfig.set(nID,mac)
    this.ipConfig.set(nID, new IPv4Config())
  }

  /* ---------- Adressable interface  ----------*/

  getDefaultNIC(): NIC {
    return <NIC>this.connectors[0]
  }

  getNICByID(nID: ConnectorID): NIC {
    return <NIC>this.getConnectorByID(nID)
  }

  getMacAddr(cID?: ConnectorID): string {
    if (cID) return this.getNICByID(cID).getMacAddr()
    else return this.getDefaultNIC().getMacAddr()
  }

  /* ---------- IP Config  ---------- */

  getIpConfig(cID?: ConnectorID): IPv4Config {
    return this.ipConfig.get(cID?? this.getDefaultNIC().id)
  }

  setIpConfig(conf: IPv4Config, cID?:ConnectorID){
    this.ipConfig.set(cID?? this.getDefaultNIC().id, conf)
  }

  getCIDR(cID?: ConnectorID) {
    const ip = this.getIpConfig(cID).addr
    const cidr = this.getIpConfig(cID).snm.split('.').map((octet) => {
      const value = parseInt(octet)
      switch (value) {
        case 255: return 8
        case 254: return 7
        case 252: return 6
        case 248: return 5
        case 240: return 4
        case 224: return 3
        case 192: return 2
        case 128: return 1
        default: return 0
      }
    }).reduce<number>((a, b) => a + b, 0)
    
    return `${ip} /${cidr}`
     
  }
  getIpAddr(cID?: ConnectorID): IPv4Addr {
    return this.getIpConfig(cID).addr
  }

  getSubnetmask(cID?: ConnectorID): Subnetmask {
    return this.getIpConfig(cID).snm
  }

  getGateway(cID?: ConnectorID): IPv4Addr {
    return this.getIpConfig(cID).gw
  }

  getDns(cID?: ConnectorID): IPv4Addr {
    return this.getIpConfig(cID).dns
  }

  setIpAddr(addr: IPv4Addr, cID?:ConnectorID) {
    this.getIpConfig(cID).addr = addr;
  }

  setSubnetmask(snm: Subnetmask, cID?:ConnectorID) {
    this.getIpConfig(cID).snm = snm;
  }

  setGateway(gw: IPv4Addr, cID?:ConnectorID) {
    this.getIpConfig(cID).gw = gw;
  }

  setDns(dns: IPv4Addr, cID?:ConnectorID) {
    this.getIpConfig(cID).dns = dns;
  }

  /* ---------- Handle services  ----------*/

  registerService(service: Service) {
    // todo! warn if this service was already registerd.
    if (this.services.has(service.getServiceID())) console.warn("overwrite service ", service.getServiceID(),"on node", this.getNodeID());
    
    this.services.set(service.getServiceID(), service);
  }

  useService(sID: SID) {
    return this.services.get(sID);
  }

  hasService(sID: SID) {
    return this.services.has(sID)
  }

  /* ---------- Handle incomming traffic  ----------*/
  receive(orig: Connector, frame: Frame) {
    if (frame.type === FrameType.ARP) {
      // let arp handle the packet.
      if (frame.payload instanceof ArpPacket) this.arpService.handleArpPacket(frame.payload, {connector: orig, mac: this.getMacAddr(), ip: this.getIpAddr()})
    } else { // FrameType.IP
      if (frame.payload instanceof Packet ) this.handleIpPacket(frame.payload, orig.id)
    }
    // else frame will be droped!  
  };

  handleIpPacket(packet: Packet, orig: ConnectorID) {
    // forward to service 
    if (this.hasService(packet.sID)) {
      this.useService(packet.sID)?.handleIpPacket(packet)
    } else {
      this.tm?.log(`Unknown SID: ${packet.sID}`)
    }
  }

  /* ---------- Handle outgoing traffic  ----------*/

  /* wrapper for layer 2 ethernet transmit method */
  sendFrame(frame: Frame) {
    this.transmit(this.getDefaultNIC(), frame)
  }

  isIpBroadcast(addr){
    return addr === "255.255.255.255"
  }

  isSameNetwork(addr: IPv4Addr) : boolean {
    const snm = this.getSubnetmask().split('.').map((octet) => parseInt(octet))

    const ownNetwork = this.getIpAddr().split('.').map((octet, idx) => parseInt(octet) & snm[idx]).join('.')
    const otherNetwork = addr.split('.').map((octet, idx) => parseInt(octet) & snm[idx]).join('.')

    //console.log(ownNetwork, otherNetwork, ownNetwork === otherNetwork);
    
    return (ownNetwork === otherNetwork)
  }

  /* layer 3 ip send packet */
  async sendPacket(packet: Packet) {
    let dstIp = packet.dst
    // check if ip is in the same network
    if (!this.isSameNetwork(dstIp) && !this.isIpBroadcast(dstIp)) {
      this.tm?.log("Destination not in the same network")
      dstIp = this.getGateway()
    } 
    const dstMac = await this.arpService.resolve(dstIp, this.getDefaultNIC())
    if (!dstMac) {
      this.tm?.log(`Could not resolve the mac for ip ${dstIp} Packet will be droped`);
      return // drop packet
    }
    const frame = new Frame(this.getMacAddr(),dstMac,FrameType.IPv4,packet)
    this.sendFrame(frame)
  }

  sendMsg(msg: string, to: Host) {
    // create ip packet
    const packet = new Packet(this.getIpAddr(), to.getIpAddr(), SID.MSG, msg)
    this.sendPacket(packet)
  }

  notify(event: String) {
    console.log("notify", event);
  }

  /* ---------- Host methods  ----------*/

  getName(): string {
    return this.name
  }

  setName(name: string): void {
    this.name = name
  }

  getNodeType(): NodeType {
    return NodeType.Host
  }

  ping(dstIp: IPv4Addr) {
    const icmpService = this.useService(SID.ICMP) as ICMPHandler
    return icmpService.ping(dstIp);
  }

  getDynamicIpConfig() {
    this.useService(SID.DHCPClient).sendRequest()
  }

  

  /* ---------- Storage methods  ----------*/

  save() {
    let n = super.save()
      n["name"] = this.name
      //n["macAddr"] = this.macAddr
      n["ipConfig"] = Array.from(this.ipConfig, ([name, value]) => ({ name, value }))
      n["services"] = []
      this.services.forEach((service) => {
        const serviceData = {
          id: service.getServiceID(),
        }
        if (isStoreable(service)) serviceData["conf"] = service.save()

        n["services"].push(serviceData)

      })
      return n
  }

  load(data: any) {
    super.load(data)
    this.name = data.name
    data.ipConfig.forEach(iface => {
      this.ipConfig.set(iface.name, iface.value)
    });

    // set Connectors
    data.connectors.forEach((cID,idx) => {
      const c = new NIC(getUniqueMacAddr(),cID,this)
      this.connectors[idx] = c;
    })

    data.services.forEach((service: any) => {
      switch (service.id) {
        case SID.ICMP:
          break;
        case SID.DHCPClient:
          break;
        case SID.DHCPServer:
          const dhcp = new DHCPServer(this)
          dhcp.setConf(service.conf)
          this.registerService(dhcp)
          break;
        default:
          console.warn("unknown service ID", service.id);
          
          break;
      }
    })
    // todo! load services
  }
}



