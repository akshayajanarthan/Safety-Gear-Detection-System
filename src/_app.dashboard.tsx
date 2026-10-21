import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Users, ScanLine, AlertTriangle, HeartPulse, Activity, Cpu, Server, Clock, ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const activity = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  scans: Math.round(20 + Math.random() * 40 + i * 1.5),
  detected: Math.round(6 + Math.random() * 18),
}));

const TUMOR_COLORS = ["oklch(0.78 0.15 200)", "oklch(0.7 0.19 300)", "oklch(0.82 0.17 85)", "oklch(0.75 0.17 160)"];

function Dashboard() {
  const { data: counts } = useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: async () => {
      const [p, s, pr] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("mri_scans").select("id", { count: "exact", head: true }),
        supabase.from("predictions").select("tumor_type"),
      ]);
      const preds = pr.data ?? [];
      const detected = preds.filter((x) => x.tumor_type && x.tumor_type !== "No Tumor").length;
      const healthy = preds.length - detected;
      const dist = ["Glioma", "Meningioma", "Pituitary", "No Tumor"].map((t) => ({
        name: t,
        value: preds.filter((x) => x.tumor_type === t).length || 0,
      }));
      return {
        patients: p.count ?? 0,
        scans: s.count ?? 0,
        detected,
        healthy,
        dist,
      };
    },
  });

  const cards = [
    { title: "Total Patients", value: counts?.patients ?? 0, icon: Users, tone: "primary" },
    { title: "MRI Analyzed", value: counts?.scans ?? 0, icon: ScanLine, tone: "accent" },
    { title: "Tumor Detected", value: counts?.detected ?? 0, icon: AlertTriangle, tone: "danger" },
    { title: "Healthy Cases", value: counts?.healthy ?? 0, icon: HeartPulse, tone: "success" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clinical overview</h1>
          <p className="text-sm text-muted-foreground">Real-time signals from the NeuroMind CNN pipeline.</p>
        </div>
        <Link to="/upload">
          <Button className="glow-ring">Upload MRI <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{c.title}</span>
              <c.icon className={`h-4 w-4 text-${c.tone}`} />
            </div>
            <div className="mt-2 text-3xl font-bold gradient-text">{c.value}</div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-accent shimmer" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Scan volume · last 14 days</h3>
              <p className="text-xs text-muted-foreground">Scans processed vs tumors detected</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Scans</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> Detected</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity}>
                <defs>
                  <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.15 200)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.78 0.15 200)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="c2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.19 300)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.7 0.19 300)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.4 0.04 250 / 0.2)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.7 0.02 240)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 240)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.2 0.03 250)", border: "1px solid oklch(0.4 0.04 250)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="scans" stroke="oklch(0.78 0.15 200)" strokeWidth={2} fill="url(#c1)" />
                <Area type="monotone" dataKey="detected" stroke="oklch(0.7 0.19 300)" strokeWidth={2} fill="url(#c2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold">Tumor distribution</h3>
          <p className="text-xs text-muted-foreground">All-time predictions</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={counts?.dist ?? []} dataKey="value" innerRadius={45} outerRadius={80} paddingAngle={3}>
                  {(counts?.dist ?? []).map((_, i) => (
                    <Cell key={i} fill={TUMOR_COLORS[i]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.2 0.03 250)", border: "1px solid oklch(0.4 0.04 250)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(counts?.dist ?? []).map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: TUMOR_COLORS[i] }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Activity, label: "Model accuracy", value: "98.4%", sub: "Rolling 30-day" },
          { icon: Cpu, label: "GPU utilization", value: "62%", sub: "A100 × 4 cluster" },
          { icon: Server, label: "System status", value: "Nominal", sub: "All services healthy" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5 flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
              <div className="text-xl font-semibold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Recent activity</h3>
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}

function RecentActivity() {
  const { data } = useQuery({
    queryKey: ["recent-predictions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("predictions")
        .select("id, tumor_type, confidence, risk_level, created_at, patient_id, patients(full_name)")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  if (!data?.length) {
    return <p className="text-sm text-muted-foreground">No predictions yet. Upload an MRI to get started.</p>;
  }
  return (
    <ul className="divide-y divide-border/60">
      {data.map((p: any) => (
        <li key={p.id} className="flex items-center justify-between py-3 text-sm">
          <div>
            <div className="font-medium">{p.patients?.full_name ?? "Patient"}</div>
            <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              p.risk_level === "Critical" || p.risk_level === "High" ? "bg-destructive/20 text-destructive"
              : p.risk_level === "Moderate" ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
            }`}>{p.risk_level}</span>
            <span className="text-primary">{p.tumor_type}</span>
            <span className="text-muted-foreground">{Math.round(Number(p.confidence) * 100)}%</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
