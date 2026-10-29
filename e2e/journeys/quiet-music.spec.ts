import {test,expect} from "@playwright/test";

test("original melody plays offline only when requested and obeys volume and stop",async({page,context})=>{
  await page.addInitScript(()=>{
    const Base=window.AudioContext;
    let analyser:AnalyserNode|null=null;
    const stats={created:0,closed:0,notes:[] as {frequency:number;time:number}[],rms:()=>{
      if(!analyser)return 0;
      const values=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(values);
      return Math.sqrt(values.reduce((total,value)=>total+value*value,0)/values.length);
    }};
    Object.assign(window,{quietMusicStats:stats});
    window.AudioContext=class extends Base{
      constructor(){super();stats.created++;}
      override createGain(){const gain=super.createGain();if(!analyser){analyser=this.createAnalyser();analyser.fftSize=2048;gain.connect(analyser);}return gain;}
      override createOscillator(){const node=super.createOscillator();const start=node.start.bind(node);node.start=(time=0)=>{stats.notes.push({frequency:node.frequency.value,time});start(time);};return node;}
      override close(){stats.closed++;return super.close();}
    };
  });
  await page.goto("/en/quiet-corner");
  await context.setOffline(true);
  const stats=()=>page.evaluate(()=>{const data=(window as unknown as {quietMusicStats:{created:number;closed:number;notes:{frequency:number;time:number}[];rms:()=>number}}).quietMusicStats;return {created:data.created,closed:data.closed,notes:data.notes,rms:data.rms()};});
  await page.getByRole("button",{name:"Slow melody",exact:true}).click();expect((await stats()).created).toBe(0);
  await page.getByRole("button",{name:"Play sound",exact:true}).click();
  await expect(page.getByRole("button",{name:"Stop sound",exact:true})).toBeVisible();
  await expect.poll(async()=>(await stats()).rms).toBeGreaterThan(0.000001);
  const playing=await stats();expect(playing.created).toBe(1);expect(new Set(playing.notes.map(note=>note.frequency)).size).toBeGreaterThan(3);
  expect(Math.max(...playing.notes.map(note=>note.time))-Math.min(...playing.notes.map(note=>note.time))).toBeGreaterThan(30);
  const volume=page.getByRole("slider",{name:"Sound volume",exact:true});await volume.focus();await volume.press("Home");await expect(volume).toHaveValue("0");
  await expect(volume).toHaveAttribute("aria-valuetext","0%");
  await expect.poll(async()=>(await stats()).rms).toBeLessThan(0.000005);
  await page.getByRole("button",{name:"Stop sound",exact:true}).click();await expect.poll(async()=>(await stats()).closed).toBe(1);
  await expect(page.getByRole("button",{name:"Play sound",exact:true})).toBeVisible();
});
