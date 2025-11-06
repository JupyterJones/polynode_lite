
# PolyNodes Lite (React + Flask)

PolyNodes Lite is a lightweight, node-based visual programming environment. It features a Python/Flask backend for graph execution and a modern React-based frontend for a dynamic user experience. This allows users to create, connect, and run computational graphs in their browser.

 <!-- Placeholder image -->

## Features

- **Visual Graph Editor**: Drag-and-drop nodes onto a canvas, and connect them to define data flow.
- **Real-time Execution**: Run the entire graph on the server with a single click.
- **Node Output Previews**: Select any node after a run to see its output directly in the sidebar, including image thumbnails.
- **Core Node Types**:
    - **Math**: Perform basic arithmetic operations (+, -, *, /).
    - **Combine**: Concatenate two string or number inputs.
    - **Image Loader**: Load images from the `./images` directory to use in the graph.
    - **Wave Multiplier**: Repeats a string input a specified number of times.
    - **Generic**: A basic node that outputs a static value.
- **Graph Management**: Save your graph layouts, load them later, and manage your list of saved graphs.
- **Extensible**: Easily add new custom node types with their own logic and UI.

---

## How to Run the Application

This project has two main parts: the Flask backend and the React frontend.

### Backend Setup (Python/Flask)

The backend server handles all the logic for graph execution, saving/loading, and file management.

1.  **Prerequisites**: Ensure you have Python 3 and `pip` installed.

2.  **Install Dependencies**:
    ```bash
    pip install flask flask-cors icecream pillow
    ```

3.  **Create Directories**: The application requires two directories in the same folder as your Python script.
    ```bash
    mkdir graphs
    mkdir images
    ```
    - `graphs/`: This is where your saved graph `.json` files will be stored.
    - `images/`: Place any `.jpg`, `.png`, etc., files you want to use with the `Image Loader` node here.

4.  **Run the Server**:
    ```bash
    # Assuming your python script is named app.py
    python app.py
    ```
    The server will start, typically on `http://127.0.0.1:5700`.

### Frontend (React)

The frontend is a self-contained React application. Simply open the `index.html` file in your browser, and it will connect to the backend API.

---

## How to Use the Interface

-   **Adding Nodes**: Use the "Add [Node Type]" buttons in the header to create new nodes. They will appear on the canvas.
-   **Moving Nodes**: Click and drag any node to reposition it on the canvas.
-   **Selecting a Node**: Click on a node to select it. Its details will appear in the right-hand sidebar.
-   **Editing Node Parameters**: When a node is selected, its parameters will appear in the "Parameters" section of the sidebar. You can change values, select operations, or choose image files directly from there.
-   **Connecting Nodes**: To create a connection, click on an **output port** (right side of a node) and then click on an **input port** (left side of another node).
-   **Deleting Connections**: Click on any connection line. A confirmation prompt will appear to delete it.
-   **Running the Graph**: Click the "Run" button in the header. The server will execute the graph. Once finished, you can select any node to see its computed output in the sidebar.
-   **Saving/Loading**: Use the input field and "Save" button in the header to save your current graph. Use the "Load" and "Del" buttons in the "Saved Graphs" list in the sidebar to manage your files.

---

## Developer Guide: Creating a New Node Type

Adding a new node is a two-part process involving backend logic and frontend UI integration. Let's create a new `string_reverser` node as an example.

### 1. Backend Logic (`app.py`)

First, define how the node computes its output. Open `app.py` and find the `execute_graph` function.

Add a new `elif` block for your node type inside the `while unresolved:` loop:

```python
# ... inside execute_graph function ...
                elif ntype == "string_reverser":
                    # 1. Define inputs
                    ok_in, v_in = get_input_value(nid, "input_str")
                    if not ok_in:
                        continue # Input not ready yet

                    # 2. Perform logic
                    try:
                        # Ensure input is a string and reverse it
                        in_str = str(v_in) if v_in is not None else ""
                        reversed_str = in_str[::-1]

                        # 3. Store the result
                        results[nid] = {"value": reversed_str, "type": "string", "meta": {"original_length": len(in_str)}}
                        log.append(f"{nid}: string_reverser -> {reversed_str}")

                    except Exception as e:
                        results[nid] = {"value": None, "type": "error", "meta": {"error": str(e)}}
                        log.append(f"{nid}: string_reverser error {e}")

                    # 4. Mark as resolved
                    unresolved.remove(nid)
                    progressed = True
# ...
```

### 2. Frontend Integration (React)

Now, teach the React UI about the new node.

1.  **`types.ts`**: Add the new type to the `NodeType` union.
    ```typescript
    export type NodeType = 'math' | 'combine' | 'image_loader' | 'wave_multiplier' | 'generic' | 'string_reverser';
    ```

2.  **`App.tsx`**: Define the node's default shape in the `addNode` function.
    ```typescript
    // ... inside addNode function ...
    switch (type) {
      // ... other cases
      case 'string_reverser':
        newNode.title = 'String Reverser';
        newNode.inputs = [{ name: 'input_str' }];
        newNode.outputs = [{ name: 'out' }];
        newNode.params = { input_str: 'hello' }; // Default value if not connected
        break;
      // ... default case
    }
    ```

3.  **`components/Header.tsx`**: Add a button to create the new node.
    ```tsx
    // ... inside Header component's return statement ...
    <div className="flex items-center gap-2">
        <NodeButton type="math" onClick={onAddNode} />
        {/* ... other buttons ... */}
        <NodeButton type="string_reverser" onClick={onAddNode} />
    </div>
    ```

4.  **`components/Sidebar.tsx`**: Add the UI for editing the node's parameters. Find the `NodeParamsEditor` component and add a new case.
    ```tsx
    // ... inside NodeParamsEditor component ...
    switch (node.type) {
        // ... other cases
        case 'string_reverser':
            return (
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-400">Default Input</label>
                    <input
                        type="text"
                        value={node.params.input_str ?? ''}
                        onChange={(e) => onUpdateNodeParam(node.id, 'input_str', e.target.value)}
                    />
                </div>
            );
        // ... default case
    }
    ```

5.  **(Optional) `components/NodeComponent.tsx`**: To show the parameters on the node itself (in read-only mode), add a case to the `NodeParams` component.
    ```tsx
     // ... inside NodeParams component ...
    switch (node.type) {
        // ... other cases
        case 'string_reverser':
            return <input type="text" data-role="input_str" value={node.params.input_str ?? ''} className="w-full nodrag" readOnly />;
    }
    ```

That's it! After restarting the backend and refreshing the frontend, you will have a fully functional new node type.

---
## Project Structure

-   `app.py`: The main Flask backend server file.
-   `graphs/`: Default directory for storing saved `.json` graph files.
-   `images/`: Default directory for images used by the `Image Loader` node.
-   `index.html`: The main entry point for the React frontend.
-   `index.tsx`: Mounts the React application.
-   `App.tsx`: The root React component, managing all application state.
-   `types.ts`: Contains all TypeScript type definitions for the project.
-   `services/apiService.ts`: Functions for communicating with the backend API.
-   `components/`: Directory containing all React components.
    -   `Header.tsx`: The top toolbar of the application.
    -   `Stage.tsx`: The main canvas where nodes are rendered and connections are drawn.
    -   `NodeComponent.tsx`: Renders a single node on the stage.
    -   `Sidebar.tsx`: The right-hand panel for displaying information and controls.
