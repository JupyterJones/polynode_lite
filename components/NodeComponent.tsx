
import React, { useRef, MouseEvent as ReactMouseEvent } from 'react';
import { Node, Port } from '../types';

interface NodeProps {
  node: Node;
  isSelected: boolean;
  onMove: (id: string, x: number, y: number) => void;
  onSelect: (id:string) => void;
  onPortClick: (nodeId: string, port: Port, isInput: boolean) => void;
  isConnecting: boolean;
}

const getPortElementId = (nodeId: string, portName: string, isInput: boolean) =>
  `port-${nodeId}-${portName}-${isInput ? 'in' : 'out'}`;

const PortComponent: React.FC<{nodeId: string, port: Port, isInput: boolean, onClick: () => void, isConnecting: boolean}> = ({nodeId, port, isInput, onClick, isConnecting}) => {
    const portClass = isInput
        ? "bg-purple-400 float-left -ml-5"
        : "bg-blue-400 float-right -mr-5";
    const hoverClass = isConnecting && isInput ? "ring-2 ring-purple-300" : isConnecting && !isInput ? "" : "hover:ring-2 hover:ring-white";

    return (
        <div 
            id={getPortElementId(nodeId, port.name, isInput)}
            title={port.name}
            className={`w-3 h-3 rounded-full cursor-pointer absolute ${portClass} ${hoverClass} transition-all`}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
        />
    )
};

const NodeParams: React.FC<{node: Node}> = ({ node }) => {
    // A dummy onUpdateParam, as this component is not meant to be interactive in this design.
    // The main app component will handle state updates.
    // The user will see their changes reflected from the main state.

    switch (node.type) {
        case 'math':
            return (
                <div className="flex gap-1.5 items-center">
                    <input type="text" data-role="a" value={node.params.a ?? ''} className="w-16 nodrag" readOnly />
                    <select data-role="op" value={node.params.op ?? 'add'} className="nodrag">
                        <option value="add">+</option>
                        <option value="sub">-</option>
                        <option value="mul">*</option>
                        <option value="div">/</option>
                    </select>
                    <input type="text" data-role="b" value={node.params.b ?? ''} className="w-16 nodrag" readOnly />
                </div>
            );
        case 'combine':
             return (
                <div className="flex flex-col gap-1.5">
                    <input type="text" data-role="in1" placeholder="Input 1" value={node.params.in1 ?? ''} className="nodrag" readOnly />
                    <input type="text" data-role="in2" placeholder="Input 2" value={node.params.in2 ?? ''} className="nodrag" readOnly />
                </div>
            );
        case 'image_loader':
            return (
                // FIX: The `readOnly` attribute is not valid for select elements. Use `disabled` instead to make it non-interactive.
                <select data-role="filename" value={node.params.filename ?? ''} className="w-full nodrag" disabled>
                    <option value="">{node.params.filename || '-- no image --'}</option>
                </select>
            );
        case 'wave_multiplier':
            return (
                <div className="flex flex-col gap-1.5">
                    <input type="text" placeholder="wave" data-role="in_wave" value={node.params.in_wave ?? ''} className="nodrag" readOnly/>
                    <input type="text" placeholder="n" data-role="n_times" value={node.params.n_times ?? ''} className="nodrag" readOnly/>
                </div>
            );
        default: // generic
            return <input type="text" data-role="value" value={node.params.value ?? ''} className="w-full nodrag" readOnly />;
    }
}


export const NodeComponent: React.FC<NodeProps> = ({ node, isSelected, onMove, onSelect, onPortClick, isConnecting }) => {
    const dragRef = useRef({ x: 0, y: 0 });
    const nodeRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
  
    const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).classList.contains('nodrag') || (e.target as HTMLElement).closest('.nodrag')) {
            return;
        }
        e.stopPropagation();
        onSelect(node.id);
        isDragging.current = true;
        const stage = nodeRef.current?.parentElement;
        if (!stage) return;
        const stageRect = stage.getBoundingClientRect();

        dragRef.current = {
            x: e.clientX - stageRect.left - node.x,
            y: e.clientY - stageRect.top - node.y,
        };

        const onMouseMove = (me: MouseEvent) => {
            if (!isDragging.current || !stage) return;
            const newX = me.clientX - stageRect.left - dragRef.current.x;
            const newY = me.clientY - stageRect.top - dragRef.current.y;
            onMove(node.id, newX, newY);
        };
    
        const onMouseUp = () => {
            isDragging.current = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div
            ref={nodeRef}
            className={`node absolute w-64 min-h-[74px] bg-[#0a1220] rounded-lg shadow-2xl border cursor-grab select-none p-2 ${isSelected ? 'border-blue-400 ring-2 ring-blue-500/50' : 'border-gray-800'}`}
            style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
            onMouseDown={handleMouseDown}
        >
            <div className="font-bold text-sm text-blue-200 mb-2 truncate">{node.title}</div>
            
            <div className="relative py-2">
                {node.inputs.map((port, i) => (
                    <div key={port.name} className="relative h-6 flex items-center">
                        <PortComponent nodeId={node.id} port={port} isInput={true} onClick={() => onPortClick(node.id, port, true)} isConnecting={isConnecting}/>
                        <span className="text-xs text-gray-300 ml-2">{port.name}</span>
                    </div>
                ))}
            </div>

             <div className="relative py-2">
                {node.outputs.map((port, i) => (
                    <div key={port.name} className="relative h-6 flex items-center justify-end">
                        <span className="text-xs text-gray-300 mr-2">{port.name}</span>
                        <PortComponent nodeId={node.id} port={port} isInput={false} onClick={() => onPortClick(node.id, port, false)} isConnecting={isConnecting} />
                    </div>
                ))}
            </div>
            
            {Object.keys(node.params).length > 0 &&
                <div className="params mt-2 p-2 bg-gray-900/50 rounded-md text-xs text-gray-200">
                    <style>{`
                        .node .params input, .node .params select {
                            background: #071022; color: #e6eef8; border: 1px solid rgba(255,255,255,0.1);
                            padding: 4px 6px; border-radius: 4px; font-size: 11px;
                        }
                    `}</style>
                    <NodeParams node={node} />
                </div>
            }
        </div>
    );
};
