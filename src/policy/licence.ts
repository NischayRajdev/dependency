import type { PackageInstance } from "../inventory/types.ts";
import type { PolicyResult, LicencePolicy } from "./types.ts";
import { evidence, failure } from "../contracts/core.ts";

// Helper for parsing SPDX
export function evaluateLicenceExpression(expression: string, allowedIdentifiers: string[], allowedExceptions: string[]): boolean {
  if (!expression) return false;
  // A simple recursive descent or token-based parser for SPDX.
  // For now, we will handle AND, OR, WITH and parentheses.
  
  // Tokenizer
  const tokens: string[] = [];
  let current = "";
  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    if (char === '(' || char === ')') {
      if (current) tokens.push(current);
      tokens.push(char);
      current = "";
    } else if (/\s/.test(char)) {
      if (current) tokens.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);

  // Parser & Evaluator
  // Evaluate returns boolean (whether the license expression is allowed)
  let pos = 0;

  function parseExpression(): boolean {
    let left = parseTerm();
    while (pos < tokens.length && (tokens[pos] === "OR" || tokens[pos] === "AND")) {
      const op = tokens[pos++];
      const right = parseTerm();
      if (op === "OR") {
        left = left || right;
      } else if (op === "AND") {
        left = left && right;
      }
    }
    return left;
  }

  function parseTerm(): boolean {
    if (pos >= tokens.length) throw new Error("Unexpected end of expression");
    const token = tokens[pos++];
    if (token === "(") {
      const result = parseExpression();
      if (pos >= tokens.length || tokens[pos++] !== ")") throw new Error("Missing closing parenthesis");
      return result;
    } else {
      // It's a license identifier, optionally followed by WITH
      let id = token;
      let allowed = allowedIdentifiers.includes(id);
      
      if (pos < tokens.length && tokens[pos] === "WITH") {
        pos++;
        const exception = tokens[pos++];
        allowed = allowed && allowedExceptions.includes(exception);
      }
      return allowed;
    }
  }

  const result = parseExpression();
  if (pos < tokens.length) throw new Error("Unexpected trailing tokens");
  return result;
}
