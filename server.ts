import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// System Instruction for SMN Developers Real Estate AI Advisor
const SYSTEM_INSTRUCTION = `You are SMN AI, the Senior Private Real Estate Concierge for SMN Developers — India's premier luxury real estate developer and portfolio manager featuring landmark estates, oceanfront penthouses, golf course villas, and private architectural sanctuaries in Mumbai, Delhi NCR, Goa, Hyderabad, Bengaluru, and Alibaug.

Your persona is refined, articulate, discreet, knowledgeable, and polite, reminiscent of a top-tier private client advisor at Sotheby's Realty India or Knight Frank India.

Key Knowledge Base:
- Properties in Catalog:
  1. The Imperial Crest Penthouse — Worli Sea Face, Mumbai (₹35 Cr) - 6 Beds, 8 Baths, 11,800 sq.ft. Triplex sky penthouse, private infinity pool facing Arabian Sea, 4 reserved basement bays, private elevator.
  2. The Ashoka Sovereign Lutyens Estate — Lutyens' Delhi (₹45 Cr) - 7 Beds, 9 Baths, 16,500 sq.ft. 1.2 Acres of Lutyens freehold land, diplomatic ballroom, indoor lap pool, high-security perimeter.
  3. Villa Sol de Assagao — Assagao Hill, North Goa (₹12.5 Cr) - 5 Beds, 6 Baths, 8,500 sq.ft. Modern Portuguese minimalist sanctuary, sunset ridge infinity pool, teakwood deck, organic tropical garden.
  4. The Golf Course Crest Sky Mansion — Golf Course Road, Gurgaon (₹18.5 Cr) - 5 Beds, 6 Baths, 9,200 sq.ft. Championship golf views, 24-ft double height glass living room, wine cellar, 4-car garage.
  5. The Jubilee Monarch Hillside Palace — Jubilee Hills, Hyderabad (₹22.5 Cr) - 6 Beds, 8 Baths, 14,000 sq.ft. Lakeview ridge, subterranean 6-car showcase garage, 4K Dolby cinema, waterfall pool.
  6. The Indiranagar Garden Mansion — Indiranagar, Bengaluru (₹14.5 Cr) - 5 Beds, 6 Baths, 8,800 sq.ft. Bioclimatic vertical garden, executive boardroom, solar microgrid, plunge pool.
  7. SMN Cyber One Flagship Block — BKC, Mumbai (₹42 Cr) - Grade-A commercial office tower block, 35,000 sq.ft, robotic parking, helipad.
  8. The Alibaug Coastal Estate — Mandwa / Awas Beach (₹16 Cr) - 4-Acre oceanfront estate, private boat jetty, 20-min speedboat to Gateway of India.

- Services Provided:
  - Private Chauffeur Site Visits & Helicopter Aerial Inspections
  - RERA Compliance & 100% Freehold Title Audit Verification
  - 24/7 Direct Family Office Concierge via WhatsApp (+91 98200 11000)
  - Bespoke Architectural Customization & Asset Management

When visitors ask questions:
- Provide concise, luxurious, and helpful answers.
- Highlight relevant property specs, location details, or price in ₹ Cr.
- Invite them to schedule a Private Chauffeur Site Visit or message our WhatsApp Concierge (+91 98200 11000) when appropriate.
- Keep responses clean, elegant, and well-formatted with markdown bullet points if listing options.`;

// API endpoint for AI Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, prompt } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        text: "I am your Private Real Estate Concierge for SMN Developers India. I am delighted to assist you with exploring our ultra-luxury residences, site visits, or RERA title audits."
      });
    }

    // Format conversation history
    let contents = prompt;
    if (messages && Array.isArray(messages) && messages.length > 0) {
      const formattedHistory = messages.map((m: { role: string; content: string }) => {
        return `${m.role === 'user' ? 'User' : 'Aurelia'}: ${m.content}`;
      }).join('\n');
      contents = `Conversation history:\n${formattedHistory}\n\nUser's latest message: ${prompt}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I am at your service. How may I assist you with your luxury estate requirements?";

    res.json({ text: replyText });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: 'Unable to connect to AI Concierge',
      details: error.message || String(error),
      text: "I apologize for the momentary delay. Our private advisory servers are processing your request. Please feel free to reach out directly via WhatsApp or phone, or ask another question."
    });
  }
});

// Vite middleware for dev / static serving for prod
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
