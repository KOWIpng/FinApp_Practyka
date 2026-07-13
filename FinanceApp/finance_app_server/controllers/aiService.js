
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
    const limitsContext = userLimits.map(l => `ID: ${l.code}, Назва ліміту: "${l.name}"`).join('\n');
    console.log(`Передаємо ШІ такі ліміти:\n${limitsContext || "ЛІМІТІВ НЕМАЄ (Порожньо!)"}`);

    const prompt = `
       Ти — фінансовий помічник. Твоє завдання — категоризувати банківську транзакцію.
        Опис транзакції: "${bankDescription}"

        Ось список ДОСТУПНИХ ЛІМІТІВ користувача:
        ${limitsContext}

        ПРАВИЛА (СУВОРО):
        1. Якщо це витрата (наприклад, магазин "АТБ", кафе, підписки): ти ЗОБОВ'ЯЗАНИЙ вибрати найбільш підходящий ліміт із наданого списку. Наприклад, для "АТБ" вибери ліміт "Їжа".
        2. У поле limitId запиши виключно цифру (ID вибраного ліміту).
        3. Якщо це ДОХІД (наприклад, переказ від когось, зарплата, поповнення), поверни limitId: null.
        4. У поле category запиши коротку назву категорії (можеш використати назву вибраного ліміту або придумати свою, наприклад "Супермаркет").
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
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