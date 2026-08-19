import { createServerSupabaseClient } from "@/utils/supabase/server";
import { ProfileSettingsView } from "@/components/profile-settings-view";
import { redirect } from "next/navigation";

export default async function ProfileSettingsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "";

  return (
    <ProfileSettingsView
      initialFullName={fullName}
      userEmail={user.email || ""}
    />
  );
}
