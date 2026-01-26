// =======================================
// AI-WIDGET.JS - Draggable AI Chat Widget
// =======================================

// Create widget container
const aiWidget = document.createElement("div");
aiWidget.id = "aiWidget";
aiWidget.style.position = "fixed";
aiWidget.style.bottom = "20px";
aiWidget.style.right = "20px";
aiWidget.style.width = "350px";
aiWidget.style.height = "450px";
aiWidget.style.backgroundColor = "var(--secondary)";
aiWidget.style.borderRadius = "12px";
aiWidget.style.boxShadow = "0 8px 24px var(--shadow-dark)";
aiWidget.style.display = "flex";
aiWidget.style.flexDirection = "column";
aiWidget.style.zIndex = "10000";
aiWidget.style.userSelect = "none";
aiWidget.style.transition = "transform 0.2s ease";

// Widget header (drag handle)
const header = document.createElement("div");
header.style.backgroundColor = "var(--primary)";
header.style.color = "white";
header.style.padding = "0.75rem 1rem";
header.style.cursor = "move";
header.style.fontWeight = "bold";
header.innerText = "AI Assistant";
aiWidget.appendChild(header);

// Message container
const chatContainer = document.createElement("div");
chatContainer.style.flex = "1";
chatContainer.style.overflowY = "auto";
chatContainer.style.padding = "1rem";
chatContainer.style.backgroundColor = "var(--bg)";
aiWidget.appendChild(chatContainer);

// Input container
const inputContainer = document.createElement("div");
inputContainer.style.display = "flex";
inputContainer.style.borderTop = "1px solid var(--border)";
const input = document.createElement("input");
input.type = "text";
input.placeholder = "Type your question...";
input.style.flex = "1";
input.style.padding = "0.75rem";
input.style.border = "none";
input.style.outline = "none";
input.style.backgroundColor = "var(--secondary)";
inputContainer.appendChild(input);

const sendBtn = document.createElement("button");
sendBtn.innerText = "Send";
sendBtn.className = "btn-primary";
sendBtn.style.marginLeft = "0.5rem";
sendBtn.style.padding = "0.5rem 1rem";
inputContainer.appendChild(sendBtn);
aiWidget.appendChild(inputContainer);

document.body.appendChild(aiWidget);

// ============================
// DRAG FUNCTIONALITY
// ============================
let isDragging = false;
let offsetX, offsetY;

header.addEventListener("mousedown", (e) => {
  isDragging = true;
  offsetX = e.clientX - aiWidget.getBoundingClientRect().left;
  offsetY = e.clientY - aiWidget.getBoundingClientRect().top;
  aiWidget.style.transition = "none";
});

document.addEventListener("mousemove", (e) => {
  if(isDragging) {
    aiWidget.style.left = `${e.clientX - offsetX}px`;
    aiWidget.style.top = `${e.clientY - offsetY}px`;
    aiWidget.style.bottom = "auto";
    aiWidget.style.right = "auto";
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  aiWidget.style.transition = "transform 0.2s ease";
});

// ============================
// AI CHAT FUNCTIONALITY
// ============================
sendBtn.addEventListener("click", async () => {
  const msg = input.value.trim();
  if(!msg) return;

  // Display user message
  const userMsg = document.createElement("div");
  userMsg.innerText = msg;
  userMsg.style.background = "var(--primary)";
  userMsg.style.color = "white";
  userMsg.style.padding = "0.5rem";
  userMsg.style.marginBottom = "0.5rem";
  userMsg.style.borderRadius = "8px";
  userMsg.style.alignSelf = "flex-end";
  chatContainer.appendChild(userMsg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  input.value = "";

  // Call AI Edge function
  try {
    const response = await fetch('/.netlify/functions/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const data = await response.json();

    const aiMsg = document.createElement("div");
    aiMsg.innerText = data.response || "No response";
    aiMsg.style.background = "var(--secondary)";
    aiMsg.style.color = "var(--fg)";
    aiMsg.style.padding = "0.5rem";
    aiMsg.style.marginBottom = "0.5rem";
    aiMsg.style.borderRadius = "8px";
    aiMsg.style.alignSelf = "flex-start";
    chatContainer.appendChild(aiMsg);
    chatContainer.scrollTop = chatContainer.scrollHeight;

  } catch(err) {
    showToast("AI assistant error", "error");
  }
});

// Optional: Press Enter to send
input.addEventListener("keydown", (e) => {
  if(e.key === "Enter") sendBtn.click();
});
