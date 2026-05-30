import { parseProviderSuggestions } from "./parseProviderSuggestions.js";

const studiesJson =
  '{"suggestions":["Going pretty well, exams soon though!","Busy but manageable — hbu?","Could be better, lots of assignments."]}';

const result = parseProviderSuggestions(studiesJson);

if (result.suggestions.length === 3 && result.suggestions[0].includes("well")) {
  console.log("OK studies json", result.source);
} else {
  console.error("FAIL studies json", result);
  process.exit(1);
}

const broken =
  '{"suggestions":["Studies are going great!","A bit stressful lately.","';

const recovered = parseProviderSuggestions(broken);

if (recovered.suggestions.length >= 1) {
  console.log("OK recovered truncated json", recovered.suggestions);
} else {
  console.error("FAIL truncated", recovered);
  process.exit(1);
}

console.log("\nparseProviderSuggestions tests passed");
