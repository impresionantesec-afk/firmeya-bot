import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { FIRMEYA_PROMPT } from './prompt.js';
import { getHistory, addMessage } from './conversations.js';
import { sendMessage, extractMessage, reenviarImagen, reenviarDocumento } from './whatsapp.js';

const app = express();
app.use(express.json());

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Verificación del webhook ──────────────────────────────
app.get('/webhook', (req, res) => {
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verificado');
    res.send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ── Recibe mensajes de WhatsApp ───────────────────────────
// ── Recibe mensajes de WhatsApp ───────────────────────────
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  const msg = extractMessage(req.body);
  if (!msg) return;

// Reenvía imágenes y documentos al asesor
  if (msg.type !== 'text') {
    const NUMERO_ASESOR = '593996025273';
    
    // Primero envía el aviso con el número del cliente
    await sendMessage(
      NUMERO_ASESOR,
      `📨 *Documento de cliente +${msg.from}*:`
    );

    // Luego reenvía el archivo según su tipo
    if (msg.type === 'image') {
      await reenviarImagen(NUMERO_ASESOR, msg.imageId);
    } else if (msg.type === 'document') {
      await reenviarDocumento(NUMERO_ASESOR, msg.documentId, msg.documentName);
    }
    return;
  }

  if (!msg.text) return;

  console.log(`📩 [${msg.from}]: ${msg.text}`);

  try {
    const reply = await askClaude(msg.from, msg.text);
    await sendMessage(msg.from, reply);
    console.log(`📤 Valeria → ${msg.from}: ${reply}`);
  } catch (err) {
    console.error('Error completo:', JSON.stringify(err.response?.data || err.message));
    await sendMessage(
      msg.from,
      'Disculpa, tuve un problema técnico. Escríbenos directamente al +593 99 602 5273 🙏'
    );
  }
});

// ── Claude con memoria ────────────────────────────────────
async function askClaude(userId, userText) {
  addMessage(userId, 'user', userText);

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 350,
    system: FIRMEYA_PROMPT,
    messages: getHistory(userId),
  });

  const reply = response.content[0].text;
  addMessage(userId, 'assistant', reply);
  return reply;
}

app.listen(process.env.PORT, () => {
  console.log(`🚀 Firmeya Bot corriendo en puerto ${process.env.PORT}`);
});