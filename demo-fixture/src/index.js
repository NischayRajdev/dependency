import { badMethod } from "vulnerable-dep";

export function runSystem(userInput) {
  badMethod(userInput);
}

export async function loadOptionalAnalyzer() {
  return import("dynamic-dep");
}

runSystem("fixture-input");
