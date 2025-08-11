import os
from dotenv import load_dotenv

load_dotenv()
# from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.tools import TavilySearchResults


# Only set the environment variable if the API key exists
tavily_api_key = os.getenv("TAVILY_API_KEY")
if tavily_api_key:
    os.environ["TAVILY_API_KEY"] = tavily_api_key

def get_web_search_tool():
    
    # This tool is used to search content from the web.
    # Only return the tool if the API key is available
    
    if not tavily_api_key:
        print("Warning: TAVILY_API_KEY not found. Web search tool will not be available.")
        return None
    
    return TavilySearchResults(
            max_results=5,
            include_answer=True,
            include_raw_content=True,
            include_images=True,
            # search_depth="advanced",
            # include_domains = []
            # exclude_domains = []
        )