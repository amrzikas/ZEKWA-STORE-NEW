import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Zewka AI Assistant
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format" });
      }

      // Convert format to Gemini API contents
      const formattedContents = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const systemInstruction = `
        You are ZEWKA Boutique's premium AI Shopping Consultant. ZEWKA is an ultra-luxurious curated boutique selling premium designer products:
        1. "معطف زيوكا الصوفي الفاخر" (ZEWKA Premium Wool Overcoat) - $289. 100% Merino wool, handmade seams, Italian.
        2. "حقيبة الكتف الجلدية الفاخرة" (ZEWKA Luxury Leather Shoulder Bag) - $189. Full-grain calfskin, gold-plated hardware, suede lined.
        3. "عطر نسيم زيوكا الخاص" (ZEWKA "Naseem" Signature Perfume) - $119. Rose, Sandalwood, Cardamom. Extrait de Parfum.
        4. "شمعة الصويا المهدئة للعلاج العطري" (ZEWKA Calming Aromatherapy Candle) - $45. Soy wax, lavender/cedarwood, handcrafted ceramic.
        5. "طقم أكواب السيراميك المصنوع يدويًا" (ZEWKA Handcrafted Ceramic Cup Set) - $59. Dual wabi-sabi cups, dual reactive glaze.
        6. "غلاف سماعات الأذن الجلدي الفاخر" (ZEWKA Leather Earbuds Case Cover) - $35. Italian veg-tanned leather, brass carabiner.
        7. "لبادة المكتب الفاخرة من صوف الميرينو" (ZEWKA Merino Wool Desk Mat) - $75. Felted wool & cork, 80x30cm.
        8. "قناع النوم الفاخر من حرير التوت الطبيعي" (ZEWKA Pure Mulberry Silk Sleep Mask) - $49. 100% grade 6A silk, absolute blackout.

        Your character:
        - Extremely polite, sophisticated, hospitable, and knowledgeable.
        - Speak like a high-end personal concierge.
        - Always respond in Arabic (or English if the customer writes in English).
        - Suggest matching pieces, recommend items for gifts, explain materials (Merino wool, calfskin, mulberry silk), and maintain premium status.
        - Keep answers concise, highly elegant, beautifully structured with markdown (using bullet points), and polite.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: error.message || "Failed to communicate with AI Assistant" });
    }
  });

  // API Route: AI Review Analyzer and Responder
  app.post("/api/analyze-review", async (req, res) => {
    try {
      const { comment, rating } = req.body;
      if (!comment) {
        return res.status(400).json({ error: "Comment is required" });
      }

      const prompt = `
        Analyze the following customer review for ZEWKA Boutique.
        Customer Rating: ${rating} / 5 stars.
        Review text: "${comment}"
      `;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2-3 short, highly positive customer feedback tags in Arabic (e.g. 'جودة ممتازة', 'تغليف فخم', 'توصيل سريع', 'رائحة ساحرة')"
          },
          merchantResponse: {
            type: Type.STRING,
            description: "An incredibly polite, elegant, and professional response in Arabic from 'إدارة بوتيك زيوكا' (ZEWKA Boutique Management) thanking the user and expressing premium care."
          }
        },
        required: ["tags", "merchantResponse"]
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the Customer Care Director of ZEWKA Boutique, a world-class luxury brand. Your job is to analyze reviews, tag key qualities in Arabic, and generate responses that sound incredibly welcoming, royal, and refined.",
          responseMimeType: "application/json",
          responseSchema,
        }
      });

      const result = JSON.parse(response.text || "{}");
      res.json(result);
    } catch (error: any) {
      console.error("Gemini Review Analyzer Error:", error);
      res.status(500).json({ error: "Failed to analyze review" });
    }
  });

  // Vite integration in development, static build files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ZEWKA Server running on http://localhost:${PORT}`);
  });
}

startServer();
