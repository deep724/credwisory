import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StudentTestimonialsSection } from "@/components/student-testimonials-section";

export default function StudentReviewsTestimonialsPage() {
  return <><SiteHeader /><main><header style={{ padding: "62px 16px 10px", textAlign: "center", color: "#102a52", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}><p style={{ margin: "0 0 8px", color: "#08786e", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", fontSize: 12 }}>Credwisory community</p><h1 style={{ margin: 0, fontSize: "clamp(32px, 5vw, 52px)" }}>Student Reviews &amp; Testimonials</h1><p style={{ maxWidth: 620, margin: "14px auto 0", color: "#5e738f", lineHeight: 1.6 }}>Hear from students and families who have explored education-loan guidance with Credwisory.</p></header><StudentTestimonialsSection /></main><SiteFooter /></>;
}
