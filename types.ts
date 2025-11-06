
export type NodeType = 'math' | 'combine' | 'image_loader' | 'wave_multiplier' | 'generic';

export interface Port {
  name: string;
}

export interface Node {
  id: string;
  type: NodeType;
  title: string;
  x: number;
  y: number;
  params: { [key: string]: any };
  inputs: Port[];
  outputs: Port[];
}

export interface Connection {
  id: string;
  from: { node: string; port: string };
  to: { node: string; port: string };
}

export interface GraphModel {
  nodes: { [id: string]: Node };
  connections: Connection[];
}

export interface ExecutionResult {
  value: any;
  type: 'number' | 'string' | 'image' | 'error' | 'auto' | 'noop';
  meta?: any;
}

export interface ExecutionResults {
  ok: boolean;
  results: { [nodeId: string]: ExecutionResult };
  log: string[];
}

export interface GraphFile {
    name: string;
    mtime: number;
}
