# Multimodal Live RAG Voice Chatbot

## 1. Overview

This project is a sophisticated, multimodal chatbot application featuring a React/TypeScript frontend and a Python/FastAPI backend. It is designed to provide a rich, interactive user experience by combining standard text chat, real-time voice conversations, and Retrieval-Augmented Generation (RAG) capabilities for both text and voice.

The agent's logic is orchestrated using **LangGraph**, allowing for flexible and stateful conversational flows. The system can answer general questions or query a session-specific knowledge base created from user-uploaded documents.

### Key Features

*   **Text-Based Chat:** A familiar, responsive chat interface for sending and receiving text messages.
*   **Document Q&A (RAG):** Users can upload documents (`.pdf`, `.docx`, `.txt`, etc.). The system parses these documents, stores them in a vector database (ChromaDB), and can answer questions based *only* on the content of those documents.
*   **Live Voice Chat:** A real-time, low-latency voice conversation feature. Users can speak to the assistant and receive spoken responses.
*   **Voice RAG:** The live voice chat can be toggled into RAG mode, allowing users to verbally ask questions about their uploaded documents.
*   **Multimodal Interaction:** Seamlessly switch between text, document uploads, and voice chat within the same user session.
*   **Session-Specific Context:** All interactions and uploaded documents are tied to a unique session ID, ensuring user data privacy and contextually relevant conversations.

---

## 2. Architecture

The application is a standard client-server monorepo.



### Frontend (`/client`)

*   **Framework:** React with Vite and TypeScript.
*   **UI Components:** Built using **shadcn/ui**, which provides accessible, themeable, and composable components on top of Radix UI and Tailwind CSS.
*   **State Management:** Component-level state is managed with React hooks (`useState`, `useRef`). There is no global state manager like Redux or Zustand, simplifying the logic into custom hooks.
*   **Core Logic Hooks:**
    *   `useChat`: Orchestrates the text-based chat, including sending messages and handling file uploads via REST API calls.
    *   `useLiveVoiceChat`: Manages the real-time WebSocket connection, audio recording (using the Web Audio API), and playback for the voice chat feature.
*   **API Communication:**
    *   **Axios:** Used for standard HTTP requests (chat messages, file uploads) to the FastAPI backend.
    *   **WebSockets:** Used for the bidirectional, real-time streaming of audio data for the live voice chat.

### Backend (`/server`)

*   **Framework:** FastAPI, providing a high-performance, asynchronous API.
*   **Agent Logic:** **LangGraph** is used to define and execute the conversational agent as a stateful graph. This allows for complex, conditional routing based on user input and state.
*   **LLM Integration:** Primarily uses **Google Gemini** models (`gemini-2.0-flash-exp` for voice, `gemini-1.5-flash-latest` for text) via the `langchain-google-genai` library. The architecture is modular to support other models like Groq or OpenAI.
*   **Vector Store (RAG):** **ChromaDB** is used as the persistent vector database. Document chunks are converted to embeddings using Google's `embedding-001` model.
*   **Chat History:** **Redis** is used for storing and retrieving conversational history for each session, leveraging `RedisChatMessageHistory`.
*   **Real-time Communication:**
    *   **WebSockets:** FastAPI handles WebSocket connections for the live voice chat.
    *   **Google Gemini Live API:** The backend acts as a proxy, forwarding audio streams from the client to Gemini's live API and streaming the generated audio response back to the client.

---

## 3. Getting Started

### Prerequisites

*   **Python 3.12+**
*   **Node.js 18+** and `npm`
*   **Redis** instance running.
*   **Docker** (Optional, for running local LLMs as shown in `server/test/docker-llm.py`).

### Backend Setup (`/server`)

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv .venv
    source .venv/bin/activate
    # On Windows: .venv\Scripts\activate
    ```

3.  **Install dependencies:**
    The project uses `uv` for faster package management, but `pip` works fine.
    ```bash
    # Using uv (recommended)
    pip install uv
    uv sync

    # Or using pip
    pip install -r requirements.txt
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the `/server` directory by copying the example:
    ```bash
    cp .env.example .env
    ```
    Now, edit the `.env` file and add your API keys:
    ```dotenv
    # server/.env
    GOOGLE_API_KEY="your-google-api-key"
    REDIS_URL="redis://localhost:6379"

    # Optional for web search tool
    TAVILY_API_KEY="your-tavily-api-key"
    ```

5.  **Run the backend server:**
    ```bash
    uvicorn app.main:app --reload
    ```
    The server will be running at `http://localhost:8000`.

### Frontend Setup (`/client`)

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    The React application will be available at `http://localhost:5173`. It is pre-configured to proxy API requests to the backend server.

---

## 4. Project Structure Deep Dive

The project is organized into two main parts: `client` and `server`.

### `client/`

*   `public/worklets/audio-processor.js`: A crucial **AudioWorklet** that runs in a separate thread in the browser. It captures raw audio from the microphone, converts it to 16-bit PCM format, and sends it back to the main thread for WebSocket transmission.
*   `src/api/client.ts`: A pre-configured `axios` instance for making HTTP requests to the backend.
*   `src/components/`: Contains all React components.
    *   `ui/`: Auto-generated, re-usable low-level components from **shadcn/ui**.
    *   `ChatLayout.tsx`: The main component that assembles the entire chat interface, including the header, message list, and input area. It manages the state for the RAG toggles.
    *   `ChatInput.tsx`: The input component for text, handling file uploads and the RAG mode toggle.
    *   `ChatMessage.tsx`: Renders a single message bubble, styled differently for 'user', 'assistant', and 'system' roles.
    *   `LiveChatModal.tsx`: The modal dialog for the live voice conversation, containing the microphone button, visualizers, and connection status logic.
    *   `MessageList.tsx`: Renders the list of messages and the "Thinking..." indicator.
*   `src/hooks/`: Contains the core frontend logic.
    *   `useChat.ts`: Manages the state and logic for text-based chat and file uploads.
    *   `useLiveVoiceChat.ts`: A powerful hook encapsulating all logic for the live voice chat feature, including WebSocket connection, audio recording/playback, and state management (`connecting`, `recording`, `speaking`, etc.).
*   `vite.config.ts`: Vite configuration, including the `/api` proxy to the backend.

### `server/`

*   `app/main.py`: The FastAPI application entry point. It sets up CORS middleware and includes the API routers.
*   `app/api/v1/endpoints/`: Defines the API routes.
    *   `chat.py`: Handles the `/chat` endpoint for text-based conversations. It receives the user's message and the `use_rag` flag.
    *   `upload.py`: Handles file uploads, saves the file temporarily, parses it, and adds the content to the vector store with the correct `session_id`.
    *   `live_chat.py`: Manages the WebSocket connection for real-time voice chat. It receives audio chunks from the client and streams audio responses from Gemini back.
*   `app/agent/`: The core of the AI's logic.
    *   `state.py`: Defines the `AgentState` TypedDict, which is the "memory" or state that is passed between nodes in the graph.
    *   `nodes.py`: Contains the individual functions (nodes) that perform specific actions, such as retrieving from RAG, generating a direct response, or calling a web search tool.
    *   `graph.py`: Constructs the `StateGraph`. It defines the nodes and the conditional edges that determine the flow of the conversation (e.g., if `use_rag` is true, go to the RAG node; otherwise, go to the direct generation node).
*   `app/core/`: Application configuration.
    *   `config.py`: Loads environment variables from the `.env` file using Pydantic's `BaseSettings`.
*   `app/services/`: Contains services that the agent nodes use.
    *   `document_parser.py`: Logic for parsing different file types (`.pdf`, `.docx`, etc.) into text chunks.
    *   `vector_store.py`: Abstraction for interacting with **ChromaDB**. It handles the embedding and storage of documents and, most importantly, provides a `get_retriever` function that filters by `session_id`.
*   `chroma_db/`: The directory where the persistent ChromaDB vector data is stored.

---

## 5. Core Functionality Walkthrough

### Text Chat with RAG

1.  **User toggles "Query Uploaded Files"**: In `ChatInput.tsx`, the `isRagEnabled` state is set to `true`.
2.  **User sends a message**: The `sendMessage` function in `useChat.ts` is called, passing `isRagEnabled: true`.
3.  **API Call**: An HTTP POST request is made to `/api/v1/chat` with the message, `session_id`, and `use_rag: true`.
4.  **Agent Execution**:
    *   The `agent_executer` in `chat.py` is invoked.
    *   The `agent_entry` node in `graph.py` is the entry point.
    *   The conditional edge router calls `check_for_rag` from `nodes.py`. Since `use_rag` is `true`, it returns the string `"rag_retrieval"`.
    *   The graph transitions to the `retrieve_from_rag` node. This node calls `vector_store.get_retriever(session_id)`, which creates a ChromaDB retriever filtered specifically for the user's session documents. It invokes the retriever and adds the retrieved context to the agent's state.
    *   The graph then transitions to the `generate_with_context` node. This node constructs a detailed prompt containing the user's question and the retrieved document snippets, then invokes the Gemini model.
    *   The response from the LLM is added to the state, and the graph execution ends.
5.  **Response to Frontend**: The final message content is sent back to the client and displayed in the UI.

### Live Voice Chat with RAG

1.  **User enables "Voice RAG"**: In `ChatLayout.tsx`, the `isVoiceRagEnabled` state is set to `true`.
2.  **User opens the Live Chat Modal**: The `useLiveVoiceChat` hook is initialized with `isRagEnabled: true` and the `session_id`.
3.  **WebSocket Connection**: The hook establishes a WebSocket connection to `/ws/v1/live-chat`. Upon connection, it sends an initial configuration message: `{"config": {"isRagEnabled": true, "sessionId": "..."}}`.
4.  **Backend Context Fetching**: The `live_chat.py` endpoint receives this config. Because `isRagEnabled` is true, it calls `get_rag_context_for_session(session_id)` to fetch *all* document chunks for that session from ChromaDB.
5.  **System Prompt Injection**: It then constructs a large system prompt containing all the document context and instructs the Gemini Live model to *only* use this information for its answers. This prompt is used to configure the Gemini Live session.
6.  **Real-time Streaming**:
    *   The user speaks into the microphone. The `audio-processor.js` worklet captures, processes, and forwards PCM audio data.
    *   `useLiveVoiceChat` sends these audio chunks over the WebSocket.
    *   The backend's `browser_to_gemini` task forwards these chunks directly to the Gemini Live API.
    *   Gemini processes the audio in real-time and streams back audio responses.
    *   The backend's `gemini_to_browser` task receives this audio, base64-encodes it, and sends it back to the client over the WebSocket.
    *   The `useLiveVoiceChat` hook receives the audio, decodes it, and plays it through the browser's speakers, creating a seamless conversational experience.

---

## 6. API Reference

### Text Chat

*   **Endpoint**: `POST /api/v1/chat`
*   **Request Body**:
    ```json
    {
      "session_id": "string",
      "message": "string",
      "use_rag": "boolean"
    }
    ```
*   **Response**:
    ```json
    {
      "response": "The assistant's generated text response."
    }
    ```

### File Upload

*   **Endpoint**: `POST /api/v1/upload`
*   **Request Body**: `multipart/form-data`
    *   `file`: The uploaded file.
    *   `session_id`: The user's session ID (string).
*   **Response**:
    ```json
    {
        "status": "success",
        "filename": "string",
        "chunks_added": "integer",
        "message": "string"
    }
    ```

### Live Voice Chat

*   **Endpoint**: `WS /ws/v1/live-chat`
*   **Protocol**:
    1.  **Client -> Server (on connect)**: A JSON string with initial configuration.
        ```json
        {
          "config": {
            "isRagEnabled": true,
            "sessionId": "your-session-id"
          }
        }
        ```
    2.  **Client -> Server (during conversation)**: A stream of JSON messages containing base64-encoded audio chunks.
        ```json
        {"audio_chunk": "base64-encoded-pcm-data"}
        ```
    3.  **Server -> Client (during conversation)**: A stream of JSON messages with the assistant's base64-encoded audio response.
        ```json
        {"audio_chunk": "base64-encoded-response-audio-data"}
        ```

---

## 7. Future Improvements

*   **Streaming for Text Chat**: Implement `astream_events` in the text chat endpoint for a token-by-token streaming effect, similar to ChatGPT.
*   **Error Handling and Resilience**: Add more robust error handling and retry mechanisms, especially for API calls and WebSocket connections.
*   **Multi-Model Routing**: Implement the `route_to_llm` logic in the LangGraph agent to dynamically select different models (Groq for code, Gemini for creative tasks) based on the user's prompt.
*   **User Authentication**: Add a proper user authentication layer to manage user-specific data and sessions more securely.
*   **UI Enhancements**: Add features like viewing/deleting uploaded files, displaying message sources for RAG responses, and providing user feedback mechanisms.
*   **Local LLM Integration**: Fully integrate the Docker Model Runner setup from `/server/test/docker-llm.py` as a selectable backend option.