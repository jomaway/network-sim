import { Frame } from "../protocols/Ethernet"
import { MediaAccessControll } from "../protocols/networkStack"
import { Link } from "./Link"
import { Node } from "./NetworkComponents"

export class Port {
  link: Link
  node: Node
  maController: MediaAccessControll
  
  constructor(node: Node) {
    this.node = node;
    this.maController = node.getMediaAccessControll()
    this.link = null
  }

  hookUpMAC(maController: MediaAccessControll) {
    this.maController = maController;
  }

  connect(link: Link) {
    this.link = link
  }

  disconnect() {
    this.link = null
  }

  isConnected() {
    return (this.link !== null)
  }

  tx(frame: Frame) {
    if (this.isConnected()) {
      this.link.transfer(this, frame)
    } else {
      // todo!() think about how this should be handled
      throw new Error(`${this}: No link connected`)
    }
  }

  rx(frame: Frame) {
    this.maController?.receiveFrame(this, frame)
  }

}