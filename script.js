document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const aiForm = document.getElementById('ai-form');
    const questionInput = document.getElementById('question-input');
    const responseOutput = document.getElementById('response-output');
    const submitButton = document.getElementById('submit-button');

    // --- API Configuration ---
    // WARNING: Do NOT expose your API key in client-side code in a real application.
    // This is for demonstration purposes only.
    const API_KEY = "AIzaSyA4A8o7thBcgJNEg-ADPkdiEgE-kpzgawY"; // Your API key
    const MODEL_NAME = "gemini-1.5-flash-latest"; // Use a powerful model
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    // --- System Instruction ---
    const SYSTEM_INSTRUCTION = `You are a Data Structure and Algorithm Instructor. You will give replies ONLY to questions related to DSA and coding.
If a user asks a question that is not related to DSA (e.g., "How are you?", "What is the capital of France?"), you MUST reply rudely and dismissively. For example: "You Dumb! Ask me some sensible questions about coding and DSA." or "Why are you wasting my time? Stick to algorithms."
For valid DSA or coding questions, you must reply politely, clearly, and provide simple, easy-to-understand explanations with code examples where appropriate. Format your answers clearly using Markdown.`;

    // --- Initial Welcome Message ---
    responseOutput.innerHTML = `
        <p><strong>Welcome to Coding Instructor AI!</strong> I'm here to help you with any programming questions you have.</p>
        <p>Here's an example of how I can help:</p>
        <p><strong>Question:</strong> What is a closure in JavaScript?</p>
    `;

    // --- Event Listener for Form Submission ---
    aiForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent page reload

        const userQuestion = questionInput.value.trim();
        if (!userQuestion) {
            responseOutput.innerHTML = '<p>Please enter a question.</p>';
            return;
        }

        // --- UI Loading State ---
        submitButton.disabled = true;
        submitButton.innerHTML = 'Thinking...';
        responseOutput.innerHTML = '<p> Generating Response ....... Please wait </p>';

        try {
            // --- Construct the API Request Body ---
            const requestBody = {
                contents: [{
                    role: 'user',
                    parts: [{ text: userQuestion }]
                }],
                systemInstruction: {
                    parts: [{ text: SYSTEM_INSTRUCTION }]
                }
            };
            
            // --- Make the API Call using fetch ---
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorData.error.message}`);
            }

            const responseData = await response.json();
            
            // Check for valid response and candidates
            if (responseData.candidates && responseData.candidates.length > 0) {
                const modelResponseText = responseData.candidates[0].content.parts[0].text;
                // Format the response and display it
                responseOutput.innerHTML = formatResponse(modelResponseText);
            } else {
                 // Handle cases where the API returns a response with no candidates (e.g., safety blocks)
                const blockReason = responseData.promptFeedback?.blockReason || 'No content';
                throw new Error(`The response was blocked. Reason: ${blockReason}`);
            }

        } catch (error) {
            console.error("Error:", error);
            responseOutput.innerHTML = `<p style="color: #F87171;"><strong>Error:</strong> ${error.message}</p>`;
        } finally {
            // --- Reset UI State ---
            submitButton.disabled = false;
            submitButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                Ask Coding Instructor
            `;
        }
    });

    /**
     * Simple Markdown to HTML converter.
     * Handles **bold**, `code`, and ```code blocks```.
     * @param {string} text - The text from the AI.
     * @returns {string} - HTML formatted string.
     */
    function formatResponse(text) {
        // Escape HTML to prevent XSS
        let safeText = text.replace(/</g, "<").replace(/>/g, ">");

        // Process code blocks first
        safeText = safeText.replace(/```([\s\S]*?)```/g, (match, code) => {
            return `<pre><code>${code.trim()}</code></pre>`;
        });
        
        // Process bold text
        safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Process inline code
        safeText = safeText.replace(/`(.*?)`/g, '<code>$1</code>');

        // Process newlines
        return safeText.replace(/\n/g, '<br>');
    }
});