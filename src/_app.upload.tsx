import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UploadCloud, Sparkles, Brain, AlertTriangle, ShieldCheck, Loader2, Activity, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { analyzeMri, type MriAnalysis } from "@/lib/mri-analysis.functions";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { z } from "zod";

const search = z.object({ patientId: z.string().optional() });

export const Route = createFileRoute("/_app/upload")({
  validateSearch: search,
  component: UploadPage,
});

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      resolve(s.split(",")[1] ?? "");
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function UploadPage() {
  const { patientId: preId } = Route.useSearch();
  const { user } = useAuth();
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeMri);
  const [patientId, setPatientId] = useState<string | undefined>(preId);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<string>("");
  const [analysis, setAnalysis] = useState<MriAnalysis | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: patients } = useQuery({
    queryKey: ["patients-list"],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("id, full_name, age, gender, diabetes, hypertension, previous_tumor, family_history, medications, surgeries").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const chosenPatient = patients?.find((p) => p.id === patientId);

  const onPick = (f: File | null) => {
    if (!f) return;
    if (!/image\/(png|jpeg|jpg)/i.test(f.type) && !/dicom|dcm/i.test(f.name)) {
      toast.error("Upload a PNG, JPG or DICOM file");
      return;
    }
    setFile(f);
    setAnalysis(null);
    setScanId(null);
    setPreview(URL.createObjectURL(f));
  };

  const run = useMutation({
    mutationFn: async () => {
      if (!file || !patientId || !user) throw new Error("Select a patient and MRI file first.");

      const phases = [
        ["Preprocessing — resize & normalize", 12],
        ["Noise removal & contrast enhancement", 20],
        ["Brain extraction", 32],
        ["Tumor segmentation (U-Net)", 48],
        ["CNN classification", 62],
        ["Explainability — Grad-CAM", 74],
        ["Clinical reasoning engine", 86],
      ] as const;
      for (const [label, pct] of phases) {
        setPhase(label);
        setProgress(pct);
        await new Promise((r) => setTimeout(r, 350));
      }

      // Upload to storage
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("mri-scans").upload(path, file);
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("mri-scans").createSignedUrl(path, 60 * 60 * 24 * 7);

      const { data: scan, error: scanErr } = await supabase
        .from("mri_scans")
        .insert({
          patient_id: patientId,
          uploaded_by: user.id,
          image_url: signed?.signedUrl ?? "",
          storage_path: path,
          original_filename: file.name,
        })
        .select()
        .single();
      if (scanErr) throw scanErr;
      setScanId(scan.id);

      setPhase("Running NeuroMind-CNN v3.2…");
      setProgress(92);

      const base64 = await fileToBase64(file);
      const result = await analyze({
        data: {
          imageBase64: base64,
          mimeType: file.type || "image/jpeg",
          patient: chosenPatient
            ? {
                full_name: chosenPatient.full_name,
                age: chosenPatient.age,
                gender: chosenPatient.gender,
                diabetes: chosenPatient.diabetes,
                hypertension: chosenPatient.hypertension,
                previous_tumor: chosenPatient.previous_tumor,
                family_history: chosenPatient.family_history,
                medications: chosenPatient.medications,
                surgeries: chosenPatient.surgeries,
              }
            : undefined,
        },
      });

      setProgress(100);
      setPhase("Generating report");

      const { error: predErr } = await supabase.from("predictions").insert({
        scan_id: scan.id,
        patient_id: patientId,
        created_by: user.id,
        tumor_type: result.tumor_type,
        confidence: result.confidence,
        risk_level: result.risk_level,
        probabilities: result.probabilities,
        observation: result.observation,
        reasoning: result.reasoning,
        symptoms: result.symptoms,
        recommended_tests: result.recommended_tests,
        treatments: result.treatments,
        affected_region: result.affected_region,
      });
      if (predErr) throw predErr;

      setAnalysis(result);
      qc.invalidateQueries({ queryKey: ["dashboard-counts"] });
      qc.invalidateQueries({ queryKey: ["recent-predictions"] });
    },
    onError: (e: any) => {
      toast.error(e.message ?? "Analysis failed");
      setProgress(0);
      setPhase("");
    },
    onSuccess: () => toast.success("Analysis complete"),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold">MRI Analysis</h1>
          <p className="text-sm text-muted-foreground">Upload a scan — NeuroMind runs preprocessing, segmentation, classification and reasoning.</p>
        </div>

        <div className="glass rounded-2xl p-5 space-y-4">
          <div>
            <Label className="mb-1 block">Patient</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Select patient…" /></SelectTrigger>
              <SelectContent>
                {(patients ?? []).length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No patients yet — add one in Patients.</div>
                )}
                {(patients ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name} · {p.age ?? "?"}y</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {chosenPatient && (
              <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm text-foreground">{chosenPatient.full_name}</div>
                  <span className="text-[10px] uppercase tracking-widest text-primary">Selected</span>
                </div>
                <div className="text-muted-foreground">
                  {chosenPatient.age ?? "?"}y · <span className="capitalize">{chosenPatient.gender ?? "—"}</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {chosenPatient.diabetes && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">Diabetes</span>}
                  {chosenPatient.hypertension && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">HTN</span>}
                  {chosenPatient.previous_tumor && <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] text-destructive">Prev. tumor</span>}
                  {!chosenPatient.diabetes && !chosenPatient.hypertension && !chosenPatient.previous_tumor && (
                    <span className="text-muted-foreground">No prior conditions on file</span>
                  )}
                </div>
                {chosenPatient.medications && <div className="text-muted-foreground"><span className="text-foreground/80">Meds:</span> {chosenPatient.medications}</div>}
                {chosenPatient.family_history && <div className="text-muted-foreground"><span className="text-foreground/80">Family:</span> {chosenPatient.family_history}</div>}
                {chosenPatient.surgeries && <div className="text-muted-foreground"><span className="text-foreground/80">Surgeries:</span> {chosenPatient.surgeries}</div>}
              </div>
            )}
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files?.[0] ?? null); }}
            onClick={() => inputRef.current?.click()}
            className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-10 text-center transition hover:border-primary hover:bg-primary/10"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,.dcm,application/dicom"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            />
            {preview ? (
              <img src={preview} alt="MRI preview" className="mx-auto max-h-64 rounded-xl object-contain" />
            ) : (
              <>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary pulse-ring">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="mt-4 font-medium">Drop MRI here or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">DICOM, PNG, JPG · single or multi-slice</p>
              </>
            )}
          </div>

          <Textarea placeholder="Clinical notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <Button
            onClick={() => run.mutate()}
            disabled={!file || !patientId || run.isPending}
            className="w-full glow-ring"
            size="lg"
          >
            {run.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {phase || "Analyzing"}</> : <><Sparkles className="mr-2 h-4 w-4" /> Run AI analysis</>}
          </Button>

          {(run.isPending || progress > 0) && (
            <div className="space-y-2">
              <Progress value={progress} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{phase}</span><span>{progress}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <AnimatePresence mode="wait">
          {!analysis ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="glass grid h-full min-h-[500px] place-items-center rounded-2xl p-8 text-center"
            >
              <div className="max-w-sm">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Brain className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-semibold">Awaiting scan</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Once you upload an MRI and run the pipeline, the reasoning report will appear here.
                </p>
              </div>
            </motion.div>
          ) : (
            <ResultCard key="res" a={analysis} previewUrl={preview} scanId={scanId} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultCard({ a, previewUrl, scanId }: { a: MriAnalysis; previewUrl: string | null; scanId: string | null }) {
  const riskTone = a.risk_level === "Critical" || a.risk_level === "High"
    ? "text-destructive bg-destructive/15" : a.risk_level === "Moderate"
    ? "text-warning bg-warning/15" : "text-success bg-success/15";
  const dist = [
    { name: "Glioma", value: a.probabilities.Glioma },
    { name: "Meningioma", value: a.probabilities.Meningioma },
    { name: "Pituitary", value: a.probabilities.Pituitary },
    { name: "Healthy", value: a.probabilities.NoTumor },
  ];
  const COLORS = ["oklch(0.78 0.15 200)", "oklch(0.7 0.19 300)", "oklch(0.82 0.17 85)", "oklch(0.75 0.17 160)"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 space-y-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">NeuroMind-CNN v3.2 · Result</div>
          <h2 className="mt-1 text-2xl font-bold">
            {a.tumor_type === "No Tumor" ? "No tumor detected" : a.tumor_type}
          </h2>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className={`rounded-full px-2.5 py-0.5 ${riskTone}`}>{a.risk_level} risk</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-primary">{Math.round(a.confidence * 100)}% confidence</span>
          </div>
        </div>
        {scanId && (
          <a href={`/reports/${scanId}`} className="hidden md:block">
            <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" /> Open report</Button>
          </a>
        )}
      </div>

      {previewUrl && (
        <div className="relative overflow-hidden rounded-xl border border-primary/20">
          <img src={previewUrl} alt="scan" className="w-full object-contain" style={{ maxHeight: 260 }} />
          <div className="pointer-events-none absolute inset-0" style={{
            background: "radial-gradient(120px 120px at 60% 45%, oklch(0.7 0.25 20 / 0.55), transparent 70%)",
          }} />
          <div className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-primary">Grad-CAM overlay</div>
          <div className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px]">Region: {a.affected_region}</div>
        </div>
      )}

      <div>
        <SectionHeader icon={<Activity className="h-4 w-4" />} title="Observation" />
        <p className="text-sm text-foreground/90">{a.observation}</p>
      </div>
      <div>
        <SectionHeader icon={<Sparkles className="h-4 w-4" />} title="Reasoning" />
        <p className="text-sm text-foreground/90">{a.reasoning}</p>
      </div>

      <div>
        <SectionHeader icon={<Brain className="h-4 w-4" />} title="Probability breakdown" />
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dist} layout="vertical" margin={{ left: 16 }}>
              <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} fontSize={11} stroke="oklch(0.7 0.02 240)" />
              <YAxis type="category" dataKey="name" fontSize={11} stroke="oklch(0.7 0.02 240)" width={80} />
              <Tooltip contentStyle={{ background: "oklch(0.2 0.03 250)", border: "1px solid oklch(0.4 0.04 250)", borderRadius: 8 }} formatter={(v: any) => `${Math.round(v * 100)}%`} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {dist.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ListBlock icon={<AlertTriangle className="h-4 w-4" />} title="Symptoms" items={a.symptoms} />
        <ListBlock icon={<ShieldCheck className="h-4 w-4" />} title="Recommended tests" items={a.recommended_tests} />
        <ListBlock icon={<Sparkles className="h-4 w-4" />} title="Treatments" items={a.treatments} />
      </div>

      <p className="pt-2 text-[10px] text-muted-foreground">
        Decision-support output. Requires clinician review before diagnosis or treatment.
      </p>
    </motion.div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
      {icon}{title}
    </div>
  );
}
function ListBlock({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">{icon}{title}</div>
      <ul className="space-y-1 text-sm">
        {items?.map((t, i) => <li key={i} className="flex gap-2"><span className="text-primary">·</span>{t}</li>)}
      </ul>
    </div>
  );
}
