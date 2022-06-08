import { AddressableNode } from "../components/AddressableNode";
import { TransportLayer } from "./networkStack";

export class TcpSegment {
  
}

export class TCPHandler implements TransportLayer {
  node: AddressableNode;

  constructor(node: AddressableNode) {
    this.node = node;
  }

  receiveSegment(segment: TcpSegment) {
    throw new Error("not implemted");
  };

  sendSegment(segment: TcpSegment) {
    throw new Error("not implemted");
  };
}