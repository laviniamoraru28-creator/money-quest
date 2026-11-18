import assert from "node:assert/strict";
import {readFileSync, mkdirSync, writeFileSync} from "node:fs";
import {PDFDocument, PDFName, PDFString} from "pdf-lib";
import {CERTIFICATE_BANDS,requiredCertificateActivities,isCertificateEligible} from "../src/lib/certificates/eligibility";
import {createDefaultState,applyActivityCompletion} from "../src/lib/local-progress/state";
import fontkit from "@pdf-lib/fontkit";
import {generateCertificatePdf,formatCertificateDate,fitLines,CERTIFICATE_ASSETS} from "../src/lib/certificates/pdf";
import {certificateCopy,certificateCompetencies} from "../src/content/certificate-copy";
import {LOCALES,REGIONAL_LOCALES} from "../src/i18n/config";
import {WORLDS} from "../src/content/worlds";
import {getWorldCatalog} from "../src/content/catalog";

async function main(){
  for(const band of CERTIFICATE_BANDS){
    const required=requiredCertificateActivities(band);
    assert.deepEqual([...required].sort(),WORLDS.flatMap(world=>getWorldCatalog(world.id,band,k=>k).map(item=>item.id)).sort());
    assert.equal(required.length,new Set(required).size);
    assert(!isCertificateEligible([],band));
    assert(!isCertificateEligible(required.slice(0,-1),band));
    assert(isCertificateEligible(required,band));
    let state={...createDefaultState(),ageBand:band};
    for(const id of required.slice(0,-1))state=applyActivityCompletion(state,id,true,10,5,new Date("2026-10-30T12:00:00Z")).state as typeof state;
    assert(!state.certificateCompletionDates[band]);
    const last=required.at(-1)!;
    assert(!applyActivityCompletion(state,last,false,10,5).state.certificateCompletionDates[band]);
    const result=applyActivityCompletion(state,last,true,10,5,new Date("2026-11-03T23:59:00Z"));
    const date=result.state.certificateCompletionDates[band]!;
    assert.equal(new Date(date).toISOString(),"2026-11-03T23:59:00.000Z");
    const replay=applyActivityCompletion(result.state,last,true,10,5,new Date("2026-12-01"));
    assert.equal(replay.state.certificateCompletionDates[band],date);
    assert.equal(replay.xpAwarded,0);assert.equal(replay.coinsAwarded,0);
    const other=CERTIFICATE_BANDS.find(item=>item!==band)!;
    assert(!isCertificateEligible(result.state.completedActivityIds,other));
    assert(!result.state.certificateCompletionDates[other]);
    const switched={...result.state,ageBand:other};
    assert.equal(switched.certificateCompletionDates[band],date);
    assert.equal(createDefaultState().certificateCompletionDates[band],undefined);
    const missingWrongBand=applyActivityCompletion({...state,ageBand:other},last,true,10,5);
    assert(!missingWrongBand.state.certificateCompletionDates[band]);
  }
  assert.equal(formatCertificateDate("2026-11-03T00:15:00+14:00","en"),"3 November 2026");
  assert.equal(formatCertificateDate(undefined,"ro"),"");
  assert.equal(formatCertificateDate("invalid","ro"),"");
  const output=process.env.CERTIFICATE_QA_OUTPUT;
  if(output)mkdirSync(output,{recursive:true});
  // Regression for the competency-ribbon overflow reported in Romanian
  // certificates: every competency label, in every one of the 9 languages
  // and all 3 bands, must actually wrap within the ribbon's real text
  // width - not merely not-crash, but every produced line measured at
  // or under 104pt at the font size fitLines chose, and never below the
  // readable floor's own line count as a last resort.
  {
    const fontDoc=await PDFDocument.create();fontDoc.registerFontkit(fontkit);
    const sans=await fontDoc.embedFont(readFileSync(`public${CERTIFICATE_ASSETS}/fonts/DejaVuSans.ttf`),{subset:true});
    for(const band of CERTIFICATE_BANDS)for(const locale of LOCALES)for(const key of certificateCompetencies[band]){
      const {result,actual}=fitLines(certificateCopy[locale][key],104,11,sans,3);
      assert(result.length<=3,`${locale}/${band}/${key}: ${result.length} lines`);
      for(const line of result)assert(sans.widthOfTextAtSize(line,actual)<=104+0.01,`${locale}/${band}/${key}: line "${line}" overflows at ${actual}pt`);
    }
  }
  for(const locale of LOCALES)for(const band of CERTIFICATE_BANDS){
    const copy=certificateCopy[locale];
    assert.equal(certificateCompetencies[band].length,6);
    for(const key of certificateCompetencies[band])assert(copy[key].length>0);
    for(const value of Object.values(copy)){assert.equal(value,value.normalize("NFC"));assert(!value.includes("�"));}
    const timestamp="2026-11-03T09:30:00+00:00";
    const bytes=await generateCertificatePdf(band,locale,timestamp,async path=>new Uint8Array(readFileSync(`public${path}`)));
    assert.equal(Buffer.from(bytes).subarray(0,5).toString(),"%PDF-");
    const pdf=await PDFDocument.load(bytes);
    assert.equal(pdf.getPageCount(),1);
    assert(Math.abs(pdf.getPage(0).getWidth()-841.89)<0.01);
    assert(Math.abs(pdf.getPage(0).getHeight()-595.28)<0.01);
    assert.equal(pdf.getTitle(),`MONEY QUEST ACADEMY · ${copy[band]}`);
    assert.equal((pdf.catalog.get(PDFName.of("Lang")) as PDFString).decodeText(),REGIONAL_LOCALES[locale]);
    if(output)writeFileSync(`${output}/${band}-${locale}.pdf`,bytes);
  }
  console.log("PASS: curriculum eligibility, all 3 date transitions, replay/reset/switching, 27 embedded-font A4 PDFs and nine locales");
}
main().catch(error=>{console.error(error);process.exit(1);});
