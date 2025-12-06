const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
const { v4: uuidv4 } = require('uuid');

class AIAgentService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: 'gemini-pro',
      temperature: 0.7,
      maxOutputTokens: 2048,
    });

    // Store conversation histories in memory (in production, use Redis or database)
    this.conversations = new Map();

    // System prompt for chatbot
    this.systemPrompt = `Kamu adalah asisten AI cerdas untuk sistem ticketing Benar Benar.
    Kamu membantu pengguna dalam:
    1. Membuat tiket support
    2. Melacak status tiket
    3. Memberikan informasi tentang produk
    4. Menjawab pertanyaan umum

    Selalu responsif, ramah, dan profesional. Gunakan bahasa Indonesia.
    Jika pengguna ingin membuat tiket, minta informasi berikut:
    - Judul masalah
    - Deskripsi detail
    - Kategori masalah
    - Prioritas (low, medium, high, urgent)
    - Nama dan email pengguna`;
  }

  async chat(message, sessionId = null, context = {}) {
    try {
      // Generate or use existing session ID
      const id = sessionId || uuidv4();

      // Get or create conversation history
      if (!this.conversations.has(id)) {
        this.conversations.set(id, [
          new SystemMessage(this.systemPrompt)
        ]);
      }

      const history = this.conversations.get(id);

      // Add user message
      history.push(new HumanMessage(message));

      // Get response from AI
      const response = await this.model.invoke(history);

      // Add AI response to history
      history.push(new AIMessage(response.content));

      // Keep only last 20 messages to prevent token limits
      if (history.length > 22) { // 20 messages + system prompt
        this.conversations.set(id, [
          new SystemMessage(this.systemPrompt),
          ...history.slice(-20)
        ]);
      }

      return {
        response: response.content,
        sessionId: id,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('AI Agent Error:', error);
      throw new Error('Terjadi kesalahan dalam memproses pesan Anda');
    }
  }

  async generateTicketSummary(description) {
    try {
      const prompt = `Buat ringkasan singkat dari deskripsi tiket berikut dalam format:

      Ringkasan: [1-2 kalimat ringkasan masalah]
      Kategori: [kategori yang sesuai: technical, billing, general, feature_request, bug_report]
      Prioritas: [low/medium/high/urgent berdasarkan urgensi]

      Deskripsi: ${description}`;

      const response = await this.model.invoke([
        new SystemMessage('Kamu adalah AI yang membantu menganalisis tiket support'),
        new HumanMessage(prompt)
      ]);

      return response.content;
    } catch (error) {
      console.error('Error generating ticket summary:', error);
      throw error;
    }
  }

  getConversationHistory(sessionId) {
    const history = this.conversations.get(sessionId);
    if (!history) return [];

    return history
      .filter(msg => msg.constructor.name !== 'SystemMessage')
      .map(msg => ({
        role: msg.constructor.name === 'HumanMessage' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: new Date().toISOString()
      }));
  }

  clearConversation(sessionId) {
    this.conversations.delete(sessionId);
    return { success: true, message: 'Conversation cleared' };
  }

  // Helper function to extract ticket information from chat
  extractTicketInfo(message) {
    const patterns = {
      title: /judul[:\s]+(.*?)(?=\n|deskripsi|$)/i,
      description: /deskripsi[:\s]+(.*?)(?=\n|kategori|$)/i,
      category: /kategori[:\s]+(.*?)(?=\n|prioritas|$)/i,
      priority: /prioritas[:\s]+(.*?)(?=\n|$)/i,
      email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    };

    const extracted = {};
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = message.match(pattern);
      if (match) {
        extracted[key] = match[1].trim();
      }
    }

    return extracted;
  }
}

module.exports = new AIAgentService();