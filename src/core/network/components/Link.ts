import { NodeID } from './Node'
import { Frame } from '../protocols/Ethernet'
import TM, { TrafficEvent, TrafficManager } from '../TrafficManager';
import { Connector } from './Connector';

export type LinkID = string;

export class Link {
  id: string
  c1: Connector
  c2: Connector
  tm: TrafficManager
  active: boolean
  lastFrame: Frame

  constructor(id: LinkID, c1: Connector, c2: Connector) {
    this.id = id;
    this.c1 = c1;
    this.c2 = c2;
    this.connect()
    this.active = false
    this.lastFrame = null
  }



  connect() {
    // Connect Link to Connectors
    // todo! check if already connected
    this.c1.connect(this)
    this.c2.connect(this)
  }

  disconnect() {
    this.c1.disconnect()
    this.c2.disconnect()
  }

  swap() {
    const tmp = this.c1 
    this.c1 = this.c2
    this.c2 = tmp
  }

  async transfer(orig: Connector, frame: Frame) {
    //const dest = (orig === this.c1) ? this.c2 : this.c1;
    if (orig !== this.c1) {
      this.swap()
    }
    const dest = this.c2;
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

