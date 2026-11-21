import { BrandProfileForm } from "@/components/features/dashboard/BrandProfileForm";
import { UserIdentityForm } from "@/components/features/dashboard/UserIdentityForm";
import { getUserIdentityProfileAction } from "@/app/actions/user-identity";

export default async function YourBrandPage() {
  const identityData = await getUserIdentityProfileAction();
  return <div className="space-y-8"><UserIdentityForm initialData={identityData} /><BrandProfileForm /></div>;
}
