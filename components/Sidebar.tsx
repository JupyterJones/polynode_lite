
import React from 'react';
import { Node, ExecutionResults, GraphFile } from '../types';

interface SidebarProps {
  selectedNode: Node | null;
  executionResults: ExecutionResults | null;
  savedGraphs: GraphFile[];
  availableImages: string[];
  onLoadGraph: (name: string) => void;
  onDeleteGraph: (name: string) => void;
  onUpdateGraphs: () => void;
  onUpdateImages: () => void;
  onUpdateNodeParam: (nodeId: string, param: string, value: any) => void;
  onRemoveNode: (id: string) => void;
  onNodeTitleChange: (id: string, title: string) => void;
}

const SidebarSection: React.FC<{ title: string, onRefresh?: () => void, children: React.ReactNode }> = ({ title, onRefresh, children }) => (
    <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-blue-200">{title}</h2>
            {onRefresh && (
                <button onClick={onRefresh} className="text-sm text-blue-400 hover:text-blue-300">
                    &#x21bb;
                </button>
            )}
        </div>
        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
            {children}
        </div>
    </div>
);

const NodeOutput: React.FC<{ result: ExecutionResults['results'][string] | undefined }> = ({ result }) => {
    if (!result) return <p className="text-gray-400 text-sm">Run the graph to see output.</p>;

    if (result.type === 'error') {
        return <p className="text-red-400 text-sm">Error: {result.meta?.error || 'Unknown error'}</p>;
    }

    if (result.type === 'image' && result.value?.thumb_b64) {
        return (
            <div>
                <p className="font-bold text-gray-200">{result.value.filename}</p>
                <img src={`data:image/png;base64,${result.value.thumb_b64}`} alt="Node output" className="mt-2 rounded-md max-w-full h-auto" />
                <p className="text-gray-400 text-xs mt-1">{result.value.width}x{result.value.height}</p>
            </div>
        );
    }
    
    return (
      <div>
        <p className="text-gray-400 text-xs uppercase font-semibold">{result.type}</p>
        <pre className="text-lg text-green-300 whitespace-pre-wrap break-words font-mono mt-1">{JSON.stringify(result.value, null, 2)}</pre>
      </div>
    );
};

// Component for Editing Node Parameters
const NodeParamsEditor: React.FC<{
    node: Node;
    availableImages: string[];
    onUpdateNodeParam: (nodeId: string, param: string, value: any) => void;
}> = ({ node, availableImages, onUpdateNodeParam }) => {
    
    // Common styles for form elements
    const inputStyle = "w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:outline-none";
    const labelStyle = "text-xs text-gray-400 mb-1 block";

    switch (node.type) {
        case 'math':
            return (
                <div className="flex gap-2 items-center">
                    <div>
                        <label className={labelStyle}>A</label>
                        <input type="text" value={node.params.a ?? ''} onChange={e => onUpdateNodeParam(node.id, 'a', e.target.value)} className={inputStyle} />
                    </div>
                    <div>
                        <label className={labelStyle}>Op</label>
                        <select value={node.params.op ?? 'add'} onChange={e => onUpdateNodeParam(node.id, 'op', e.target.value)} className={inputStyle}>
                            <option value="add">+</option>
                            <option value="sub">-</option>
                            <option value="mul">*</option>
                            <option value="div">/</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>B</label>
                        <input type="text" value={node.params.b ?? ''} onChange={e => onUpdateNodeParam(node.id, 'b', e.target.value)} className={inputStyle} />
                    </div>
                </div>
            );
        case 'combine':
            return (
                <div className="flex flex-col gap-2">
                    <div>
                        <label className={labelStyle}>Input 1</label>
                        <input type="text" placeholder="Input 1" value={node.params.in1 ?? ''} onChange={e => onUpdateNodeParam(node.id, 'in1', e.target.value)} className={inputStyle} />
                    </div>
                    <div>
                        <label className={labelStyle}>Input 2</label>
                        <input type="text" placeholder="Input 2" value={node.params.in2 ?? ''} onChange={e => onUpdateNodeParam(node.id, 'in2', e.target.value)} className={inputStyle} />
                    </div>
                </div>
            );
        case 'image_loader':
            return (
                <div>
                    <label className={labelStyle}>Filename</label>
                    <select value={node.params.filename ?? ''} onChange={e => onUpdateNodeParam(node.id, 'filename', e.target.value)} className={inputStyle}>
                        <option value="">-- select image --</option>
                        {availableImages.map(img => <option key={img} value={img}>{img}</option>)}
                    </select>
                </div>
            );
        case 'wave_multiplier':
            return (
                <div className="flex flex-col gap-2">
                    <div>
                        <label className={labelStyle}>Wave</label>
                        <input type="text" placeholder="wave" value={node.params.in_wave ?? ''} onChange={e => onUpdateNodeParam(node.id, 'in_wave', e.target.value)} className={inputStyle}/>
                    </div>
                     <div>
                        <label className={labelStyle}>N Times</label>
                        <input type="text" placeholder="n" value={node.params.n_times ?? ''} onChange={e => onUpdateNodeParam(node.id, 'n_times', e.target.value)} className={inputStyle}/>
                    </div>
                </div>
            );
        default: // generic
            return (
                 <div>
                    <label className={labelStyle}>Value</label>
                    <input type="text" value={node.params.value ?? ''} onChange={e => onUpdateNodeParam(node.id, 'value', e.target.value)} className={inputStyle} />
                </div>
            );
    }
}


export const Sidebar: React.FC<SidebarProps> = (props) => {
    const {
        selectedNode,
        executionResults,
        savedGraphs,
        availableImages,
        onLoadGraph,
        onDeleteGraph,
        onUpdateGraphs,
        onUpdateImages,
        onUpdateNodeParam,
        onRemoveNode,
        onNodeTitleChange
    } = props;
    
    const nodeResult = selectedNode && executionResults ? executionResults.results[selectedNode.id] : undefined;

    const handleTitleChange = () => {
      if (selectedNode) {
        const newTitle = prompt("Enter new node title:", selectedNode.title);
        if (newTitle !== null) {
          onNodeTitleChange(selectedNode.id, newTitle);
        }
      }
    };

    return (
        <aside className="w-80 bg-gradient-to-b from-[#071022] to-[#03101a] p-4 overflow-y-auto border-l border-gray-800 flex-shrink-0">
            {selectedNode ? (
                <SidebarSection title="Selected Node">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-white break-words">{selectedNode.title}</h3>
                            <p className="text-sm text-gray-400">{selectedNode.type}</p>
                        </div>
                        <div>
                            <button onClick={handleTitleChange} className="text-sm p-1 rounded hover:bg-gray-600" title="Rename Node">✎</button>
                            <button onClick={() => onRemoveNode(selectedNode.id)} className="text-sm p-1 rounded hover:bg-gray-600 text-red-400" title="Delete Node">✖</button>
                        </div>
                    </div>
                </SidebarSection>
            ) : (
                 <SidebarSection title="Selection">
                    <p className="text-gray-400 text-sm">No node selected.</p>
                </SidebarSection>
            )}

            {selectedNode && (
                 <SidebarSection title="Parameters">
                    <NodeParamsEditor 
                        node={selectedNode}
                        availableImages={availableImages}
                        onUpdateNodeParam={onUpdateNodeParam}
                    />
                </SidebarSection>
            )}

            {selectedNode && (
                <SidebarSection title="Node Output">
                    <NodeOutput result={nodeResult} />
                </SidebarSection>
            )}
            
            <SidebarSection title="Saved Graphs" onRefresh={onUpdateGraphs}>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {savedGraphs.length > 0 ? savedGraphs.map(g => (
                        <div key={g.name} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md">
                           <span className="text-sm truncate" title={g.name}>{g.name}</span>
                           <div className="flex gap-1">
                               <button onClick={() => onLoadGraph(g.name)} className="text-xs px-2 py-1 bg-blue-600 rounded hover:bg-blue-500">Load</button>
                               <button onClick={() => onDeleteGraph(g.name)} className="text-xs px-2 py-1 bg-red-600 rounded hover:bg-red-500">Del</button>
                           </div>
                        </div>
                    )) : <p className="text-gray-400 text-sm">No saved graphs.</p>}
                </div>
            </SidebarSection>

            <SidebarSection title="Available Images" onRefresh={onUpdateImages}>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                    {availableImages.length > 0 ? availableImages.map(img => (
                        <p key={img} className="text-sm text-gray-300 truncate" title={img}>{img}</p>
                    )) : <p className="text-gray-400 text-sm">No images in ./images folder.</p>}
                </div>
            </SidebarSection>
        </aside>
    );
};
