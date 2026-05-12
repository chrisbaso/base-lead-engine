import { hvacFirstEmailVariations, hvacQuizCopyVariations } from "./copy";

export type HvacQuizVariantId = (typeof hvacQuizCopyVariations)[number]["id"];
export type HvacEmailVariantId = (typeof hvacFirstEmailVariations)[number]["id"];

export type HvacExperimentAssignment = {
  quizVariant: HvacQuizVariantId;
  emailVariant: HvacEmailVariantId;
};

type VariantInput = {
  quizVariant?: string | undefined;
  emailVariant?: string | undefined;
};

const controlAssignment: HvacExperimentAssignment = {
  quizVariant: hvacQuizCopyVariations[0].id,
  emailVariant: hvacFirstEmailVariations[0].id
};

export function resolveHvacExperimentAssignment(input: VariantInput): HvacExperimentAssignment {
  return {
    quizVariant: isHvacQuizVariantId(input.quizVariant) ? input.quizVariant : controlAssignment.quizVariant,
    emailVariant: isHvacEmailVariantId(input.emailVariant) ? input.emailVariant : controlAssignment.emailVariant
  };
}

export function getHvacQuizVariation(variantId?: string) {
  const assignment = resolveHvacExperimentAssignment({ quizVariant: variantId });
  return hvacQuizCopyVariations.find((variant) => variant.id === assignment.quizVariant) ?? hvacQuizCopyVariations[0];
}

export function getHvacEmailVariation(variantId?: string) {
  const assignment = resolveHvacExperimentAssignment({ emailVariant: variantId });
  return hvacFirstEmailVariations.find((variant) => variant.id === assignment.emailVariant) ?? hvacFirstEmailVariations[0];
}

export function isHvacQuizVariantId(value: unknown): value is HvacQuizVariantId {
  return typeof value === "string" && hvacQuizCopyVariations.some((variant) => variant.id === value);
}

export function isHvacEmailVariantId(value: unknown): value is HvacEmailVariantId {
  return typeof value === "string" && hvacFirstEmailVariations.some((variant) => variant.id === value);
}
