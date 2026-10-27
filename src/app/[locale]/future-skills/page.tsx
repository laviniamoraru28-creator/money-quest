import LearningLabExperience from "@/components/LearningLabExperience";
import {getLearningLab} from "@/content/learning-labs";
import {getSiteUrl} from "@/lib/seo/site-url";
const lab=getLearningLab("future-skills")!;
export const metadata={title:lab.title,description:lab.description,alternates:{canonical:`${getSiteUrl()}/en/future-skills`,languages:{en:`${getSiteUrl()}/en/future-skills`}}};
export default function Page(){return <LearningLabExperience lab={lab}/>}
