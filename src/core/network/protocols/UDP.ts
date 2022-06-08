import { AddressableNode } from "../components/AddressableNode";
import { TransportLayer } from "./networkStack";

export class UdpSegment {

}

export class UDPHandler implements TransportLayer {
  node: AddressableNode;

  constructor(node: AddressableNode) {
    this.node = node;
  }

  receiveSegment(segment: UdpSegment) {
    throw new Error("not implemted");
  };

  sendSegment(segment: UdpSegment) {
    throw new Error("not implemted");
  };
}