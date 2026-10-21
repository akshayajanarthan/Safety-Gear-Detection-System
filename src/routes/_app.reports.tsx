import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("predictions")
        .select("id, tumor_type, confidence, risk_level, affected_region, observation, reasoning, symptoms, recommended_tests, treatments, probabilities, created_at, patients(full_name, age, gender), mri_scans(image_url)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const downloadPdf = (r: any) => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pw = doc.internal.pageSize.getWidth();
      let y = 40;

      doc.setFillColor(20, 30, 50);
      doc.rect(0, 0, pw, 80, "F");
      doc.setTextColor(180, 220, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("NeuroMind AI — Clinical Report", 40, 45);
      doc.setFontSize(9);
      doc.setTextColor(150, 180, 210);
      doc.text(`Model: NeuroMind-CNN v3.2   ·   Generated: ${new Date().toLocaleString()}`, 40, 62);

      y = 110;
      doc.setTextColor(20, 30, 50);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Patient", 40, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${r.patients?.full_name ?? "—"}   ·   ${r.patients?.age ?? "?"} y   ·   ${r.patients?.gender ?? "—"}`, 100, y);
      y += 22;

      doc.setFont("helvetica", "bold");
      doc.text("Diagnosis", 40, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${r.tumor_type}   ·   ${Math.round(Number(r.confidence) * 100)}% confidence   ·   ${r.risk_level} risk`, 100, y);
      y += 22;

      doc.setFont("helvetica", "bold");
      doc.text("Region", 40, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${r.affected_region ?? "—"}`, 100, y);
      y += 30;

      const section = (title: string, body: string | string[]) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(30, 60, 120);
        doc.text(title, 40, y);
        y += 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(20, 30, 50);
        const text = Array.isArray(body) ? body.map((b) => `• ${b}`).join("\n") : body ?? "";
        const lines = doc.splitTextToSize(text || "—", pw - 80);
        doc.text(lines, 40, y);
        y += lines.length * 12 + 12;
      };

      section("Observation", r.observation ?? "");
      section("Reasoning", r.reasoning ?? "");
      section("Symptoms", r.symptoms ?? []);
      section("Recommended tests", r.recommended_tests ?? []);
      section("Treatments", r.treatments ?? []);

      const p = r.probabilities ?? {};
      section("Probability breakdown",
        `Glioma: ${Math.round((p.Glioma ?? 0) * 100)}%   Meningioma: ${Math.round((p.Meningioma ?? 0) * 100)}%   Pituitary: ${Math.round((p.Pituitary ?? 0) * 100)}%   Healthy: ${Math.round((p.NoTumor ?? 0) * 100)}%`);

      y = doc.internal.pageSize.getHeight() - 40;
      doc.setFontSize(8);
      doc.setTextColor(120, 130, 150);
      doc.text("Decision-support output. Requires clinician review. NeuroMind AI © " + new Date().getFullYear(), 40, y);

      doc.save(`NeuroMind-Report-${r.patients?.full_name?.replace(/\s+/g, "_") ?? "patient"}-${r.id.slice(0, 8)}.pdf`);
    } catch (e: any) {
      toast.error(e.message ?? "Could not generate PDF");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Every prediction generates a signed clinical report.</p>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Diagnosis</th>
              <th className="px-5 py-3">Confidence</th>
              <th className="px-5 py-3">Risk</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {(data ?? []).map((r: any) => (
              <tr key={r.id} className="hover:bg-muted/20">
                <td className="px-5 py-3 font-medium">{r.patients?.full_name}</td>
                <td className="px-5 py-3 text-primary">{r.tumor_type}</td>
                <td className="px-5 py-3">{Math.round(Number(r.confidence) * 100)}%</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    r.risk_level === "Critical" || r.risk_level === "High" ? "bg-destructive/20 text-destructive"
                    : r.risk_level === "Moderate" ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
                  }`}>{r.risk_level}</span>
                </td>
                <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-5 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => downloadPdf(r)}>
                    <Download className="mr-2 h-4 w-4" /> PDF
                  </Button>
                </td>
              </tr>
            ))}
            {!data?.length && (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-muted-foreground">
                No reports yet — run an <Link to="/upload" className="text-primary">MRI analysis</Link> to generate one.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
