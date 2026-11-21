import { z } from "zod";
import locations from "@/data/middle-east-locations.json";

export const USER_WEBSITE_TYPES = ["official_website", "ecommerce_store", "social_network", "marketplace", "other"] as const;
export const MIDDLE_EAST_COUNTRY_CODES = ["AE", "BH", "CY", "EG", "IR", "IQ", "IL", "JO", "KW", "LB", "OM", "PS", "QA", "SA", "SY", "TR", "YE"] as const;
const jobs = ["founder", "ceo", "marketing_manager", "sales_manager", "product_manager", "website_manager", "social_media_manager", "social_seller", "online_seller", "ecommerce_manager", "content_creator", "marketing_specialist", "sales_specialist", "business_consultant", "service_contractor", "supplier", "manufacturer", "trader", "mining_professional", "other"] as const;
const industries = ["manufacturing", "trade", "mining", "agriculture", "services", "technology", "ecommerce", "social_commerce", "education", "healthcare", "construction", "logistics", "tourism", "finance", "media", "other"] as const;
const positions = ["ceo", "board_member", "senior_executive", "department_manager", "marketing_manager", "sales_manager", "employee", "legal_representative", "appointed_representative", "other"] as const;
const relationships = ["director_or_member", "employee", "legal_representative", "appointed_representative", "agency_contractor", "independent_consultant", "other"] as const;
const legalTypes: Record<string, readonly string[]> = {
  AE: ["limited_liability", "private_joint_stock", "public_joint_stock", "partnership", "other"], BH: ["wll", "closed_shareholding", "public_shareholding", "partnership", "other"],
  CY: ["private_limited", "public_limited", "partnership", "other"], EG: ["joint_stock", "limited_liability", "partnership", "sole_proprietorship", "other"],
  IR: ["private_joint_stock", "public_joint_stock", "limited_liability", "general_partnership", "cooperative", "institute", "other"],
  IQ: ["limited_liability", "joint_stock", "general_partnership", "sole_proprietorship", "other"], IL: ["limited_company", "public_company", "partnership", "other"],
  JO: ["limited_liability", "public_shareholding", "private_shareholding", "partnership", "other"], KW: ["wll", "closed_shareholding", "public_shareholding", "partnership", "other"],
  LB: ["sarl", "sal", "snc", "other"], OM: ["limited_liability", "saoc", "saog", "partnership", "other"],
  PS: ["limited_liability", "private_shareholding", "public_shareholding", "partnership", "other"], QA: ["limited_liability", "qsc", "qpsc", "partnership", "other"],
  SA: ["limited_liability", "joint_stock", "simplified_joint_stock", "general_partnership", "limited_partnership", "other"], SY: ["limited_liability", "joint_stock", "partnership", "other"],
  TR: ["limited_company", "joint_stock", "collective_company", "commandite", "cooperative", "other"], YE: ["limited_liability", "joint_stock", "partnership", "other"],
};

export const userIdentityInputSchema = z.object({
  identityType: z.enum(["individual", "legal_entity"]),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  gender: z.enum(["male", "female"]),
  ageRange: z.enum(["under_18", "18_24", "25_34", "35_44", "45_54", "55_64", "65_plus"]),
  jobTitle: z.enum(jobs),
  customJobTitle: z.string().trim().max(100).optional().default(""),
  industry: z.enum(industries),
  customIndustry: z.string().trim().max(100).optional().default(""),
  phoneNumber: z.string().trim().max(30).optional().default("").transform((value) => value.replace(/[\s()-]/g, "")),
  smsNotificationsEnabled: z.boolean().optional().default(false),
  legalEntity: z.object({
    companyName: z.string().trim().min(1).max(200), brandName: z.string().trim().max(200).optional().default(""),
    legalType: z.string().trim().min(1).max(80), registrationCountryCode: z.enum(MIDDLE_EAST_COUNTRY_CODES),
    nationalId: z.string().trim().max(100).optional().default(""), industry: z.enum(industries),
    customIndustry: z.string().trim().max(100).optional().default(""),
    headquartersCountryCode: z.enum(MIDDLE_EAST_COUNTRY_CODES), headquartersProvince: z.string().trim().min(1).max(120),
    headquartersCity: z.string().trim().min(1).max(120), representativePosition: z.enum(positions),
    representativeRelationship: z.enum(relationships), representativePhoneNumber: z.string().trim().max(30).optional().default("").transform((value) => value.replace(/[\s()-]/g, "")),
  }).optional(),
  websites: z.array(z.object({ url: z.string().trim().url().max(2048), platformType: z.enum(USER_WEBSITE_TYPES) })).max(50).optional().default([]),
}).superRefine((value, context) => {
  if (value.jobTitle === "other" && !value.customJobTitle.trim()) context.addIssue({ code: "custom", path: ["customJobTitle"], message: "A custom job title is required." });
  if (value.industry === "other" && !value.customIndustry.trim()) context.addIssue({ code: "custom", path: ["customIndustry"], message: "A custom industry is required." });
  if (value.phoneNumber && !/^\+[1-9][0-9]{7,14}$/.test(value.phoneNumber)) context.addIssue({ code: "custom", path: ["phoneNumber"], message: "Enter a valid international phone number." });
  if (value.identityType === "legal_entity" && !value.legalEntity) context.addIssue({ code: "custom", path: ["legalEntity"], message: "Legal-entity details are required." });
  const legal = value.legalEntity;
  if (legal) {
    if (!legalTypes[legal.registrationCountryCode]?.includes(legal.legalType)) context.addIssue({ code: "custom", path: ["legalEntity", "legalType"], message: "The legal entity type is not valid for the selected country." });
    const country = locations.countries.find((item) => item.code === legal.headquartersCountryCode);
    const province = country?.states.find((item) => item.name === legal.headquartersProvince);
    if (!province || !province.cities.includes(legal.headquartersCity)) context.addIssue({ code: "custom", path: ["legalEntity", "headquartersCity"], message: "The city must belong to the selected province and country." });
    if (legal.industry === "other" && !legal.customIndustry.trim()) context.addIssue({ code: "custom", path: ["legalEntity", "customIndustry"], message: "A custom company industry is required." });
    if (legal.representativePhoneNumber && !/^\+[1-9][0-9]{7,14}$/.test(legal.representativePhoneNumber)) context.addIssue({ code: "custom", path: ["legalEntity", "representativePhoneNumber"], message: "Enter a valid international phone number." });
  }
  const urls = new Set<string>();
  value.websites.forEach((website, index) => {
    try {
      const parsed = new URL(website.url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") context.addIssue({ code: "custom", path: ["websites", index, "url"], message: "Only HTTP and HTTPS addresses are supported." });
      const normalized = parsed.toString().replace(/\/$/, "");
      if (urls.has(normalized)) context.addIssue({ code: "custom", path: ["websites", index, "url"], message: "This address has already been added." });
      urls.add(normalized);
    } catch {
      context.addIssue({ code: "custom", path: ["websites", index, "url"], message: "Enter a valid website address." });
    }
  });
});

export type UserIdentityInput = z.infer<typeof userIdentityInputSchema>;
