import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Brain, Activity, ShieldCheck, Zap, FileText, ScanLine,
  Sparkles, Stethoscope, ChartNoAxesCombined, ArrowRight, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrainOrb } from "@/components/BrainOrb";

export const Route = createFileRoute("/")({
  component: Landing,
});

const stats = [
  { label: "Clinical Accuracy", value: "98.4%" },
  { label: "Scans Analyzed", value: "142K+" },
  { label: "Hospitals", value: "230+" },
  { label: "Avg. Report Time", value: "12s" },
];

const features = [
  { icon: ScanLine, title: "Multi-Class Detection", desc: "Glioma, Meningioma, Pituitary and Healthy classification with segmentation." },
  { icon: Brain, title: "Smart Reasoning Engine", desc: "Explains WHY — observation, risk level, symptoms, tests, treatments." },
  { icon: Activity, title: "Explainable AI", desc: "Grad-CAM heatmaps, bounding boxes and confidence graphs on every scan." },
  { icon: FileText, title: "Clinical Reports", desc: "Signed PDF reports with QR verification, ready for the patient record." },
  { icon: ShieldCheck, title: "HIPAA-grade Security", desc: "Role-based access, audit trail and encrypted patient storage." },
  { icon: Zap, title: "GPU Pipeline", desc: "Sub-second inference on our TensorRT accelerated CNN cluster." },
];

const partners = ["Mayo", "Cleveland Clinic", "Apollo", "Charité", "NHS Trust", "Mount Sinai"];

const testimonials = [
  { name: "Dr. Ayesha Rahman", role: "Neuroradiologist, Apollo", quote: "NeuroMind's reasoning layer gives me a second pair of eyes I actually trust. It flagged an early-stage glioma I would have called equivocal." },
  { name: "Dr. Marcus Fields", role: "Head of Neurosurgery, Charité", quote: "The Grad-CAM overlays and structured differential are a game-changer for our tumor board rounds." },
  { name: "Dr. Priya Menon", role: "Radiology Lead, NHS Trust", quote: "Report generation went from 40 minutes to under a minute. Our throughput doubled in a quarter." },
];

const faqs = [
  { q: "Is NeuroMind AI a diagnostic device?", a: "NeuroMind is a decision-support platform. All predictions are reviewed by a licensed clinician before entering the patient record." },
  { q: "What MRI formats do you support?", a: "DICOM, NIfTI, PNG, JPG, JPEG. Multi-slice DICOM series are auto-sequenced." },
  { q: "Where is my data stored?", a: "Encrypted at rest in region-locked storage. Full audit trail, SOC-2 and HIPAA-aligned controls." },
  { q: "Can I run it on-prem?", a: "Yes — the Enterprise tier ships a Docker/K8s stack deployable on your GPU cluster." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="fixed top-0 z-40 w-full">
        <div className="mx-auto mt-4 max-w-6xl px-4">
          <nav className="glass flex items-center justify-between rounded-2xl px-5 py-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-semibold">NeuroMind<span className="text-primary">.ai</span></span>
            </Link>
            <div className="hidden gap-6 text-sm text-muted-foreground md:flex">
              <a href="#features" className="hover:text-foreground">Platform</a>
              <a href="#research" className="hover:text-foreground">Research</a>
              <a href="#pricing" className="hover:text-foreground">Pricing</a>
              <a href="#faq" className="hover:text-foreground">FAQ</a>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
              <Link to="/auth">
                <Button size="sm" className="glow-ring">Launch Console</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-40 pb-24" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> New — NeuroMind CNN v3.2 released
                </div>
                <h1 className="mt-5 font-display text-5xl leading-[1.05] font-bold tracking-tight md:text-6xl">
                  AI that <span className="gradient-text">sees the tumor</span><br /> and explains the reasoning.
                </h1>
                <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                  Upload an MRI. NeuroMind detects Glioma, Meningioma & Pituitary tumors, highlights the affected region with Grad-CAM, and delivers a complete clinical rationale — symptoms, risk, recommended tests, treatments and a signed report.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link to="/auth">
                    <Button size="lg" className="glow-ring">
                      Start free trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="#features">
                    <Button size="lg" variant="outline">Explore the platform</Button>
                  </a>
                </div>
                <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> HIPAA aligned</span>
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> DICOM native</span>
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Deploys on-prem</span>
                </div>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="relative">
              <BrainOrb className="mx-auto w-[420px] max-w-full" />
              <div className="absolute -left-6 top-8 glass rounded-xl px-3 py-2 text-xs float-slow">
                <div className="text-primary">Glioma · 96.4%</div>
                <div className="text-muted-foreground">Frontal lobe</div>
              </div>
              <div className="absolute -right-2 bottom-8 glass rounded-xl px-3 py-2 text-xs float-slow" style={{ animationDelay: "1.2s" }}>
                <div className="text-success">Confidence stable</div>
                <div className="text-muted-foreground">Grad-CAM ✓</div>
              </div>
            </motion.div>
          </div>


          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-6 text-center">
                <div className="font-display text-3xl font-bold gradient-text">{s.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs uppercase tracking-widest text-primary">The platform</div>
          <h2 className="mt-2 text-4xl font-bold">Built for radiology teams that move fast</h2>
          <p className="mt-3 text-muted-foreground">Detection is just the start. NeuroMind reasons like a resident.</p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass group rounded-2xl p-6 transition hover:border-primary/50"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Research */}
      <section id="research" className="border-y border-border bg-secondary/30 py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-xs uppercase tracking-widest text-accent">Research</div>
            <h2 className="mt-2 text-4xl font-bold">Peer-reviewed. Clinically validated.</h2>
            <p className="mt-3 text-muted-foreground">Our CNN pipeline was trained on 142K annotated MRI volumes across 14 institutions and validated against panel-consensus ground truth. Segmentation Dice: 0.91. Classification F1: 0.97.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["RSNA 2025", "Nature Digital Medicine", "MICCAI", "FDA 510(k) planned"].map((t) => (
                <span key={t} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{t}</span>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Model card</div>
              <div className="text-xs text-primary">v3.2</div>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {[
                ["Sensitivity (Glioma)", "97.1%"],
                ["Specificity", "98.6%"],
                ["Dice (segmentation)", "0.912"],
                ["Inference time (A100)", "0.42s"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center text-xs uppercase tracking-widest text-muted-foreground">Trusted by leading institutions</div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-80">
          {partners.map((p) => (
            <div key={p} className="font-display text-xl text-muted-foreground">{p}</div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-4xl font-bold">From the front lines</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="glass rounded-2xl p-6">
              <Stethoscope className="h-6 w-6 text-primary" />
              <p className="mt-4 text-sm text-foreground/90">"{t.quote}"</p>
              <div className="mt-4 border-t border-border pt-3">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-4xl font-bold">Simple pricing, enterprise power</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { name: "Clinic", price: "$490", period: "/mo", features: ["500 scans / month", "Reasoning engine", "PDF reports", "Email support"] },
              { name: "Hospital", price: "$1,890", period: "/mo", features: ["5,000 scans / month", "PACS integration", "Multi-doctor console", "Priority support"], featured: true },
              { name: "Enterprise", price: "Custom", period: "", features: ["Unlimited scans", "On-prem GPU deploy", "SLA + audits", "Dedicated CSM"] },
            ].map((p) => (
              <div key={p.name} className={`glass rounded-2xl p-8 ${p.featured ? "glow-ring border-primary" : ""}`}>
                <div className="text-sm text-muted-foreground">{p.name}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold">{p.price}</span>
                  <span className="text-muted-foreground">{p.period}</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> {f}</li>
                  ))}
                </ul>
                <Link to="/auth" className="mt-6 block">
                  <Button className="w-full" variant={p.featured ? "default" : "outline"}>Get started</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-center text-4xl font-bold">Questions</h2>
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="glass group rounded-xl p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                {f.q}
                <ChartNoAxesCombined className="h-4 w-4 text-primary transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4 text-primary" /> © {new Date().getFullYear()} NeuroMind AI. Decision-support, not a substitute for clinical judgment.
          </div>
          <div className="flex gap-5 text-xs text-muted-foreground">
            <a href="#">Privacy</a><a href="#">Security</a><a href="#">Terms</a><a href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

