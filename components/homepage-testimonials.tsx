import "server-only";
/* eslint-disable @next/next/no-img-element -- approved testimonial photos may be external HTTPS URLs. */
import Link from "next/link";
import { connectToDatabase } from "@/lib/mongodb";
import { Testimonial } from "@/lib/models";
import styles from "./homepage-testimonials.module.css";

type TestimonialCard = { _id: unknown; displayName: string; university?: string; studyCountry?: string; course?: string; rating: number; text: string; photoUrl?: string };

export async function HomepageTestimonials() {
  await connectToDatabase();
  const rawRecords = await Testimonial.find({ status: "PUBLISHED", consentConfirmed: true })
    .sort({ createdAt: -1 })
    .limit(3)
    .select("displayName university studyCountry course rating text photoUrl")
    .lean();
  const records = rawRecords as unknown as TestimonialCard[];
  if (!records.length) return null;
  return <section className={styles.section} aria-labelledby="homepage-testimonials-heading"><div className={styles.intro}><p>STUDENT STORIES</p><h2 id="homepage-testimonials-heading">Real journeys. Real support.</h2><span>Students and families share how Credwisory helped them navigate education-loan options with clearer guidance.</span></div><div className={styles.grid}>{records.map((item) => { const displayName = item.displayName.trim(); const firstName = displayName.split(/\s+/)[0] || displayName; return <article className={styles.card} key={String(item._id)}>{item.photoUrl ? <img src={item.photoUrl} alt="" /> : <span className={styles.avatar} aria-hidden="true">{firstName.slice(0, 1).toUpperCase()}</span>}<div className={styles.cardBody}><span className={styles.stars} aria-label={`${item.rating} out of 5 stars`}>{"★".repeat(item.rating)}<i>{"★".repeat(5 - item.rating)}</i></span><blockquote>“{item.text}”</blockquote><strong>{firstName}</strong><p>{[item.course, item.university, item.studyCountry].filter(Boolean).join(" · ")}</p><Link href="/student-reviews-testimonials">Read story <span aria-hidden="true">→</span></Link></div></article>})}</div><div className={styles.actions}><Link className={styles.primary} href="/student-reviews-testimonials">View All Student Stories <span aria-hidden="true">→</span></Link></div></section>;
}
