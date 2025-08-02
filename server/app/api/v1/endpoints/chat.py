from fastapi import APIRouter
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from app.agent.graph import create_agent_graph


agent_executer = create_agent_graph()

router = APIRouter()


class ChatRequest(BaseModel):
    session_id:str
    message:str
    use_rag: bool = False
    system_prompt: str = "You are a helpful and friendly AI assistant. Provide clear, accurate, and concise responses to user questions."
    

# @router.post("/chat")
# async def chat(request: ChatRequest):
    
#     # inputs = {"messages":HumanMessage(content=request.message)}

#     inputs = {"messages": [HumanMessage(content=request.message)]}
    
#     response = agent_executer.invoke(inputs)
    
    
#     return {"response": response["messages"][-1].content}

@router.post("/chat")
async def chat(request: ChatRequest):
    # Pass the use_rag flag into the agent's state
    config = {"configurable": {"session_id": request.session_id}}
    inputs = {
        "messages": [HumanMessage(content=request.message)],
        "use_rag": request.use_rag, # ADD this
        "session_id": request.session_id,
        "system_prompt": request.system_prompt # ADD the system prompt
    }
    
    try:
        # We will use stream for better UX later, but for now invoke works
        response_state = await agent_executer.ainvoke(inputs, config=config)
        last_message = response_state["messages"][-1]
        return {"response": last_message.content}
        
    except Exception as e:
        print(f"Error during agent execution: {e}")
        return {"response": "Sorry, an error occurred while processing your request."}


