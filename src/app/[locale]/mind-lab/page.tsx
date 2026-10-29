import LearningLabExperience from "@/components/LearningLabExperience";
import {getLearningLab} from "@/content/learning-labs";
import {publicLaboratoryPresentation} from "@/lib/i18n/laboratory-presentation";
import {learningMetadata} from "@/lib/seo/learning-metadata";
const lab=getLearningLab("mind-lab")!;
export const metadata=learningMetadata(lab.title,lab.description,"/mind-lab","sections/mind-lab.webp");
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 return <LearningLabExperience {...publicLaboratoryPresentation(lab,locale)}/>;
}
