
const store = new Map(); 

module.exports = {
  get: (userId) => store.get(userId),
  set: (userId, history) => store.set(userId, history),
};
