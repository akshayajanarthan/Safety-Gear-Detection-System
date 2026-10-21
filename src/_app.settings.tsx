import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, role } = useAuth();
  const [hospital, setHospital] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [dark, setDark] = useState(true);
  const save = async () => {
    const { error } = await supabase.from("profiles").update({ hospital, specialty }).eq("id", user!.id);
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
  };
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, hospital and system preferences.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
          <div><Label>Role</Label><Input value={role ?? ""} disabled className="capitalize" /></div>
          <div><Label>Hospital</Label><Input value={hospital} onChange={(e) => setHospital(e.target.value)} /></div>
          <div><Label>Specialty</Label><Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} /></div>
        </div>
        <Button onClick={save}><Save className="mr-2 h-4 w-4" /> Save profile</Button>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">System</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Row label="Active model" value="NeuroMind-CNN v3.2" />
          <Row label="GPU cluster" value="4 × NVIDIA A100" />
          <Row label="Storage region" value="US-East (encrypted)" />
          <Row label="Audit trail" value="Enabled" />
        </div>
        <label className="flex items-center justify-between rounded-lg border border-border bg-input/40 px-3 py-2 text-sm">
          <span>Dark theme</span><Switch checked={dark} onCheckedChange={setDark} />
        </label>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
