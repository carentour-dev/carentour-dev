export const sexOptions = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
  { value: "other", label: "Other" },
] as const;

export type SexOptionValue = (typeof sexOptions)[number]["value"];

export const sexOptionValues = sexOptions.map((option) => option.value) as [
  SexOptionValue,
  ...SexOptionValue[],
];
