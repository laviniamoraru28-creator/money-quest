import LearningLabExperience from "@/components/LearningLabExperience";
import {getLearningLab} from "@/content/learning-labs";
import {learningMetadata} from "@/lib/seo/learning-metadata";
const lab=getLearningLab("future-skills")!;
export const metadata=learningMetadata(lab.title,lab.description,"/future-skills","sections/future-skills.webp");
export default function Page(){return <LearningLabExperience lab={lab}/>}
