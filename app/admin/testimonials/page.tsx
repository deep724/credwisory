import { AdminShell } from "@/components/admin-shell";
import { TestimonialManager } from "@/components/testimonial-manager";
import { requireRole } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Testimonial } from "@/lib/models";
export default async function TestimonialsPage(){const admin=await requireRole("SUPER_ADMIN");await connectToDatabase();const rows=await Testimonial.find().sort({updatedAt:-1}).lean() as Array<any>;const role=admin.roleId as unknown as {name?:string}|null;const initial=rows.map(row=>({id:String(row._id),displayName:row.displayName,university:row.university,studyCountry:row.studyCountry,course:row.course,rating:row.rating,text:row.text,photoUrl:row.photoUrl,videoUrl:row.videoUrl,consentConfirmed:row.consentConfirmed,status:row.status}));return <AdminShell name={admin.name} role={role?.name||"Super Admin"}><TestimonialManager initial={initial}/></AdminShell>}
