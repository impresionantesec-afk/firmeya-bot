const store = new Map();

export function getHistory(userId) {
  if (!store.has(userId)) {
    store.set(userId, { messages: [], createdAt: Date.now() });
  }
  return store.get(userId).messages;
}

export function addMessage(userId, role, content) {
  const history = getHistory(userId);
  history.push({ role, content });

  // Guarda solo los últimos 20 mensajes para controlar costos
  if (history.length > 20) history.splice(0, history.length - 20);
}

export function clearHistory(userId) {
  store.delete(userId);
}