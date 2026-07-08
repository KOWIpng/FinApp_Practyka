
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

async function categorizeTransaction(bankDescription, userLimits) {
    // ТЕСТОВИЙ РЕЖИМ
    if (!ai) {
        console.log(`[Mock AI] Аналізую транзакцію: "${bankDescription}"`);
        return { category: 'Інше (Тест)', limitId: null };
    }

    // Якщо ключ є
    const limitsContext = userLimits.map(l => `ID: ${l.id}, Назва ліміту: "${l.name}"`).join('\n');

    const prompt = `
        Ти — інтелектуальний фінансовий асистент додатку FinanceTracker.Твоє завдання — проаналізувати опис транзакції від банку та підібрати підходящий ліміт (бюджет) користувача, а також дати йому красиву назву категорії.

        Опис транзакції від банку: "${bankDescription}"

        Доступні ліміти користувача:
        ${limitsContext}

       Правила:
       1. Оціни зміст опису. Якщо це, наприклад, "Сільпо" або "АТБ", підбери ліміт "Їжа" або "Продукти" чи "Хавчик". Якщо це "WOG" — "Транспорт" чи "Авто". 
       2. Якщо жоден ліміт не підходить за змістом, або це очевидний дохід (наприклад, "Зарплата", "Переказ від..."), то в полі limitId поверни null.
       3. В полі category запиши коротку, красиву назву категорії українською мовою (наприклад: "Канцелярія", "Переказ", "Кафе", "Таксі", "Комунальні", "Зарплата").
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING },
                        limitId: { type: Type.INTEGER, nullable: true }
                    },
                    required: ['category', 'limitId'],
                }
            }
        });

        const result = JSON.parse(response.text.trim());
        console.log(`🤖 [Gemini] Розпізнано "${bankDescription}" як:`, result);
        return result;

    } catch (err) {
        console.error('Помилка роботи Gemini:', err.message);
        return { category: 'Помилка ШІ', limitId: null };
    }
}

module.exports = { categorizeTransaction };