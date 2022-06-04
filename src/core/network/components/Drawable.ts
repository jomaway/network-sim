import { NodeType } from "./Node";

export type Position = { x: number, y: number }

export interface Drawable {
  color: string;
  shape: string;
  pos: Position;
}

export class NodeIcon implements Drawable {
  color: string;
  shape: string;
  icon: string;
  pos: Position;

  constructor(color:string, shape: string) {
    this.color = color
    this.shape = shape
    this.icon = null
    this.pos = { x:0, y:0 }
  }
}

export enum NodeColor {
  Server = "#e74c3c",
  Host = "#EF4444",
  Switch = "#65A30D",
  Router = "#14B8A6",
}

export enum LinkColor {
  idle = "#3498db",
  selected = "",
  active = "#e74c3c",
}