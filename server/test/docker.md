Here’s a **step-by-step guide** to set up and run **LLMs locally using Docker Model Runner** using (Docker Desktop v4.40+):

---

## 🛠️ Prerequisites

* ✅ **Docker Desktop v4.40 or higher**
* ✅ Internet connection (to pull models)
* ✅ Basic CLI knowledge

---

## 🚀 Step-by-Step Setup Guide

### 🔹 1. **Install or Update Docker Desktop**

If you haven’t already:

🔗 Download: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

Make sure it's version **4.40 or later** to support Model Runner.

---

### 🔹 2. **Enable Model Runner (if not already enabled)**

Model Runner is usually **enabled by default**.

But to be sure, run this command in your terminal:

```bash
docker desktop enable model-runner
```

✅ To expose the API via TCP (to use in code):

```bash
docker desktop enable model-runner --tcp 12434
```

---

### 🔹 3. **Pull a Local LLM Model**

Example using a lightweight model:

```bash
docker model pull ai/smollm2:360M-Q4_K_M
```

👉 You can explore more models in the `ai/` namespace on Docker Hub:
🔗 [https://hub.docker.com/search?q=ai%2F\&type=model](https://hub.docker.com/search?q=ai%2F&type=model)

---

### 🔹 4. **Run the Model from CLI**

Test it by chatting with the model:

```bash
docker model run ai/smollm2:360M-Q4_K_M "Give me a fact about whales."
```

💬 The model will respond with a fact using native llama.cpp-based inference!

---

### 🔹 5. **Use from Your Code (Optional)**

You can use the Model Runner as a drop-in **OpenAI-compatible API**!

📍 Host endpoint:
`http://localhost:12434/engines/v1`

Example using **langchain-openai (Python)**:

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="http://localhost:12434/engines/v1",
    api_key="docker",
    model="ai/llama3.2"
)

response = llm.invoke("Tell me about india??")
print(response.content)
```

---

## 📌 Notes

* 🧠 Models are stored locally and cached in memory (5-min timeout).
* 📦 You **don’t need containers** — it runs natively on host.
* 🔁 You can switch models by changing the tag.

---

## ✅ You’re Ready!

You’ve now set up a fully local, OpenAI-compatible LLM experience on your Mac using Docker. Run it offline, embed it in your dev workflow, or build chat apps — without external APIs!

