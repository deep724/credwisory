import { AdminShell } from "@/components/admin-shell";
import { LenderManager } from "@/components/lender-manager";
import { requireRole } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Lender } from "@/lib/models";

export default async function Lenders() {
  const admin = await requireRole("SUPER_ADMIN"); await connectToDatabase();
  const lenders = (await Lender.find().sort({ displayOrder: 1 }).lean()).map((lender) => JSON.parse(JSON.stringify(lender)));
  const role = admin.roleId as unknown as { name?: string } | null;
  return <AdminShell name={admin.name} role={role?.name || "Admin"}><h1>Lender management</h1><LenderManager lenders={lenders}/></AdminShell>;
}
