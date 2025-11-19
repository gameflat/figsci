/**
 * JSON Repair Utility
 * Attempts to fix common JSON syntax errors from LLM outputs
 */

/**
 * Repair malformed JSON string
 * @param {string} jsonString - Potentially malformed JSON string
 * @returns {string} - Repaired JSON string
 */
export function repairJSON(jsonString) {
  let repaired = jsonString;

  // Remove any markdown code fences
  repaired = repaired.replace(/```json\n?/g, '').replace(/```\n?/g, '');

  // Fix missing commas between properties - multiple patterns
  
  // Pattern 1: "value"   "nextKey" -> "value", "nextKey"
  repaired = repaired.replace(/"\s+"/g, '", "');
  
  // Pattern 2: number   "nextKey" -> number, "nextKey" (CRITICAL for your case)
  repaired = repaired.replace(/(\d)\s+"/g, '$1, "');
  
  // Pattern 3: }   "nextKey" -> }, "nextKey"
  repaired = repaired.replace(/\}\s+"/g, '}, "');
  
  // Pattern 4: ]   "nextKey" -> ], "nextKey"
  repaired = repaired.replace(/\]\s+"/g, '], "');

  // Fix missing commas between array/object elements
  repaired = repaired.replace(/\}\s*\{/g, '}, {');
  repaired = repaired.replace(/\]\s*\[/g, '], [');

  // Fix trailing commas before closing braces/brackets
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Fix missing quotes around property names
  repaired = repaired.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // Fix single quotes to double quotes
  repaired = repaired.replace(/'/g, '"');

  // Remove comments (// and /* */)
  repaired = repaired.replace(/\/\/.*$/gm, '');
  repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, '');

  // Fix missing closing brackets/braces (basic attempt)
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;

  if (openBraces > closeBraces) {
    repaired += '}'.repeat(openBraces - closeBraces);
  }
  if (openBrackets > closeBrackets) {
    repaired += ']'.repeat(openBrackets - closeBrackets);
  }

  return repaired.trim();
}

/**
 * Parse JSON with repair attempts
 * @param {string} jsonString - JSON string to parse
 * @returns {Object} - Parsed object or throws error with details
 */
export function parseJSONWithRepair(jsonString) {
  // Try parsing original first
  try {
    return JSON.parse(jsonString);
  } catch (originalError) {
    console.warn('Initial JSON parse failed, attempting repair...', originalError.message);
    console.log('Original JSON preview:', jsonString.substring(0, 300));

    // Try repairing and parsing again
    try {
      const repaired = repairJSON(jsonString);
      console.log('Repaired JSON preview:', repaired.substring(0, 300));
      const parsed = JSON.parse(repaired);
      console.log('✅ JSON successfully repaired and parsed');
      return parsed;
    } catch (repairError) {
      // If repair also fails, provide detailed error
      console.error('Repair failed:', repairError.message);
      console.error('Original error:', originalError.message);
      
      const error = new Error('Failed to parse JSON even after repair attempts');
      error.originalError = originalError;
      error.repairError = repairError;
      error.jsonPreview = jsonString.substring(0, 200) + '...';

      // Try to find the approximate error location in ORIGINAL JSON
      const originalMatch = originalError.message.match(/position (\d+)/);
      if (originalMatch) {
        const position = parseInt(originalMatch[1]);
        const lineNumber = jsonString.substring(0, position).split('\n').length;
        const context = jsonString.substring(Math.max(0, position - 80), position + 80);
        error.errorContext = context;
        error.errorPosition = position;
        error.errorLine = lineNumber;
        console.error(`Error at line ${lineNumber}, position ${position}`);
        console.error('Context:', context);
      }

      throw error;
    }
  }
}

/**
 * Extract JSON array from text that may contain other content
 * @param {string} text - Text that may contain JSON
 * @returns {Array|null} - Extracted and parsed array or null
 */
export function extractJSONArray(text) {
  // Remove markdown code fences
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  // Try to find JSON array pattern
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!arrayMatch) {
    console.warn('No JSON array found in text');
    return null;
  }

  try {
    return parseJSONWithRepair(arrayMatch[0]);
  } catch (error) {
    console.error('Failed to extract JSON array:', error);
    return null;
  }
}

/**
 * Validate Excalidraw elements array
 * @param {Array} elements - Array to validate
 * @returns {Object} - Validation result { valid: boolean, errors: Array }
 */
export function validateExcalidrawElements(elements) {
  const errors = [];

  if (!Array.isArray(elements)) {
    errors.push('Input is not an array');
    return { valid: false, errors };
  }

  if (elements.length === 0) {
    errors.push('Array is empty');
    return { valid: false, errors };
  }

  elements.forEach((element, index) => {
    if (!element.type) {
      errors.push(`Element ${index}: Missing required property 'type'`);
    }
    if (element.x === undefined) {
      errors.push(`Element ${index}: Missing required property 'x'`);
    }
    if (element.y === undefined) {
      errors.push(`Element ${index}: Missing required property 'y'`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    elementCount: elements.length,
  };
}

