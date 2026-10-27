import LearningLabExperience from "@/components/LearningLabExperience";
import {getLearningLab} from "@/content/learning-labs";
import {learningMetadata} from "@/lib/seo/learning-metadata";
const lab=getLearningLab("mind-lab")!;
export const metadata=learningMetadata(lab.title,lab.description,"/mind-lab","sections/mind-lab.webp");
export default function Page(){return <LearningLabExperience lab={lab}/>}
