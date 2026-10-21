import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/patients")({
  component: PatientsPage,
});

function PatientsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [form, setForm] = useState({
    full_name: "", age: "", gender: "male", blood_group: "",
    height_cm: "", weight_kg: "", diabetes: false, hypertension: false,
    previous_tumor: false, surgeries: "", medications: "", family_history: "", notes: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        created_by: user!.id,
        full_name: form.full_name,
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        blood_group: form.blood_group || null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        diabetes: form.diabetes,
        hypertension: form.hypertension,
        previous_tumor: form.previous_tumor,
        surgeries: form.surgeries || null,
        medications: form.medications || null,
        family_history: form.family_history || null,
        notes: form.notes || null,
      };
      const { error } = await supabase.from("patients").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Patient added");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["patients"] });
      setForm({ ...form, full_name: "", age: "", surgeries: "", medications: "", family_history: "", notes: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Patients</h1>
          <p className="text-sm text-muted-foreground">Registered patients with demographics and medical history.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="glow-ring"><Plus className="mr-2 h-4 w-4" /> New patient</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Register new patient</DialogTitle></DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
              <Field label="Age"><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Field>
              <Field label="Gender">
                <select className="h-10 w-full rounded-md border border-input bg-input px-3 text-sm"
                  value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                </select>
              </Field>
              <Field label="Blood group"><Input value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} /></Field>
              <Field label="Height (cm)"><Input type="number" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} /></Field>
              <Field label="Weight (kg)"><Input type="number" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} /></Field>
              <div className="md:col-span-2 grid grid-cols-3 gap-3">
                <Toggle label="Diabetes" checked={form.diabetes} onChange={(v) => setForm({ ...form, diabetes: v })} />
                <Toggle label="Hypertension" checked={form.hypertension} onChange={(v) => setForm({ ...form, hypertension: v })} />
                <Toggle label="Previous tumor" checked={form.previous_tumor} onChange={(v) => setForm({ ...form, previous_tumor: v })} />
              </div>
              <Field label="Surgeries" className="md:col-span-2"><Textarea rows={2} value={form.surgeries} onChange={(e) => setForm({ ...form, surgeries: e.target.value })} /></Field>
              <Field label="Medications" className="md:col-span-2"><Textarea rows={2} value={form.medications} onChange={(e) => setForm({ ...form, medications: e.target.value })} /></Field>
              <Field label="Family history" className="md:col-span-2"><Textarea rows={2} value={form.family_history} onChange={(e) => setForm({ ...form, family_history: e.target.value })} /></Field>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!form.full_name || create.isPending}>Save patient</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Age</th>
              <th className="px-5 py-3">Gender</th>
              <th className="px-5 py-3">History</th>
              <th className="px-5 py-3">Registered</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {(patients ?? []).map((p: any) => (
              <tr key={p.id} className="hover:bg-muted/20">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{p.full_name}</div>
                      <div className="text-xs text-muted-foreground">{p.blood_group ?? "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">{p.age ?? "—"}</td>
                <td className="px-5 py-3 capitalize">{p.gender ?? "—"}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.diabetes && <Chip>Diabetes</Chip>}
                    {p.hypertension && <Chip>HTN</Chip>}
                    {p.previous_tumor && <Chip tone="danger">Prev. tumor</Chip>}
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-right">
                  <Link to="/upload" search={{ patientId: p.id } as any}>
                    <Button size="sm" variant="outline">Upload MRI</Button>
                  </Link>
                </td>
              </tr>
            ))}
            {!patients?.length && (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-muted-foreground">
                No patients yet — click <span className="text-primary">New patient</span> to register the first one.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: any) {
  return (
    <div className={className}>
      <Label className="mb-1 block">{label}</Label>
      {children}
    </div>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-border bg-input/40 px-3 py-2 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function Chip({ children, tone = "primary" }: { children: React.ReactNode; tone?: "primary" | "danger" }) {
  const cls = tone === "danger" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] ${cls}`}>{children}</span>;
}
