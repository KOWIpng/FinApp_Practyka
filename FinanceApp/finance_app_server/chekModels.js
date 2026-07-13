
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// Беремо твій ключ
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

async function checkModels() {
    console.log("🕵️‍♀️ Звертаємося до Google... Шукаємо доступні моделі для твого ключа:");
    console.log("-------------------------------------------------");
    
    try {
        // Виконуємо той самий ListModels
        const models = await ai.models.list();
        
        // Перебираємо і виводимо всі назви моделей
        for await (const model of models) {
            // Фільтруємо, щоб показати тільки моделі сімейства Gemini (без старих текстових)
            if (model.name.includes('gemini')) {
                console.log(`✅ ${model.name}`);
            }
        }
        console.log("-------------------------------------------------");
        console.log("🎯 Скопіюй одну з цих назв (наприклад, gemini-1.5-flash) і встав у aiService.js");
        
    } catch (error) {
        console.error("❌ Помилка отримання списку:", error.message);
    }
}

checkModels();