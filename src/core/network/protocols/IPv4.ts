import { SID } from "../services/Services";
import { IPv4, IPv4Mask } from "ip-num/IPNumber"

//export { IPv4 as IPv4Addr, IPv4Mask as Subnetmask } from "ip-num/IPNumber"

export type IPv4Addr = string;
export type Subnetmask = string;

export class Packet {
  src: IPv4Addr;
  dst: IPv4Addr;
  sID: SID;
  payload: string;

  constructor(from: IPv4Addr, to: IPv4Addr, sID: SID ,msg: string) {
    this.src = from;
    this.dst = to;
    this.sID = sID;
    this.payload = msg; 
  }
}

class Address {
  parts: number[]

  constructor() {
    this.parts = [0,0,0,0]
  }

  toString() {
    return `${this.parts[0]}.${this.parts[1]}.${this.parts[2]}.${this.parts[3]}`
  }

  static fromString(addrStr: string) {
    const addr = new Address()
    const partsStr = addrStr.trim().split('.')
    if(partsStr.length !== 4) throw Error("No valid ip addr")
    for (let index = 0; index < partsStr.length; index++) {
      const part = parseInt(partsStr[index])
      if (part < 0 || part > 255 ) throw Error("No valid ip addr. Value is out of bound.")
      addr.parts[index] = parseInt(partsStr[index])  
    }
    return addr
  }

  static isValid(addr: Address) {
    // length check
    if(addr.parts.length !== 4) return false
    // bound check
    addr.parts.forEach((part) => {
      if (part < 0 || part > 255 ) return false
    })
    return true 
  }

  calcNetID(snm: Subnetmask){
    // todo!
    console.error("Not implemented!");
  }

  isSameNetworkAs(addr: Address) {
    console.warn("Not implemented always true");
    return true
  }
}