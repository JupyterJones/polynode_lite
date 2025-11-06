import React, { useRef, useState, MouseEvent as ReactMouseEvent } from 'react';
// FIX: Import the `Node` type to be used for explicit typing.
import { GraphModel, Node, Port } from '../types';
import { NodeComponent } from './NodeComponent';

interface StageProps {
  model: GraphModel;
  selectedNodeId: string | null;
  onNodeMove: (id: string, x: number, y: number) => void;
  onNodeSelect: (id: string | null) => void;
  connectionStartPort: { nodeId: string; port: Port } | null;
  setConnectionStartPort: (port: { nodeId: string; port: Port } | null) => void;
  onPortClick: (nodeId: string, port: Port, isInput: boolean) => void;
  onRemoveConnection: (id: string) => void;
}

const getPortElementId = (nodeId: string, portName: string, isInput: boolean) =>
  `port-${nodeId}-${portName}-${isInput ? 'in' : 'out'}`;

const ConnectionCurve: React.FC<{ d: string, id: string, onRemove: (id: string) => void }> = ({ d, id, onRemove }) => {
    return (
        <g>
            <path d={d} stroke="rgba(96,165,250,0.8)" strokeWidth="3" fill="none" />
            <path d={d} stroke="transparent" strokeWidth="15" fill="none" className="cursor-pointer" onClick={() => onRemove(id)} />
        </g>
    );
};

export const Stage: React.FC<StageProps> = ({ 
    model, 
    selectedNodeId,
    onNodeMove,
    onNodeSelect,
    connectionStartPort,
    setConnectionStartPort,
    onPortClick,
    onRemoveConnection,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null);

  const getPortPosition = (nodeId: string, portName: string, isInput: boolean) => {
    const portEl = document.getElementById(getPortElementId(nodeId, portName, isInput));
    const stageEl = stageRef.current;
    if (!portEl || !stageEl) return null;
    
    const stageRect = stageEl.getBoundingClientRect();
    const portRect = portEl.getBoundingClientRect();
    
    return {
      x: portRect.left - stageRect.left + portRect.width / 2 + stageEl.scrollLeft,
      y: portRect.top - stageRect.top + portRect.height / 2 + stageEl.scrollTop,
    };
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (connectionStartPort) {
        const stageRect = stageRef.current!.getBoundingClientRect();
        setMousePosition({ 
            x: e.clientX - stageRect.left + stageRef.current!.scrollLeft,
            y: e.clientY - stageRect.top + stageRef.current!.scrollTop,
        });
    }
  };

  const handleMouseUp = () => {
    if (connectionStartPort) {
      setConnectionStartPort(null);
    }
  };
  
  const handleStageClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target === stageRef.current) {
        onNodeSelect(null);
    }
  }

  const renderConnections = () => {
    return model.connections.map(conn => {
      const startPos = getPortPosition(conn.from.node, conn.from.port, false);
      const endPos = getPortPosition(conn.to.node, conn.to.port, true);
      
      if (!startPos || !endPos) return null;

      const dx = Math.abs(endPos.x - startPos.x);
      const curvature = Math.max(40, dx * 0.5);
      const d = `M ${startPos.x} ${startPos.y} C ${startPos.x + curvature} ${startPos.y} ${endPos.x - curvature} ${endPos.y} ${endPos.x} ${endPos.y}`;

      return <ConnectionCurve key={conn.id} d={d} id={conn.id} onRemove={onRemoveConnection}/>;
    });
  };

  const renderPendingConnection = () => {
    if (!connectionStartPort || !mousePosition) return null;

    const startPos = getPortPosition(connectionStartPort.nodeId, connectionStartPort.port.name, false);
    if (!startPos) return null;

    const dx = Math.abs(mousePosition.x - startPos.x);
    const curvature = Math.max(40, dx * 0.5);
    const d = `M ${startPos.x} ${startPos.y} C ${startPos.x + curvature} ${startPos.y} ${mousePosition.x - curvature} ${mousePosition.y} ${mousePosition.x} ${mousePosition.y}`;
    
    return <path d={d} stroke="#a78bfa" strokeWidth="3" fill="none" strokeDasharray="5,5" />;
  };

  return (
    <div 
        ref={stageRef} 
        id="stage" 
        className="relative w-full h-full overflow-auto bg-gradient-to-br from-[#001021] to-[#000814]"
        onClick={handleStageClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
    >
      {/* FIX: Explicitly type the `node` parameter to fix a type inference issue with `Object.values`. */}
      {Object.values(model.nodes).map((node: Node) => (
        <NodeComponent
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          onMove={onNodeMove}
          onSelect={onNodeSelect}
          onPortClick={onPortClick}
          isConnecting={!!connectionStartPort}
        />
      ))}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ width: stageRef.current?.scrollWidth, height: stageRef.current?.scrollHeight }}
      >
        <g style={{ pointerEvents: 'auto' }}>
            {renderConnections()}
        </g>
        {renderPendingConnection()}
      </svg>
    </div>
  );
};