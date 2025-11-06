
import { GraphModel, ExecutionResults, GraphFile } from '../types';

const API_BASE = ''; // Assuming the API is served from the same origin

async function handleResponse<T,>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  return response.json();
}

export async function saveGraph(name: string, model: GraphModel): Promise<{ success: boolean; filename: string }> {
  const response = await fetch(`${API_BASE}/save_graph`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, model }),
  });
  return handleResponse(response);
}

export async function listGraphs(): Promise<GraphFile[]> {
  const response = await fetch(`${API_BASE}/list_graphs`);
  return handleResponse(response);
}

export async function loadGraph(name: string): Promise<{name: string, model: GraphModel}> {
  const response = await fetch(`${API_BASE}/load_graph?name=${encodeURIComponent(name)}`);
  return handleResponse(response);
}

export async function deleteGraph(name: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/delete_graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    return handleResponse(response);
}


export async function listImages(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/list_images`);
  return handleResponse(response);
}

export async function runGraph(model: GraphModel): Promise<ExecutionResults> {
  const response = await fetch(`${API_BASE}/run_graph`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  });
  return handleResponse(response);
}
