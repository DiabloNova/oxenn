import { describe, it, expect } from "vitest";
import { PLANS } from "@/features/billing/domain/plans";

describe("Subscription Architecture tests", () => {
    it("Plan definitions validated", () => {
        expect(PLANS["free"].id).toBe("free");
        expect(PLANS["professional"].id).toBe("professional");
        expect(PLANS["enterprise"].entitlements.maxProjects).toBe("unlimited");
        expect(PLANS["free"].quotas.maxUsers).toBe(1);
    });
});
