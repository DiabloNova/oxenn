import { describe, expect, it } from "vitest";
import { userIdentityInputSchema } from "../../../../src/services/user-identity/validation";

const individual = { identityType:"individual", firstName:"مریم", lastName:"احمدی", gender:"female", ageRange:"25_34", jobTitle:"founder", industry:"services", phoneNumber:"+989121234567" };
const legalEntity = { companyName:"نمونه پردازش", brandName:"نمونه", legalType:"limited_liability", registrationCountryCode:"IR", nationalId:"12345678901", industry:"technology", headquartersCountryCode:"IR", headquartersProvince:"Tehran", headquartersCity:"Tehran", representativePosition:"ceo", representativeRelationship:"director_or_member", representativePhoneNumber:"" };

describe("user identity profile validation",()=>{
  it("accepts a complete individual profile",()=>expect(userIdentityInputSchema.safeParse(individual).success).toBe(true));
  it("requires legal entity data when legal identity is selected",()=>expect(userIdentityInputSchema.safeParse({...individual,identityType:"legal_entity"}).success).toBe(false));
  it("accepts a valid legal entity and user website directory entry",()=>expect(userIdentityInputSchema.safeParse({...individual,identityType:"legal_entity",legalEntity,websites:[{url:"https://example.com",platformType:"official_website"}]}).success).toBe(true));
  it("rejects a city that does not belong to the selected province",()=>expect(userIdentityInputSchema.safeParse({...individual,identityType:"legal_entity",legalEntity:{...legalEntity,headquartersCity:"Shiraz"}}).success).toBe(false));
  it("rejects registration countries outside the Middle East list",()=>expect(userIdentityInputSchema.safeParse({...individual,identityType:"legal_entity",legalEntity:{...legalEntity,registrationCountryCode:"US"}}).success).toBe(false));
  it("rejects local-format phone numbers and non-HTTP website protocols",()=>{
    expect(userIdentityInputSchema.safeParse({...individual,phoneNumber:"09121234567"}).success).toBe(false);
    expect(userIdentityInputSchema.safeParse({...individual,identityType:"legal_entity",legalEntity,websites:[{url:"ftp://example.com",platformType:"other"}]}).success).toBe(false);
  });
});
