import { AdminShell } from "@/components/admin-shell";
import { ReferralLeadsManager } from "@/components/referral-leads-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ReferralLead } from "@/lib/models";
const statuses=["NEW","CONTACTED","IN_PROGRESS","CONVERTED","REJECTED"];
export default async function Referrals({searchParams}:{searchParams:Promise<{status?:string;q?:string}>}) {
  const admin=await requireAdmin();
  const q=await searchParams;
  await connectToDatabase();
  const filter:Record<string,unknown>={};
  if(q.status&&statuses.includes(q.status)) filter.status=q.status;
  if(q.q) {
    const e=q.q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    filter.$or=[{referrerName:{$regex:e,$options:"i"}},{referredName:{$regex:e,$options:"i"}},{referredPhone:{$regex:e}}];
  }
  const leads=await ReferralLead.find(filter).sort({createdAt:-1}).lean() as unknown as Array<{_id:unknown;referrerName:string;referrerPhone:string;referredName:string;referredPhone:string;code:string;status:string;createdAt:Date}>;
  const role=admin.roleId as unknown as {name?:string;key?:string}|null;
  const referrals=leads.map((lead)=>({
    id:String(lead._id), referrerName:lead.referrerName, referrerPhone:lead.referrerPhone,
    referredName:lead.referredName, referredPhone:lead.referredPhone, code:lead.code,
    status:lead.status, createdAt:lead.createdAt.toISOString(),
  }));
  return <AdminShell name={admin.name} role={role?.name||"Admin"}>
    <ReferralLeadsManager leads={referrals} query={{q:q.q||"",status:q.status||""}} canDelete={role?.key==="SUPER_ADMIN"}/>
  </AdminShell>;
}
