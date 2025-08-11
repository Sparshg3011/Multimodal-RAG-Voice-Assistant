# from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from app.services import vector_store
from app.tools import web_search
from langchain_core.messages import HumanMessage
from app.core.config import settings

from app.agent.state import AgentState
import os 
from dotenv import load_dotenv


load_dotenv()

# Only set environment variables if they exist
google_api_key = os.getenv("GOOGLE_API_KEY")
if google_api_key:
    os.environ["GOOGLE_API_KEY"] = google_api_key

# Model configuration
gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")  # Default fallback

# Text chat models (with temperature settings)
llm_gemini = ChatGoogleGenerativeAI(model=gemini_model, temperature=0)
# llm_groq = ChatGroq(model=os.getenv("GROQ_MODEL"), temperature=0)

llm_gemini_rag = ChatGoogleGenerativeAI(
    model=gemini_model,
    temperature=0.7,
    convert_system_message_to_human=True  # Important for Gemini
)


def route_to_llm(state: AgentState) -> str:
    """According to the prompt decide which LLm to use"""
    lastmessage = state["messages"][-1].content
    
    if "creative" in lastmessage.lower() or "write" in lastmessage.lower():
        return "gemini"
    
    if "code" in lastmessage.lower() or "python" in lastmessage.lower():
        return "groq"
    
    return "ginini"



# def generate_gemini(state: AgentState):
#     """Node to call Gimini."""
#     human_messages = [msg for msg in state["messages"] if isinstance(msg, HumanMessage)] 
#     response = llm_gemini.invoke(human_messages)
#     return {"messages": [response]}

def generate_gemini(state: AgentState):
    last_msg = state["messages"][-1].content.strip()

    if not last_msg:
        raise ValueError("Last message content is empty — cannot invoke Gemini.")

    # Ensure proper format: list of message objects
    messages = [HumanMessage(content=last_msg)]
    
    response = llm_gemini.invoke(messages)
    return {"messages": [response]}

# def generate_groq(state: AgentState):
#     """Node to call Groq."""
#     response = llm_groq.invoke(state["messages"])
#     return {"messages": [response]}


# ---- similar for other model






# def check_for_rag(state: AgentState):
#     """Decides which tool to use, if any."""
#     last_message = state["messages"][-1].content.lower()
    
#     # Priority 1: Check for explicit RAG flag
#     if state.get("use_rag", False):
#         print("---ROUTING: RAG---")
#         return "rag_retrieval"
    
#     # Priority 2: Check for keywords implying web search
#     search_keywords = ["latest", "what is the current", "search for", "tavily"]
#     if any(keyword in last_message for keyword in search_keywords):
#         print("---ROUTING: Web Search---")
#         return "web_search"
    
#     # Default: No tool needed, go to the LLM router
#     print("---ROUTING: Direct to LLM---")
#     return "__end__" # LangGraph convention for routing to another router

def check_for_rag(state: AgentState):
    """
    Checks the 'use_rag' flag passed from the frontend.
    This node acts as a router to decide the agent's path.
    Its string return value is used by the conditional edge router.
    """
    print(f"--- ROUTER: Checking for RAG. Flag is: {state.get('use_rag')} ---")
    if state.get("use_rag", False):
        # The string "rag_retrieval" will be used for routing.
        # The node itself returns an empty dictionary, as it doesn't modify state.
        return "rag_retrieval"
    else:
        # The string "generate_direct" will be used for routing.
        return "generate_direct"
    
    
    
def retrieve_from_rag(state: AgentState):
    """
    Retrieves relevant documents from the ChromaDB vector store,
    filtered by the session_id from the agent's state.
    """
    
    print("Retrieving context from RAG...")
    user_query = state["messages"][-1].content
    session_id = state.get("session_id")
    
    if not session_id:
        print("Warning: No session_id found in state for RAG retrieval.")
        return {"context": "Error: No session ID provided for document retrieval."}
    
    retriever = vector_store.get_retriever(session_id=session_id)
    
    retrieved_docs = retriever.invoke(user_query)
    
    context = "\n\n".join([doc.page_content for doc in retrieved_docs])
    
    print(f"Retrieved context for session {session_id}: {context[:300]}...")
    
    return {"context": context}

# def generate_direct(state: AgentState):
#     """Node to call the primary LLM directly without context."""
#     print("Generating direct response...")
#     # Using Gemini Pro as the default direct LLM
#     response = llm_gemini.invoke(state["messages"])
#     return {"messages": [response]}

def run_web_search(state: AgentState):
    """Node to perform web search."""
    search_tool = web_search.get_web_search_tool()
    
    if not search_tool:
        return {"context": "Web search is not available. Please provide a TAVILY_API_KEY in your environment variables."}
    
    try:
        search_results = search_tool.invoke({"query": state["messages"][-1].content})
        return {"context": search_results}
    except Exception as e:
        return {"context": f"Web search failed: {str(e)}"}

def generate_with_context(state: AgentState):
    """
    Generates a response using the LLM with the retrieved context.
    This is the final step in the RAG path.
    """
    print("--- NODE: Generating response with context ---")
    user_query = state["messages"][-1].content
    context = state.get("context", "")

    # Use the user-provided system prompt with RAG context
    user_system_prompt = state.get("system_prompt", "You are a helpful AI assistant.")
    
    prompt = f"""{user_system_prompt}

    Use the following document snippets as your primary source of knowledge to answer the user's question. The snippets are from a document the user just uploaded.

    If the user's question is general, like "what is this document about?" or "summarize this file", provide a concise summary of the provided context.

    If the user asks a specific question, answer it directly using only the information in the snippets.

    If the snippets do not contain the answer to a specific question, state that the provided document doesn't seem to contain that information.

    DOCUMENT SNIPPETS:
    ---
    {context}
    ---

    USER'S QUESTION:
    "{user_query}"
    """
    # --------------------------

    # We replace the user's last message with this new, enriched prompt
    messages_for_llm = state["messages"][:-1] + [
        ( "user", prompt)
    ]

    response = llm_gemini.invoke(messages_for_llm)
    return {"messages": [response]}

def generate_direct(state: AgentState):
    """
    Generates a response using the LLM directly, without any RAG context.
    This is the standard chat path.
    """
    print("--- NODE: Generating direct response (no RAG) ---")
    
    # Get the user-provided system prompt
    user_system_prompt = state.get("system_prompt", "You are a helpful AI assistant.")
    
    # Create messages with system prompt
    messages_for_llm = [("system", user_system_prompt)] + [
        (msg.type if hasattr(msg, 'type') else "user", msg.content) 
        for msg in state["messages"]
    ]
    
    response = llm_gemini.invoke(messages_for_llm)
    return {"messages": [response]}


def agent_entry(state: AgentState):
    """A dummy entry point node that does nothing but start the graph."""
    print("--- AGENT ENTRY ---")
    return {} # It's a valid node because it returns a dictionary