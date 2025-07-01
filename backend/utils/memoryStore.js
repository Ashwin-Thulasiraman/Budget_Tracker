// server/memoryStore.js
const store = new Map(); // Map<userId, messageHistory>

module.exports = {
  get: (userId) => store.get(userId),
  set: (userId, history) => store.set(userId, history),
};
