import LearningLabExperience from "@/components/LearningLabExperience";
import {getLearningLab} from "@/content/learning-labs";
import {publicLaboratoryPresentation} from "@/lib/i18n/laboratory-presentation";
import {learningMetadata} from "@/lib/seo/learning-metadata";
const lab=getLearningLab("mind-lab")!;
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 const presentation=publicLaboratoryPresentation(lab,locale);
 return learningMetadata(presentation.lab.title,presentation.lab.description,"/mind-lab","sections/mind-lab.webp",presentation.locale??"en");
}
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 return <LearningLabExperience {...publicLaboratoryPresentation(lab,locale)}/>;
}
