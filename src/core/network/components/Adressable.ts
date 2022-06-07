import { MacAddr } from "../protocols/Ethernet";
import { IPv4Addr, Subnetmask } from "../protocols/IPv4";
import { Connector, ConnectorID } from "./Connector";


export interface Adressable {
  macConfig: Map<ConnectorID, MacAddr>
  ipConfig: Map<ConnectorID, IPv4Config>
  
  getMacAddr: (cID?: ConnectorID) => MacAddr;
  getIpAddr: (cID?: ConnectorID) => IPv4Addr;
  getSubnetmask: (cID?: ConnectorID) => Subnetmask;
  getGateway: (cID?: ConnectorID) => IPv4Addr;
  getDns: (cID?: ConnectorID) => IPv4Addr;
  getIpConfig: (cID?: ConnectorID) => IPv4Config;

  setIpAddr: (addr: IPv4Addr, cID?: ConnectorID) => void; 
  setSubnetmask: (snm: Subnetmask, cID?: ConnectorID) => void; 
  setGateway: (gw: IPv4Addr, cID?: ConnectorID) => void; 
  setDns: (dns: IPv4Addr, cID?: ConnectorID) => void;
  setIpConfig: (conf: IPv4Config, cID?: ConnectorID) => void;
}

export class IPv4Config {
  static: Boolean;
  addr: IPv4Addr;
  snm: Subnetmask;
  gw: IPv4Addr;
  dns: IPv4Addr;

  constructor() {
    this.static = true;
    this.addr = '';
    this.snm = '';
    this.gw = '';
    this.dns = '';
  }
}

export function isValidIp(value:string) {
  const parts = value.trim().split('.')
  if (parts.length !== 4) return false
  //const nums = parts.map((numStr: string) => parseInt(numStr,10))
  
  for (let i=0; i <4; i++) {
    const num = parseInt(parts[i])
    if (isNaN(num)) return false
    if (num < 0 || num > 255) return false
  }
  return true
}