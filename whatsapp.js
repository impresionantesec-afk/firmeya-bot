import axios from 'axios';

export async function sendMessage(to, text) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    },
    {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    }
  );
}

export function extractMessage(body) {
  const entry = body?.entry?.[0]?.changes?.[0]?.value;
  const message = entry?.messages?.[0];
  if (!message) return null;

  return {
    from: message.from,
    type: message.type,
    text: message.type === 'text' ? message.text.body : null,
    imageId: message.type === 'image' ? message.image?.id : null,
    documentId: message.type === 'document' ? message.document?.id : null,
    documentName: message.type === 'document' ? message.document?.filename : null,
  };
}
export async function reenviarImagen(to, imageId) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { id: imageId },
    },
    {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    }
  );
}

export async function reenviarDocumento(to, documentId, filename) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: { id: documentId, filename: filename || 'documento' },
    },
    {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    }
  );
}