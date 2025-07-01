

import  { useState } from "react";
const ChatBot = ({ userId }) => {

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

 const sendMessage = async () => {
  if (!input.trim()) return;

  const userMessage = { id: Date.now() + Math.random(), sender: "user", text: input };
  setMessages((prev) => [...prev, userMessage]);
  setInput("");

  try {
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, message: input }),
    });

    const data = await res.json();
    const botMessage = { id: Date.now() + Math.random(), sender: "bot", text: data.reply };
    setMessages((prev) => [...prev, botMessage]);
  } catch (err) {
    console.error("Error sending message:", err);
  }
};


  return (
    <div className="chatbot">
      <div className="chat-window">
        {messages.map((m) => (
          <div key={m.id} className={m.sender === "user" ? "user-msg" : "bot-msg"}>
            {m.text}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        placeholder="Ask me about your budget..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ChatBot;
