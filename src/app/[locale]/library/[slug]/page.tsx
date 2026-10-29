import {publicLibraryLocale,draftReaderPresentation,draftBiographyPresentation} from "@/lib/i18n/library-presentation";
import {learningMetadata} from "@/lib/seo/learning-metadata";
import DiscoveryExperience from "@/components/DiscoveryExperience";
import {libraryPeople} from "@/content/people";
import BiographyProfile from "@/components/BiographyProfile";
import OriginalBookReader from "@/components/OriginalBookReader";
import {notFound} from "next/navigation";
import {libraryBooks} from "@/content/discovery";
import {originalBooks} from "@/content/library";
type Props={params:Promise<{slug:string;locale:string}>};
export default async function Page({params}:Props){
  const {slug,locale:requestedLocale}=await params;
  const locale=publicLibraryLocale(requestedLocale);
  const person=libraryPeople.find(item=>item.slug===slug);
  if(person)return <BiographyProfile {...draftBiographyPresentation(person,locale)}/>;
  const original=originalBooks.find(book=>book.slug===slug);
  if(original)return <OriginalBookReader key={slug} {...draftReaderPresentation(original,locale)}/>;
  if(!libraryBooks.some(entry=>entry.slug===slug))notFound();
  return <DiscoveryExperience kind="library" slug={slug}/>;
}
export function generateStaticParams(){return [...libraryBooks,...originalBooks,...libraryPeople].map(entry=>({slug:entry.slug}))}
export async function generateMetadata({params}:Props){
  const {slug}=await params;
  const person=libraryPeople.find(item=>item.slug===slug);
  if(person)return learningMetadata(person.title,person.topic,`/library/${slug}`,person.image.replace("/images/money-quest/",""));
  const original=originalBooks.find(book=>book.slug===slug);
  if(original)return learningMetadata(original.title,original.description,`/library/${slug}`,original.cover.replace("/images/money-quest/",""));
  const entry=libraryBooks.find(item=>item.slug===slug);
  if(!entry)notFound();
  return learningMetadata(entry.title,entry.topic,`/library/${slug}`,"sections/library.webp");
}
