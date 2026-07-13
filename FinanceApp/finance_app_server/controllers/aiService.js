
require('dotenv').config();
const { GoogleGenAI, Type } = require('@google/genai');

//const ai = new GoogleGenAI();
const apiKey = process.env.GEMINI_API_KEY;
let ai = null;

if (apiKey && apiKey !== 'справжній_ключ_з_ai_studio') {
    ai = new GoogleGenAI({ apiKey: apiKey });
    console.log(' Модуль Gemini AI успішно ініціалізовано!');
} else {
    console.log('Ключ Gemini API не знайдено. AI працює в тестовому режимі (Mock).');

}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));//delay між запитами

async function categorizeTransactionsBatch(transactionsBatch, userLimits, maxRetries = 3) {
    if (!ai) {
        return transactionsBatch.map(tx => ({ id: tx.id, category: 'Інше (Тест)', limitId: null }));
    }

    const limitsContext = userLimits.map(l => `ID: ${l.id}, Назва ліміту: "${l.name}"`).join('\n');
    
    // ДОДАНО СУМУ В ТЕКСТ ДЛЯ ШІ
    const txContext = transactionsBatch.map(tx => 
        `ID: ${tx.id} | Опис: "${tx.desc}" | MCC: "${tx.mcc}" | Сума: ${tx.amount} UAH`
    ).join('\n');

    // ОНОВЛЕНІ ЖОРСТКІ ПРАВИЛА
    const prompt = `
        Ти — фінансовий помічник. Твоє завдання — категоризувати список банківських транзакцій.
        
        Ось список транзакцій для аналізу:
        ${txContext}

        Ось список ДОСТУПНИХ ЛІМІТІВ користувача:
        ${limitsContext}

        ПРАВИЛА (СУВОРО):
        1. Зверни увагу на СУМУ кожної транзакції.
        2. Якщо Сума ВІД'ЄМНА (з мінусом, наприклад -78) — це ВИТРАТА. Для витрат ти ЗОБОВ'ЯЗАНИЙ підібрати найбільш логічний ліміт зі списку і повернути його цифру в поле limitId.
        3. Якщо Сума ДОДАТНА (без мінуса, наприклад 3000) — це ДОХІД. Для доходів limitId ЗАВЖДИ має бути null.
        4. Поверни JSON-масив об'єктів (id, category, limitId).
    `;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: 'models/gemini-flash-lite-latest',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY, 
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING }, // ID для зв'язку результату з транзакцією
                                category: { type: Type.STRING },
                                limitId: { type: Type.INTEGER, nullable: true }
                            },
                            required: ['id', 'category', 'limitId'],
                        }
                    }
                }
            });

            const result = JSON.parse(response.text.trim());
            console.log(`Gemini Успішно розпізнано пачку з ${result.length} транзакцій!`);
            return result; // Повертаємо готовий масив відповідей

        } catch (err) {
            console.error(`⚠️ Спроба ${attempt} для пачки провалилася:`, err.message);
            if (attempt === maxRetries) return null; // Якщо все зламалося
            
            let waitTime = attempt * 10000; 
            const match = err.message.match(/retry in (\d+\.?\d*)s/);
            if (match && match[1]) waitTime = Math.ceil(parseFloat(match[1])) * 1000 + 1000;

            console.log(`⏳ Чекаємо ${waitTime / 1000} секунд...`);
            await delay(waitTime);
        }
    }
}

module.exports = { categorizeTransactionsBatch };