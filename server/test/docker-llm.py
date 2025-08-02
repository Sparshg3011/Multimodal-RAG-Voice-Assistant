from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="http://localhost:12434/engines/v1",
    api_key="docker",
    model="ai/llama3.2"
)

response = llm.invoke("Tell me about india??")
print(response.content)