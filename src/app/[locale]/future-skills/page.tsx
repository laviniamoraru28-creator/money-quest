import LearningLabExperience from "@/components/LearningLabExperience";
import {getLearningLab} from "@/content/learning-labs";
import {publicLaboratoryPresentation} from "@/lib/i18n/laboratory-presentation";
import {learningMetadata} from "@/lib/seo/learning-metadata";
const lab=getLearningLab("future-skills")!;
export const metadata=learningMetadata(lab.title,lab.description,"/future-skills","sections/future-skills.webp");
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 return <LearningLabExperience {...publicLaboratoryPresentation(lab,locale)}/>;
}
