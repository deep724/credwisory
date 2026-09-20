import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Testimonial } from "@/lib/models";
export const dynamic="force-dynamic";
export async function GET(){try{await connectToDatabase();const items=await Testimonial.find({status:"PUBLISHED",consentConfirmed:true}).sort({createdAt:-1}).select("displayName university studyCountry course rating text photoUrl videoUrl").lean();return NextResponse.json({testimonials:items.map((x:any)=>({id:String(x._id),displayName:x.displayName,university:x.university,studyCountry:x.studyCountry,course:x.course,rating:x.rating,text:x.text,photoUrl:x.photoUrl,videoUrl:x.videoUrl}))},{headers:{"Cache-Control":"no-store"}})}catch{return NextResponse.json({testimonials:[]},{status:503})}}
