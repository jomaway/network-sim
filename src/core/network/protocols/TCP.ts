import { AdressableNode } from "../components/AddressableNode";
import { TransportLayer } from "./networkStack";

export class TcpSegment {
  
}

export class TCPHandler implements TransportLayer {
  node: AdressableNode;

  constructor(node: AdressableNode) {
    this.node = node;
  }

  receiveSegment(segment: TcpSegment) {
    throw new Error("not implemted");
  };

  sendSegment(segment: TcpSegment) {
    throw new Error("not implemted");
  };
}