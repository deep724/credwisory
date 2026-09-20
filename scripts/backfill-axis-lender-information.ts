import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ quiet: true });

const sources = [
  { title: "Axis Bank Education Loan product guide", url: "https://www.axisbank.com/docs/default-source/downloadforms-productguide/education-loan.pdf?sfvrsn=4" },
  { title: "Axis Bank Education Loan application form", url: "https://www.axisbank.com/docs/default-source/download-document/personal/loans/education-loan-application-form-feb-2023.pdf" },
  { title: "Axis Bank Education Loan leaflet", url: "https://www.axisbank.com/docs/default-source/ebrochures/education_loan_generic_leaflet.pdf" },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(uri);
  const lenders = mongoose.connection.collection("lenders");
  await lenders.updateOne({ slug: "axis-bank" }, { $set: {
    description: "Financial assistance for higher education in India and abroad.",
    collateralAvailable: false,
    nonCollateralAvailable: true,
    processingFee: "Up to 2% of the loan amount plus applicable GST",
    tenure: "Up to 15 years",
    eligibility: "Indian citizen\nMinimum qualification: 10+2 with at least 50% marks\nA co-applicant may be a parent, sibling, or guardian; regular-income documents are mandatory for the co-applicant.",
    documents: "KYC documents of the applicant and co-applicant\nFinancial documents of the co-applicant\nAdmission letter and fee schedule from the institute or university\nPast educational documents\nEntrance-exam score / marks, where applicable for Indian or overseas institutions",
    comparison: { secured: "Information will be updated soon", unsecured: "Up to ₹40 lakh for Prime Colleges", securedRate: "Information will be updated soon", unsecuredRate: "Information will be updated soon", moratorium: "Information will be updated soon", tenure: "Up to 15 years", foreclosure: "Nil", fee: "Up to 2% of the loan amount plus applicable GST" },
    infoSections: {
      unsecuredFeatures: "Axis Bank states that unsecured funding is available up to ₹40 lakh for Prime Colleges. Other product conditions should be confirmed with Axis Bank before applying.",
      otherCharges: "Applicable charges disclosed in the education-loan application form include instrument-swap, duplicate-statement, duplicate-amortisation-schedule, duplicate-interest-certificate, document-copy, return, stamp-duty, and conversion charges. Applicable GST may apply.",
      benefits: "Application guidance\nDocument-checklist support\nLender comparison based on your profile\nApplication status tracking and counsellor assistance",
    },
    contentStatus: "PUBLISHED",
    contentVerifiedAt: new Date("2026-09-20T00:00:00.000Z"),
    contentSources: sources,
  }, $unset: { maxLoan: "", securedRate: "", unsecuredRate: "" } });
}

main().finally(() => mongoose.disconnect());
