import LearningLabExperience from "@/components/LearningLabExperience";
import {getLearningLab} from "@/content/learning-labs";
import {getSiteUrl} from "@/lib/seo/site-url";
const lab=getLearningLab("brain-lab")!;
export const metadata={title:lab.title,description:lab.description,alternates:{canonical:`${getSiteUrl()}/en/brain-lab`,languages:{en:`${getSiteUrl()}/en/brain-lab`}}};
export default function Page(){return <LearningLabExperience lab={lab}/>}
