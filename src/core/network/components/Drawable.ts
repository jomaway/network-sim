import { NodeType } from "./NetworkComponents";

export type Position = { x: number, y: number }

export interface Drawable {
  color: string;
  shape: string;
  size: number;
  pos: Position;
}

export class NodeIcon implements Drawable {
  color: string;
  shape: string;
  size: number;
  icon: string;
  pos: Position;

  constructor(color:string, shape: string, size: number = 26) {
    this.color = color
    this.shape = shape
    this.size = size
    this.icon = null
    this.pos = { x:0, y:0 }
  }
}

export enum NodeColor {
  Server = "#c83ce7",
  Host = "#EF4444",
  Switch = "#65A30D",
  Router = "#14B8A6",
  Cloud = "#25a0f3"
}

const colorMap = new Map() 

colorMap.set(NodeType.Host, NodeColor.Host)
colorMap.set(NodeType.Switch, NodeColor.Switch)
colorMap.set(NodeType.Router, NodeColor.Router)
colorMap.set(NodeType.Cloud, NodeColor.Cloud)


export enum LinkColor {
  idle = "#3498db",
  selected = "",
  active = "#e74c3c",
}