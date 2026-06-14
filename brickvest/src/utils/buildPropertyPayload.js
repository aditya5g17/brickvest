import { buildPropertyFundingFields } from "./propertyFunding";
import { defaultFundingDeadline, extractCity, normalizePropertyCategory } from "./propertyHelpers";

export function buildPropertyPayload(form, createdBy) {
  const price = Number(form.price);
  const sharePrice = Number(form.sharePrice);
  const funding = buildPropertyFundingFields({
    price,
    sharePrice,
    fundedPercent: Number(form.fundedPercent || 0),
  });

  return {
    title: form.title.trim(),
    location: form.location.trim(),
    city: form.city?.trim() || extractCity(form.location),
    image: form.image.trim(),
    price,
    sharePrice,
    rentalYield: Number(form.rentalYield),
    growthScore: Number(form.growthScore || 5),
    type: form.type.trim(),
    propertyCategory: form.propertyCategory || normalizePropertyCategory(form.type),
    subType: form.subType?.trim() || "",
    riskLevel: form.riskLevel || "medium",
    legalStatus: form.legalStatus || "verified",
    constructionStatus: form.constructionStatus || "ready",
    investmentHorizon: form.investmentHorizon || "long",
    fundingDeadline: form.fundingDeadline || defaultFundingDeadline(30),
    maxOwnershipPercent: Number(form.maxOwnershipPercent || 20),
    ...funding,
    createdBy,
  };
}
