/**
 * OpenAI API client with streaming support
 */

/**
 * Call OpenAI API with streaming
 * @param {Object} config - API configuration
 * @param {Array} messages - Array of message objects
 * @param {Function} onChunk - Callback for each chunk
 * @returns {Promise<string>} - Complete response
 */
export async function callOpenAI(config, messages, onChunk) {
  const { baseUrl, apiKey, model } = config;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((line) => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              fullResponse += content;
              if (onChunk) {
                onChunk(content);
              }
            }
          } catch (e) {
            // Skip invalid JSON chunks
            console.warn('Failed to parse chunk:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullResponse;
}

/**
 * Process message with image support
 * @param {string|Object} userInput - Text or object with text and image
 * @returns {Object} - Formatted message object
 */
export function processMessage(userInput) {
  if (typeof userInput === 'string') {
    return {
      role: 'user',
      content: userInput,
    };
  }

  // Handle multimodal input (text + image)
  const content = [];

  if (userInput.text) {
    content.push({
      type: 'text',
      text: userInput.text,
    });
  }

  if (userInput.image) {
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${userInput.image.mimeType};base64,${userInput.image.data}`,
        detail: 'high',
      },
    });
  }

  return {
    role: 'user',
    content: content,
  };
}

/**
 * Validate API configuration
 * @param {Object} config - Configuration object
 * @returns {boolean} - Whether config is valid
 */
export function validateConfig(config) {
  if (!config) return false;
  if (!config.baseUrl || !config.apiKey || !config.model) return false;
  return true;
}

/**
 * Test API connection
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} - Test result
 */
export async function testConnection(config) {
  try {
    const response = await fetch(`${config.baseUrl}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (response.ok) {
      return { success: true, message: 'Connection successful' };
    } else {
      return { success: false, message: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}
