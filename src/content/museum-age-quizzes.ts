import type {Quiz, Room} from "./discovery";
import type {Locale} from "@/i18n/config";
import en from "./translations/museum-age-quizzes.en.json";
import ro from "./translations/museum-age-quizzes.ro.json";
import es from "./translations/museum-age-quizzes.es.json";
import fr from "./translations/museum-age-quizzes.fr.json";
import de from "./translations/museum-age-quizzes.de.json";
import it from "./translations/museum-age-quizzes.it.json";
import pt from "./translations/museum-age-quizzes.pt.json";
import nl from "./translations/museum-age-quizzes.nl.json";
import pl from "./translations/museum-age-quizzes.pl.json";

export type DiscoveryAssessment=Quiz&{explanation:string};
export type DiscoveryAgeAssessments=[DiscoveryAssessment,DiscoveryAssessment,DiscoveryAssessment];
const editions:Record<Locale,Record<string,{question:string;answers:string[];correct:number;explanation:string}[]>>={en,ro,es,fr,de,it,pt,nl,pl};

/** Assemble only the selected room and language on the server. The original
 * concrete recall question belongs to Explorer; older levels apply and reason. */
export function museumAgeAssessments(room:Room,locale:Locale):DiscoveryAgeAssessments {
 const readings=editions[locale][room.slug];
 if(!readings||readings.length!==2)throw new Error(`Missing museum age assessments: ${locale}/${room.slug}`);
 const [builder,strategist]=readings.map(reading=>{
  if(reading.answers.length!==3||new Set(reading.answers).size!==3||!Number.isInteger(reading.correct)||reading.correct<0||reading.correct>2)throw new Error(`Invalid museum assessment: ${locale}/${room.slug}`);
  return {...reading,answers:reading.answers as Quiz["answers"]};
 });
 return [{...room.quiz,explanation:room.explanation},builder!,strategist!];
}
