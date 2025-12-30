import assert from "node:assert/strict";
import {
  formatInfrastructureEntries,
  formatInfrastructureValue,
} from "../src/lib/infrastructure.js";

const entries = formatInfrastructureEntries({
  imaging: ["MRI", "PET/CT Scanning"],
  icu_beds: null,
  emergency_support: true,
  bed_count: 155,
  empty_array: [],
  nested: { accreditation: "JCI", verified: true },
  false_value: false,
  whitespace: "   ",
  zero: 0,
});

assert.deepEqual(entries, [
  { key: "imaging", label: "imaging", value: "MRI, PET/CT Scanning" },
  { key: "emergency_support", label: "emergency support", value: "Yes" },
  { key: "bed_count", label: "bed count", value: "155" },
  {
    key: "nested",
    label: "nested",
    value: "accreditation: JCI, verified: Yes",
  },
  { key: "false_value", label: "false value", value: "No" },
  { key: "zero", label: "zero", value: "0" },
]);

assert.equal(formatInfrastructureValue(undefined), null);
assert.equal(formatInfrastructureValue(null), null);
assert.equal(formatInfrastructureValue("  "), null);
assert.equal(formatInfrastructureValue(["", null]), null);
assert.equal(formatInfrastructureValue({ value: "" }), null);
assert.equal(formatInfrastructureValue({ value: 1 }), "value: 1");

console.log("infrastructure formatting tests passed");
