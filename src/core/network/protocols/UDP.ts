import { AdressableNode } from "../components/AddressableNode";
import { TransportLayer } from "./networkStack";

export class UdpSegment {

}

export class UDPHandler implements TransportLayer {
  node: AdressableNode;

  constructor(node: AdressableNode) {
    this.node = node;
  }

  receiveSegment(segment: UdpSegment) {
    throw new Error("not implemted");
  };

  sendSegment(segment: UdpSegment) {
    throw new Error("not implemted");
  };
}