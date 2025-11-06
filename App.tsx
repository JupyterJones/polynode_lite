
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Stage } from './components/Stage';
import {
  GraphModel,
  Node,
  ExecutionResults,
  GraphFile,
  NodeType,
  Connection,
  Port,
} from './types';
import * as api from './services/apiService';

const App: React.FC = () => {
  const [model, setModel] = useState<GraphModel>({ nodes: {}, connections: [] });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<ExecutionResults | null>(null);
  const [savedGraphs, setSavedGraphs] = useState<GraphFile[]>([]);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStartPort, setConnectionStartPort] = useState<{ nodeId: string; port: Port } | null>(null);

  const selectedNode = selectedNodeId ? model.nodes[selectedNodeId] : null;

  const updateGraphsList = useCallback(async () => {
    try {
      const graphs = await api.listGraphs();
      setSavedGraphs(graphs);
    } catch (error) {
      console.error('Failed to load graphs list:', error);
      alert('Failed to load graphs list.');
    }
  }, []);

  const updateImagesList = useCallback(async () => {
    try {
      const images = await api.listImages();
      setAvailableImages(images);
    } catch (error) {
      console.error('Failed to load images list:', error);
      alert('Failed to load images list.');
    }
  }, []);

  useEffect(() => {
    updateGraphsList();
    updateImagesList();
    // Load a default setup
    addNode('image_loader');
    addNode('math');
    addNode('combine');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addNode = (type: NodeType) => {
    const id = `n_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newNode: Node = {
      id,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}`,
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 200,
      params: {},
      inputs: [],
      outputs: [],
    };

    switch (type) {
      case 'math':
        newNode.inputs = [{ name: 'a' }, { name: 'b' }];
        newNode.outputs = [{ name: 'out' }];
        newNode.params = { a: '0', b: '0', op: 'add' };
        break;
      case 'combine':
        newNode.inputs = [{ name: 'in1' }, { name: 'in2' }];
        newNode.outputs = [{ name: 'out' }];
        newNode.params = { in1: '', in2: '' };
        break;
      case 'image_loader':
        newNode.outputs = [{ name: 'image' }];
        newNode.params = { filename: '' };
        break;
      case 'wave_multiplier':
        newNode.title = 'Wave Multiplier';
        newNode.inputs = [{ name: 'in_wave' }, { name: 'n_times' }];
        newNode.outputs = [{ name: 'out' }];
        newNode.params = { in_wave: '', n_times: '1' };
        break;
      default: // generic
        newNode.inputs = [{ name: 'in1' }];
        newNode.outputs = [{ name: 'out' }];
        newNode.params = { value: '' };
        break;
    }

    setModel(prev => ({
      ...prev,
      nodes: { ...prev.nodes, [id]: newNode },
    }));
    setSelectedNodeId(id);
  };
  
  const updateNode = (id: string, updates: Partial<Node>) => {
    setModel(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [id]: { ...prev.nodes[id], ...updates },
      },
    }));
  };
  
  const updateNodeParam = (nodeId: string, param: string, value: any) => {
    setModel(prev => {
        const node = prev.nodes[nodeId];
        if (!node) return prev;
        return {
            ...prev,
            nodes: {
                ...prev.nodes,
                [nodeId]: {
                    ...node,
                    params: {
                        ...node.params,
                        [param]: value
                    }
                }
            }
        };
    });
  };

  const removeNode = (id: string) => {
    setModel(prev => {
      const newNodes = { ...prev.nodes };
      delete newNodes[id];
      const newConnections = prev.connections.filter(c => c.from.node !== id && c.to.node !== id);
      return { nodes: newNodes, connections: newConnections };
    });
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
    }
  };

  const clearGraph = () => {
    setModel({ nodes: {}, connections: [] });
    setSelectedNodeId(null);
    setExecutionResults(null);
  };
  
  const runGraph = async () => {
    setIsLoading(true);
    setExecutionResults(null);
    try {
      const results = await api.runGraph(model);
      setExecutionResults(results);
    } catch (error) {
      console.error('Failed to run graph:', error);
      alert('Failed to run graph.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveGraph = async (name: string) => {
    if (!name.trim()) {
      alert('Please enter a name for the graph.');
      return;
    }
    setIsLoading(true);
    try {
      await api.saveGraph(name, model);
      await updateGraphsList();
      alert(`Graph '${name}' saved successfully.`);
    } catch (error) {
      console.error('Failed to save graph:', error);
      alert('Failed to save graph.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGraph = async (name: string) => {
    setIsLoading(true);
    try {
      const data = await api.loadGraph(name);
      setModel(data.model);
      setSelectedNodeId(null);
      setExecutionResults(null);
    } catch (error) {
      console.error('Failed to load graph:', error);
      alert('Failed to load graph.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteGraph = async (name: string) => {
    if (window.confirm(`Are you sure you want to delete '${name}'?`)) {
        setIsLoading(true);
        try {
            await api.deleteGraph(name);
            await updateGraphsList();
        } catch (error) {
            console.error('Failed to delete graph:', error);
            alert('Failed to delete graph.');
        } finally {
            setIsLoading(false);
        }
    }
  };

  const handlePortClick = (nodeId: string, port: Port, isInput: boolean) => {
    if (!isInput) { // Output port clicked, start connection
        setConnectionStartPort({ nodeId, port });
    } else { // Input port clicked
        if (connectionStartPort) { // Finish connection
            // Prevent connecting to self
            if (connectionStartPort.nodeId === nodeId) {
                setConnectionStartPort(null);
                return;
            }

            const newConnection: Connection = {
                id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                from: { node: connectionStartPort.nodeId, port: connectionStartPort.port.name },
                to: { node: nodeId, port: port.name }
            };

            setModel(prev => ({
                ...prev,
                // Remove any existing connection to this input port before adding the new one
                connections: [
                    ...prev.connections.filter(c => !(c.to.node === nodeId && c.to.port === port.name)),
                    newConnection
                ]
            }));
            setConnectionStartPort(null);
        }
    }
  };

  const removeConnection = (id: string) => {
    setModel(prev => ({
        ...prev,
        connections: prev.connections.filter(c => c.id !== id)
    }));
  };


  return (
    <div className="flex flex-col h-screen bg-[#071021]">
      <Header
        onAddNode={addNode}
        onRun={runGraph}
        onClear={clearGraph}
        onSave={saveGraph}
        isLoading={isLoading}
      />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 relative">
          <Stage
            model={model}
            selectedNodeId={selectedNodeId}
            onNodeMove={(id, x, y) => updateNode(id, { x, y })}
            onNodeSelect={setSelectedNodeId}
            connectionStartPort={connectionStartPort}
            setConnectionStartPort={setConnectionStartPort}
            onPortClick={handlePortClick}
            onRemoveConnection={removeConnection}
          />
        </main>
        <Sidebar
          selectedNode={selectedNode}
          executionResults={executionResults}
          savedGraphs={savedGraphs}
          availableImages={availableImages}
          onLoadGraph={loadGraph}
          onDeleteGraph={deleteGraph}
          onUpdateGraphs={updateGraphsList}
          onUpdateImages={updateImagesList}
          onUpdateNodeParam={updateNodeParam}
          onRemoveNode={removeNode}
          onNodeTitleChange={(id, title) => updateNode(id, { title })}
        />
      </div>
    </div>
  );
};

export default App;
