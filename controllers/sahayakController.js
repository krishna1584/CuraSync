require('dotenv').config();

const { GoogleGenerativeAI } = require("@google/generative-ai");// importing google genertive ai
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });// Which model to use

exports.sendMessage = async (req, res) => {
    const { userMessage, followUp } = req.body
    const prompt = `
    You are Sahayak, an assistant for health-related queries. Your task is to help users with their questions in a simple, clear, and organized way. Please format your responses with HTML, using <b>, <i>, <ul>, <li>, <br> tags for clarity and neatness. Your answers should be well-structured, easy to read, and avoid unnecessary repetition.

    The previous conversation is provided below:
    - Odd-numbered messages are your responses
    - Even-numbered messages are the user's messages

    Respond to the user's current query based on the conversation. Please avoid repeating any previous follow-up responses. Ensure that the format is neat, using HTML tags like:
    - <b> for bold text
    - <i> for italics
    - <ul> and <li> for lists
    - <br> for line breaks

    do not include language name like '''html and all those things

    Previous conversation: ${followUp}
    
    User's new query: ${userMessage}
    `;
    const result = await model.generateContent(prompt);
    res.json({ message: result.response.text() });
}