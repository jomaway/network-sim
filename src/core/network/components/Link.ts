import { NodeID } from './Node'
import { Frame } from '../protocols/Ethernet'
import TM, { TrafficEvent, TrafficManager } from '../TrafficManager';
import { Connector } from './Connector';
import { Port } from './Port';

export type LinkID = string;

export class Link {
  id: string
  p1: Port
  p2: Port
  tm: TrafficManager
  active: boolean
  lastFrame: Frame

  constructor(id: LinkID, p1: Port, p2: Port) {
    this.id = id;
    this.p1 = p1;
    this.p2 = p2;
    this.connect()
    this.active = false
    this.lastFrame = null
  }



  connect() {
    // Connect Link to Connectors
    // todo! check if already connected
    this.p1.connect(this)
    this.p2.connect(this)
  }

  disconnect() {
    this.p1.disconnect()
    this.p2.disconnect()
  }

  swap() {
    const tmp = this.p1 
    this.p1 = this.p2
    this.p2 = tmp
  }

  async transfer(orig: Port, frame: Frame) {
    //const dest = (orig === this.c1) ? this.c2 : this.c1;
    if (orig !== this.p1) {
      this.swap()
    }
    const dest = this.p2;
    this.active = true
    this.lastFrame = frame
    await TM.notify(TrafficEvent.LinkActive, this)
    dest.rx(frame)
    this.active=false
  }

  isActive() {
    this.active 
  }

}

