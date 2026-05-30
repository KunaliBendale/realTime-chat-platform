import { extractSmartReplySuggestions } from "./extractSmartReplySuggestions.js";

const assertSuggestions = (label, input, expected) => {
  const result = extractSmartReplySuggestions(input);
  const ok =
    result.length === expected.length &&
    expected.every((item, i) => result[i] === item) &&
    result.every((s) => !/json/i.test(s) || !s.includes("requested"));

  if (!ok) {
    console.error("FAIL", label, { input: input.slice(0, 80), result, expected });
    return false;
  }

  console.log("OK", label);
  return true;
};

let passed = 0;

if (
  assertSuggestions("clean json", '{"suggestions":["Sounds good!","On my way","Thanks"]}', [
    "Sounds good!",
    "On my way",
    "Thanks",
  ])
) {
  passed += 1;
}

if (
  assertSuggestions(
    "preamble + json",
    'Here is the JSON requested:\n{"suggestions":["Hello","Sure thing"]}',
    ["Hello", "Sure thing"],
  )
) {
  passed += 1;
}

if (
  assertSuggestions(
    "code fence",
    '```json\n{"suggestions":["Hi there","OK"]}\n```',
    ["Hi there", "OK"],
  )
) {
  passed += 1;
}

const preambleOnly = extractSmartReplySuggestions("Here is the JSON requested:");
if (preambleOnly.length === 0) {
  console.log("OK preamble only returns empty");
  passed += 1;
} else {
  console.error("FAIL preamble only", preambleOnly);
}

const badArray = extractSmartReplySuggestions(
  '["Here is the JSON requested:","Sounds good"]',
);
if (badArray.length === 1 && badArray[0] === "Sounds good") {
  console.log("OK filters meta strings in array");
  passed += 1;
} else {
  console.error("FAIL meta in array", badArray);
}

console.log(`\n${passed}/5 checks passed`);
