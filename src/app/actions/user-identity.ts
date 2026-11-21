"use server";

import { randomUUID } from "node:crypto";
import { requireSession } from "@/services/auth/session";
import { AuthorizationError } from "@/services/auth/authorization";
import { TenantContextManager } from "@/core/database/tenant-context";
import { userIdentityInputSchema } from "@/services/user-identity/validation";
import { getUserWebsiteDirectory, type UserWebsiteDirectoryEntry } from "@/services/user-identity/user-website-directory";

export async function getUserIdentityProfileAction() {
  const session = await requireSession();
  if (!session.user) throw new AuthorizationError(401, "Unauthorized: No active session user.");
  const data = await TenantContextManager.runWithSystemContext(session.user.id, "sys-user-identity-profile", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get database client for the user identity profile.");
    const profileResult = await client.query(
      `SELECT identity_type AS "identityType", first_name AS "firstName", last_name AS "lastName", gender,
              age_range AS "ageRange", job_title AS "jobTitle", custom_job_title AS "customJobTitle",
              industry, custom_industry AS "customIndustry", phone_number AS "phoneNumber",
              phone_verified_at AS "phoneVerifiedAt", sms_notifications_enabled AS "smsNotificationsEnabled"
       FROM user_profiles WHERE user_id = $1 LIMIT 1`, [session.user!.id],
    );
    const legalResult = await client.query(
      `SELECT company_name AS "companyName", brand_name AS "brandName", legal_type AS "legalType",
              registration_country_code AS "registrationCountryCode", national_id AS "nationalId", industry,
              custom_industry AS "customIndustry", headquarters_country_code AS "headquartersCountryCode",
              headquarters_province AS "headquartersProvince", headquarters_city AS "headquartersCity",
              representative_position AS "representativePosition", representative_relationship AS "representativeRelationship",
              representative_phone_number AS "representativePhoneNumber"
       FROM user_legal_profiles WHERE user_id = $1 LIMIT 1`, [session.user!.id],
    );
    const websiteResult = await client.query(
      `SELECT id, url, platform_type AS "platformType", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM user_websites WHERE user_id = $1 ORDER BY created_at ASC, id ASC`, [session.user!.id],
    );
    return { profile: profileResult.rows[0] ?? null, legalEntity: legalResult.rows[0] ?? null, websites: websiteResult.rows };
  });
  const nameParts = session.user.name.trim().split(/\s+/);
  return {
    success: true as const,
    account: { email: session.user.email, name: session.user.name },
    profile: {
      identityType: data.profile?.identityType ?? "individual",
      firstName: data.profile?.firstName ?? nameParts[0] ?? "",
      lastName: data.profile?.lastName ?? nameParts.slice(1).join(" "),
      gender: data.profile?.gender ?? "", ageRange: data.profile?.ageRange ?? "",
      jobTitle: data.profile?.jobTitle ?? "", customJobTitle: data.profile?.customJobTitle ?? "",
      industry: data.profile?.industry ?? "", customIndustry: data.profile?.customIndustry ?? "",
      phoneNumber: data.profile?.phoneNumber ?? "", phoneVerified: Boolean(data.profile?.phoneVerifiedAt),
      smsNotificationsEnabled: Boolean(data.profile?.smsNotificationsEnabled),
    },
    legalEntity: data.legalEntity ? {
      companyName: data.legalEntity.companyName ?? "", brandName: data.legalEntity.brandName ?? "",
      legalType: data.legalEntity.legalType ?? "", registrationCountryCode: data.legalEntity.registrationCountryCode ?? "IR",
      nationalId: data.legalEntity.nationalId ?? "", industry: data.legalEntity.industry ?? "",
      customIndustry: data.legalEntity.customIndustry ?? "", headquartersCountryCode: data.legalEntity.headquartersCountryCode ?? "",
      headquartersProvince: data.legalEntity.headquartersProvince ?? "", headquartersCity: data.legalEntity.headquartersCity ?? "",
      representativePosition: data.legalEntity.representativePosition ?? "", representativeRelationship: data.legalEntity.representativeRelationship ?? "",
      representativePhoneNumber: data.legalEntity.representativePhoneNumber ?? "",
    } : null,
    websites: data.websites.map((row: { id: string; url: string; platformType: string }) => ({ id: row.id, url: row.url, platformType: row.platformType as UserWebsiteDirectoryEntry["platformType"] })),
  };
}

export async function getUserWebsiteDirectoryAction() {
  const session = await requireSession();
  if (!session.user) throw new AuthorizationError(401, "Unauthorized: No active session user.");
  return { success: true as const, websites: await getUserWebsiteDirectory(session.user.id) };
}

export async function saveUserIdentityProfileAction(input: unknown) {
  const session = await requireSession();
  if (!session.user) throw new AuthorizationError(401, "Unauthorized: No active session user.");
  const parsed = userIdentityInputSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, errorCode: "VALIDATION_ERROR", fieldErrors: parsed.error.flatten().fieldErrors };
  const value = parsed.data;
  if (value.identityType === "legal_entity" && !value.legalEntity) return { success: false as const, errorCode: "LEGAL_ENTITY_REQUIRED" };

  return TenantContextManager.runWithSystemContext(session.user.id, "sys-user-identity-profile", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get database client for the user identity profile.");
    const username = session.user!.username?.trim() || `user_${session.user!.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24)}`;
    const current = await client.query(`SELECT phone_number, phone_verified_at FROM user_profiles WHERE user_id = $1 LIMIT 1`, [session.user!.id]);
    const phoneNumber = value.phoneNumber || null;
    const phoneUnchanged = (current.rows[0]?.phone_number ?? null) === phoneNumber;
    const phoneVerifiedAt = phoneUnchanged ? current.rows[0]?.phone_verified_at ?? null : null;
    const smsEnabled = phoneUnchanged && Boolean(phoneVerifiedAt) && value.smsNotificationsEnabled;

    await client.query(
      `INSERT INTO user_profiles (user_id, username, identity_type, first_name, last_name, gender, age_range, job_title,
        custom_job_title, industry, custom_industry, phone_number, phone_verified_at, sms_notifications_enabled, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
       ON CONFLICT (user_id) DO UPDATE SET username=EXCLUDED.username, identity_type=EXCLUDED.identity_type,
        first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name, gender=EXCLUDED.gender, age_range=EXCLUDED.age_range,
        job_title=EXCLUDED.job_title, custom_job_title=EXCLUDED.custom_job_title, industry=EXCLUDED.industry,
        custom_industry=EXCLUDED.custom_industry, phone_number=EXCLUDED.phone_number, phone_verified_at=EXCLUDED.phone_verified_at,
        sms_notifications_enabled=EXCLUDED.sms_notifications_enabled, updated_at=NOW()`,
      [session.user!.id, username, value.identityType, value.firstName, value.lastName, value.gender, value.ageRange,
        value.jobTitle, value.customJobTitle || null, value.industry, value.customIndustry || null, phoneNumber, phoneVerifiedAt, smsEnabled],
    );

    if (value.identityType === "legal_entity" && value.legalEntity) {
      const legal = value.legalEntity;
      await client.query(
        `INSERT INTO user_legal_profiles (user_id, company_name, brand_name, legal_type, registration_country_code, national_id,
          industry, custom_industry, headquarters_country_code, headquarters_province, headquarters_city,
          representative_position, representative_relationship, representative_phone_number, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
         ON CONFLICT (user_id) DO UPDATE SET company_name=EXCLUDED.company_name, brand_name=EXCLUDED.brand_name,
          legal_type=EXCLUDED.legal_type, registration_country_code=EXCLUDED.registration_country_code, national_id=EXCLUDED.national_id,
          industry=EXCLUDED.industry, custom_industry=EXCLUDED.custom_industry, headquarters_country_code=EXCLUDED.headquarters_country_code,
          headquarters_province=EXCLUDED.headquarters_province, headquarters_city=EXCLUDED.headquarters_city,
          representative_position=EXCLUDED.representative_position, representative_relationship=EXCLUDED.representative_relationship,
          representative_phone_number=EXCLUDED.representative_phone_number, updated_at=NOW()`,
        [session.user!.id, legal.companyName, legal.brandName || null, legal.legalType, legal.registrationCountryCode,
          legal.nationalId || null, legal.industry, legal.customIndustry || null, legal.headquartersCountryCode,
          legal.headquartersProvince, legal.headquartersCity, legal.representativePosition,
          legal.representativeRelationship, legal.representativePhoneNumber || null],
      );
      await client.query(`DELETE FROM user_websites WHERE user_id = $1`, [session.user!.id]);
      for (const website of value.websites) {
        const url = new URL(website.url);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only HTTP and HTTPS website addresses are supported.");
        await client.query(`INSERT INTO user_websites (id, user_id, url, platform_type) VALUES ($1,$2,$3,$4)`,
          [randomUUID(), session.user!.id, url.toString().replace(/\/$/, ""), website.platformType]);
      }
    }
    return { success: true as const };
  });
}
