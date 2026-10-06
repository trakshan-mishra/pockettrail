import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Bird, Check, CloudRain, ChevronRight, CircleHelp, Clock3, Download, Flower2, Footprints, Headphones, House, Leaf, LoaderCircle, MapPin, Moon, Pause, Play, RefreshCw, Sparkles, Sprout, Sun, Trees, Trash2, Volume2, Wifi, WifiOff, X } from 'lucide-react';
import type { Condition, Interest, Pack, Preferences, SavedWalk, Setting, Status } from './types';
import { deleteWalk, listWalks, saveWalk } from './storage';
import { TimerCue } from './timerCue';

const settings: {id: Setting; label: string; icon: typeof Trees}[] = [{id:'park',label:'A park',icon:Trees},{id:'garden',label:'A garden',icon:Flower2},{id:'neighborhood',label:'My neighborhood',icon:MapPin},{id:'window',label:'Window or balcony',icon:House}];
const interests: {id: Interest; label: string; icon: typeof Leaf}[] = [{id:'calm',label:'Calm',icon:Sun},{id:'curious',label:'Curious',icon:Leaf},{id:'create',label:'Creative',icon:Sparkles}];
const conditions: {id: Condition; label: string; icon: typeof Sun}[] = [{id:'daytime',label:'Daytime',icon:Sun},{id:'evening',label:'Evening',icon:Moon},{id:'rainy',label:'Rainy',icon:CloudRain}];
function clockCondition(): Condition {const hour = new Date().getHours();return hour >= 6 && hour < 18 ? 'daytime' : 'evening';}
const defaults: Preferences = {condition:'daytime',minutes:20,setting:'park',interest:'calm',constraints:'',avoid:['camera','drawing'],sample:false};

async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : undefined);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Something went wrong. Please try again.');
  }
  return response.json() as Promise<T>;
}

function Landscape({compact=false}: {compact?:boolean}) {
  return <div className={`landscape ${compact?'compact':''}`} aria-hidden="true"><svg viewBox="0 0 620 420" role="img">
    <defs><pattern id="paper" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill="#324d35" opacity=".05"/></pattern></defs>
    <rect width="620" height="420" fill="#e5e9d4"/><circle cx="440" cy="110" r="52" fill="#edc369"/>
    <path d="M0 249Q150 110 322 243T620 220V420H0Z" fill="#b8c8a5"/><path d="M0 312Q160 209 308 283T620 259V420H0Z" fill="#879f7f"/>
    <path d="M290 420Q350 365 301 321Q282 304 328 287Q375 270 403 262" fill="none" stroke="#f3ecd9" strokeWidth="45"/>
    <path d="M290 420Q350 365 301 321Q282 304 328 287Q375 270 403 262" fill="none" stroke="#e4d8bc" strokeWidth="2" strokeDasharray="4 8"/>
    <g fill="#3c6249"><path d="m126 101-68 144h37l-42 72h151l-44-72h37Z"/><path d="m204 160-46 106h23l-28 53h106l-29-53h24Z"/><path d="m502 150-57 126h30l-35 63h127l-35-63h29Z"/></g>
    <g stroke="#40533a" strokeWidth="6"><path d="M126 276v71M204 289v44M502 296v58"/></g>
    <g fill="#d9dda3"><ellipse cx="82" cy="365" rx="17" ry="5" transform="rotate(-30 82 365)"/><ellipse cx="106" cy="372" rx="13" ry="4" transform="rotate(35 106 372)"/><ellipse cx="558" cy="367" rx="14" ry="4" transform="rotate(-25 558 367)"/></g>
    <path d="M323 116q11-11 22 0q11-11 22 0M365 88q8-8 16 0q8-8 16 0" stroke="#6b7e57" strokeWidth="2" fill="none"/>
    <rect width="620" height="420" fill="url(#paper)"/>
  </svg><span className="field-label">A FEW MINUTES. A DIFFERENT VIEW.</span></div>;
}

function App() {
  const [view,setView] = useState<'setup'|'pack'|'walk'|'finish'|'saved'>('setup');
  const [prefs,setPrefs] = useState<Preferences>(()=>({...defaults,condition:clockCondition()}));
  const [status,setStatus] = useState<Status|null>(null);
  const [walk,setWalk] = useState<SavedWalk|null>(null);
  const [saved,setSaved] = useState<SavedWalk[]>([]);
  const [step,setStep] = useState(0);
  const [busy,setBusy] = useState(false);
  const [voiceBusy,setVoiceBusy] = useState(false);
  const [playing,setPlaying] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [online,setOnline] = useState(navigator.onLine);
  const [offlineReady,setOfflineReady] = useState(false);
  const [about,setAbout] = useState(false);
  const [remaining,setRemaining] = useState<number|null>(null);
  const [timerRunning,setTimerRunning] = useState(false);
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const audioUrl = useRef<string|null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const deadline = useRef<number|null>(null);
  const cue = useRef<TimerCue|null>(null);
  if (!cue.current) cue.current = new TimerCue();
  const [timerArming,setTimerArming] = useState(false);
  const timerStarting = useRef(false);
  useEffect(() => () => cue.current?.dispose(), []);

  const loadSaved = () => listWalks().then(setSaved).catch(e => setError(e.message));
  useEffect(() => {
    void api<Status>('/api/status').then(setStatus).catch(() => {});
    void loadSaved();
    const onOnline = () => setOnline(true); const onOffline = () => setOnline(false);
    window.addEventListener('online',onOnline); window.addEventListener('offline',onOffline);
    const offlineError = () => setOfflineReady(false);
    window.addEventListener('pockettrail-offline-error',offlineError);
    if ('serviceWorker' in navigator && import.meta.env.PROD) void navigator.serviceWorker.ready.then(() => setOfflineReady(true));
    return () => {window.removeEventListener('online',onOnline);window.removeEventListener('offline',onOffline);window.removeEventListener('pockettrail-offline-error',offlineError);};
  },[]);
  useEffect(() => {mainRef.current?.focus();window.scrollTo({top:0,behavior:'instant'});},[view]);
  useEffect(() => {stopAudio();setTimerRunning(false);deadline.current=null;setRemaining(null);},[step,walk?.pack.id]);
  useEffect(() => {if(view!=='walk'){stopAudio();setTimerRunning(false);}},[view]);
  useEffect(() => {
    if (!about) return;
    const previous = document.activeElement as HTMLElement | null;
    const buttons = Array.from(aboutRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    buttons[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setAbout(false); }
      if (event.key === 'Tab' && buttons.length) {
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, [about]);
  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      const seconds = Math.max(0,Math.ceil(((deadline.current??Date.now())-Date.now())/1000));
      setRemaining(seconds);
      if(seconds===0) {cue.current?.complete();setTimerRunning(false);setNotice('Time for a gentle pause. Move on whenever you are ready.');}
    },250);
    return () => {clearInterval(interval);cue.current?.cancel();};
  },[timerRunning]);

  function stopAudio() {
    audioRef.current?.pause();audioRef.current=null;
    if(audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current=null;setPlaying(false);
  }
  function go(next: typeof view) {setError('');setNotice('');setView(next);}
  async function persist(updated: SavedWalk, message='') {
    await saveWalk(updated);setWalk(updated);await loadSaved();if(message)setNotice(message);
  }
  async function generate(sample=false) {
    setBusy(true);setError('');setNotice('');
    try {
      const pack = await api<Pack>('/api/missions',{...prefs,sample});
      setWalk({pack,completed:[],reflection:'',savedAt:new Date().toISOString(),audio:{}});setStep(0);setView('pack');
      void api<Status>('/api/status').then(setStatus).catch(() => {});
    } catch(e){setError((e as Error).message);} finally{setBusy(false);}
  }
  async function saveForOffline() {
    if(!walk)return;
    try {await persist(walk,offlineReady?`Saved on this device. Your activity text works offline.${status?.voice_ready?' Add voice to save audio too.':''}`:'Saved on this device. Offline app installation is still loading; stay connected until it is ready.');}
    catch(e){setError((e as Error).message);}
  }
  async function startWalk() {
    if(!walk)return;
    try{await persist(walk);setStep(Math.min(walk.completed.length,2));go('walk');}
    catch(e){setError((e as Error).message);}
  }
  async function makeVoice(all=false) {
    if(!walk)return;
    setVoiceBusy(true);setError('');
    let updated = walk;
    try {
      const activities = all?walk.pack.activities:[walk.pack.activities[step]];
      for(const activity of activities) {
        if(updated.audio[activity.id])continue;
        const response = await fetch('/api/narration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pack_id:walk.pack.id,activity_id:activity.id})});
        if(!response.ok){const data=await response.json();throw new Error(data.detail||'Voice could not be added.');}
        updated={...updated,audio:{...updated.audio,[activity.id]:await response.blob()}};
        await persist(updated);
      }
      setNotice(all?'All three voice instructions are saved on this device.':'Voice instruction saved on this device.');
      if(!all)playBlob(updated.audio[updated.pack.activities[step].id]);
    } catch(e){setError((e as Error).message);}finally{setVoiceBusy(false);}
  }
  function playBlob(blob: Blob) {
    stopAudio();audioUrl.current=URL.createObjectURL(blob);
    const audio=new Audio(audioUrl.current);audioRef.current=audio;
    audio.onended=()=>setPlaying(false);
    audio.play().then(()=>setPlaying(true)).catch(()=>setError('Tap Listen again to allow audio playback in your browser.'));
  }
  function toggleAudio() {
    if(playing){audioRef.current?.pause();setPlaying(false);return;}
    if(audioRef.current){audioRef.current.play().then(()=>setPlaying(true)).catch(()=>setError('Audio could not be played.'));return;}
    const blob=walk?.audio[walk.pack.activities[step].id];if(blob)playBlob(blob);else void makeVoice();
  }
  async function completeActivity() {
    if(!walk)return;
    const completed=[...new Set([...walk.completed,walk.pack.activities[step].id])];
    try{await persist({...walk,completed});if(step===2){go('finish');}else{setStep(step+1);setNotice('');}}
    catch(e){setError((e as Error).message);}
  }
  async function finishWalk() {
    if(!walk)return;
    try{await persist({...walk,finishedAt:new Date().toISOString()},'Your field note is saved. A little time to notice, kept for later.');}
    catch(e){setError((e as Error).message);}
  }
  function fieldNote() {
    if(!walk)return '';
    const text=`POCKETTRAIL — FIELD NOTE\n${walk.pack.title}\n${walk.pack.minutes} minutes · ${walk.pack.setting}${walk.pack.condition?` · ${walk.pack.condition}`:''}\n\n${walk.pack.activities.map((a,i)=>`${i+1}. ${a.title} (${a.minutes} minutes)\n${a.instruction}\nFocus: ${a.focus}\n${walk.completed.includes(a.id)?'Completed':'Not yet completed'}`).join('\n\n')}\n\nWhat I noticed\n${walk.reflection||'No field note added.'}\n\n${walk.pack.source==='preview'?'Authored sample activities':`Generated with ${walk.pack.model} via ${walk.pack.source}`}`;
    return text;
  }
  async function tryChime() {
    const ready = await cue.current!.ready();
    if (ready) {cue.current!.preview();setNotice('That is your timer chime. Vibration depends on your device.');}
    else setNotice('Sound is unavailable in this browser. The visual timer still works.');
  }
  async function toggleTimer() {
    if(timerRunning){setRemaining(Math.max(0,Math.ceil(((deadline.current??Date.now())-Date.now())/1000)));setTimerRunning(false);return;}
    if(timerStarting.current)return;
    timerStarting.current=true;setTimerArming(true);
    const ready=await cue.current!.ready();
    timerStarting.current=false;setTimerArming(false);
    const seconds=remaining&&remaining>0?remaining:(walk?.pack.activities[step].minutes??0)*60;
    deadline.current=Date.now()+seconds*1000;setRemaining(seconds);cue.current!.schedule(seconds);setTimerRunning(true);
    if(!ready)setNotice('Sound is unavailable in this browser. The visual timer still works.');
  }
  const activity = walk?.pack.activities[step];
  const isSaved = saved.some(s=>s.pack.id===walk?.pack.id);
  const audioCount = walk?Object.keys(walk.audio).length:0;

  return <div className="app-shell">
    <header className="site-header"><a className="brand" href="#" onClick={e=>{e.preventDefault();go('setup');}} aria-label="PocketTrail home"><span className="brand-mark"><Trees size={24}/></span>PocketTrail<span className="brand-dot">.</span></a><nav aria-label="Main navigation"><button className={view==='saved'?'active':''} onClick={()=>{void loadSaved();go('saved');}}>Saved walks <span className="count">{saved.length}</span></button><button className="about-button" aria-label="How it works" onClick={()=>setAbout(true)}><CircleHelp size={17}/><span>How it works</span></button></nav></header>
    {!online&&<div className="offline-banner"><WifiOff size={16}/>You're offline. Your saved walks are ready to explore.</div>}
    <main ref={mainRef} tabIndex={-1}>
      {view==='setup'&&<>
        <div className="setup-grid">
          <section className="hero"><div className="eyebrow"><span/>LESS SCROLLING. MORE NOTICING.</div><h1>Good things<br/>are just <em>outside.</em></h1><p className="hero-copy">A small nature adventure, made for your time and curiosity. Three things to notice. A little space to breathe.</p><div className="hero-meta"><span><Clock3 size={16}/>10–30 minutes</span><span><Headphones size={16}/>Listen & look up</span><span><Leaf size={16}/>No special gear</span></div><Landscape/><div className="illustration-caption"><span>YOUR NEXT ADVENTURE DOESN'T NEED TO BE FAR.</span><ArrowDown size={17}/></div></section>
          <section className="planner" aria-labelledby="planner-title"><div className="planner-top"><span className="small-label">LET'S GET YOU OUTSIDE</span><span className="planner-number">01 / PLAN</span></div><h2 id="planner-title">Make a little time<br/>for the outside.</h2><p className="planner-subtitle">We'll make the noticing part easy.</p>
            <form onSubmit={e=>{e.preventDefault();void generate();}}>
              <fieldset><legend><Clock3 size={15}/>How much time do you have?</legend><div className="time-options">{([10,20,30] as const).map(n=><button type="button" key={n} aria-pressed={prefs.minutes===n} className={prefs.minutes===n?'selected':''} onClick={()=>setPrefs({...prefs,minutes:n})}>{n}<span> min</span>{prefs.minutes===n&&<Check size={13}/>}</button>)}</div></fieldset>
              <fieldset><legend><MapPin size={15}/>Where are you heading?</legend><div className="setting-options">{settings.map(({id,label,icon:Icon})=><button type="button" key={id} className={prefs.setting===id?'selected':''} aria-pressed={prefs.setting===id} onClick={()=>setPrefs({...prefs,setting:id})}><Icon size={22}/><span>{label}</span></button>)}</div></fieldset>
              <fieldset><legend><Sun size={15}/>What’s it like outside?</legend><div className="time-options condition-options">{conditions.map(({id,label,icon:Icon})=><button type="button" key={id} aria-pressed={prefs.condition===id} className={prefs.condition===id?'selected':''} onClick={()=>setPrefs({...prefs,condition:id})}><Icon size={16}/><span>{label}</span></button>)}</div><p className="context-hint">Daytime or evening starts from your clock. Choose Rainy for a sheltered pause.</p></fieldset>
              <fieldset><legend><Sparkles size={15}/>What are you in the mood for?</legend><div className="interest-options">{interests.map(({id,label,icon:Icon})=><button type="button" key={id} className={prefs.interest===id?'selected':''} aria-pressed={prefs.interest===id} onClick={()=>setPrefs({...prefs,interest:id})}><Icon size={14}/>{label}</button>)}</div></fieldset>
              <details className="preferences"><summary>Anything to keep in mind?<span>Optional</span></summary><label className="sr-only" htmlFor="constraints">Additional preferences</label><textarea id="constraints" maxLength={280} value={prefs.constraints} onChange={e=>setPrefs({...prefs,constraints:e.target.value})} placeholder="For example: stay seated, focus on sounds…"/><div className="checkbox-row">{(['camera','drawing'] as const).map(id=><label key={id}><input type="checkbox" checked={prefs.avoid.includes(id)} onChange={e=>setPrefs({...prefs,avoid:e.target.checked?[...prefs.avoid,id]:prefs.avoid.filter(v=>v!==id)})}/>{id==='camera'?'No camera':'No drawing supplies'}</label>)}</div></details>
              <button className="button primary generate-button" type="submit" disabled={busy||!online}>{busy?<><LoaderCircle className="spin" size={18}/>Making room for adventure…</>:<>Make my trail<ArrowRight size={18}/></>}</button>
              {busy&&<p className="loading-note" role="status">Choosing three activities for you. A local model can take a minute to warm up.</p>}
              {!busy&&<p className="generation-note"><Leaf size={13}/>{status?.backend==='preview'?'Sample mode · authored activities':status?.backend==='backboard'?'Made with an open-weight model':'Made with a local open-weight model'}</p>}
              <button type="button" className="sample-link" disabled={busy||!online} onClick={()=>void generate(true)}>Just curious? Try a sample walk <ChevronRight size={14}/></button>
            </form>
          </section>
        </div>
        <section className="how-strip" aria-label="Three simple steps"><div><span className="step-number">01</span><div><h3>Make it yours</h3><p>A few minutes. Your kind of outside.</p></div></div><div><span className="step-number">02</span><div><h3>Save it. Step out.</h3><p>Your instructions come along, even offline.</p></div></div><div><span className="step-number">03</span><div><h3>Notice something new</h3><p>No scores. No streaks. Just being there.</p></div></div></section>
      </>}

      {view==='pack'&&walk&&<section className="pack-page"><button className="back-link" onClick={()=>go('setup')}><ArrowLeft size={16}/>Back to planning</button><div className="pack-heading"><div><div className="eyebrow"><span/>YOUR LITTLE ADVENTURE</div><h1>{walk.pack.title}</h1><p>{walk.pack.intro}</p><div className="pack-meta"><span><Clock3 size={16}/>{walk.pack.minutes} minutes</span><span><MapPin size={16}/>{settings.find(s=>s.id===walk.pack.setting)?.label}</span>{walk.pack.condition&&<span><Sun size={16}/>{conditions.find(c=>c.id===walk.pack.condition)?.label}</span>}<span><Leaf size={16}/>3 things to notice</span></div></div><div className="mini-landscape"><Landscape compact/></div></div>
        {walk.pack.source==='preview'&&<div className="sample-banner"><Sun size={16}/>This is an authored sample walk. No AI call or sponsor credit was used.</div>}
        <div className="activity-grid">{walk.pack.activities.map((a,i)=><article className="activity-card" key={a.id}><div className="activity-card-top"><span className="activity-number">0{i+1}</span><span className="sense">{a.sense}</span></div><h2>{a.title}</h2><p>{a.instruction}</p><div className="focus-note"><span>YOUR FOCUS</span>{a.focus}</div><div className="activity-card-bottom"><span><Clock3 size={14}/>{a.minutes} minutes</span>{walk.completed.includes(a.id)&&<Check size={18}/>}</div></article>)}</div>
        <div className="pack-actions"><div><button className="button primary" onClick={()=>void startWalk()}>{walk.pack.setting==='window'?'Take a window pause':"Let's step outside"}<ArrowRight size={18}/></button><button className="button secondary" onClick={()=>void saveForOffline()}><Download size={17}/>{isSaved?'Saved on this device':'Save for offline'}</button></div>{status?.voice_ready&&<button className="audio-pack-button" onClick={()=>void makeVoice(true)} disabled={voiceBusy||audioCount===3||!online||!status?.voice_ready}>{voiceBusy?<LoaderCircle className="spin" size={16}/>:<Headphones size={16}/>} {audioCount===3?'Voice saved for all 3 activities':'Add voice to my saved walk'}</button>}</div><p className="outside-note">Put the screen away between activities. You can enjoy every activity from one comfortable spot.</p>
        <details className="source-details"><summary>About this walk</summary><p>{walk.pack.source==='preview'?'These are original sample activities, selected without AI.':`Activity choices and personal focus were generated with ${walk.pack.model} via ${walk.pack.source}. Instructions come from our authored activity catalog.`} {walk.pack.cached?'This response was reused from cache.':'Your chosen durations add up to your available time.'}</p><p>Saved text and downloaded audio stay on this device. Hosted generation sends your preferences to the configured model provider; avoid including personal information.</p></details>
      </section>}

      {view==='walk'&&walk&&activity&&<section className="walk-page"><div className="walk-top"><button className="back-link" onClick={()=>go('pack')}><ArrowLeft size={16}/>My walk</button><span className="walk-position">ACTIVITY {step+1} OF 3</span><span className="connection-label">{online?<Wifi size={14}/>:<WifiOff size={14}/>} {isSaved?'Saved on device':'Online'}</span></div><div className="progress-track">{walk.pack.activities.map((a,i)=><button key={a.id} aria-label={`Go to activity ${i+1}: ${a.title}`} aria-current={i===step?'step':undefined} className={`${i===step?'current':''} ${walk.completed.includes(a.id)?'done':''}`} onClick={()=>setStep(i)}><span>{walk.completed.includes(a.id)?<Check size={14}/>:i+1}</span></button>)}</div><div className="walk-card"><div className="walk-sense"><Leaf size={18}/>{activity.sense} a little closer</div><h1>{activity.title}</h1><p className="walk-instruction">{activity.instruction}</p><div className="walk-focus"><span>ONE THING TO KEEP IN MIND</span><p>{activity.focus}</p></div><div className="walk-controls">{(status?.voice_ready||!!walk.audio[activity.id])&&<button className="button secondary" onClick={toggleAudio} disabled={voiceBusy||(!walk.audio[activity.id]&&(!online||!status?.voice_ready))}>{voiceBusy?<LoaderCircle className="spin" size={18}/>:playing?<Pause size={18}/>:<Volume2 size={18}/>} {voiceBusy?'Adding voice…':playing?'Pause audio':walk.audio[activity.id]?'Listen':'Add & listen'}</button>}<button className="timer-button" aria-label={timerRunning?'Pause timer':remaining===null?'Start activity timer':remaining===0?'Restart activity timer':'Resume timer'} onClick={()=>void toggleTimer()} disabled={timerArming}>{timerRunning?<Pause size={16}/>:<Play size={16}/>} {remaining===null?`${activity.minutes} min timer`:`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`}</button></div><div className="timer-cue-note"><span>Soft chime when time is up. Vibration where supported.</span><button type="button" onClick={()=>void tryChime()}>Try chime</button></div><p className="screen-away">The timer is optional. Keep this page active for the chime; some phones pause it when locked.</p><button className="button primary complete-button" onClick={()=>void completeActivity()}>I took a moment{step===2?<Check size={18}/>:<ArrowRight size={18}/>}</button></div></section>}

      {view==='finish'&&walk&&<section className="finish-page"><div className="finish-icon"><Sprout size={37}/></div><div className="eyebrow">A LITTLE TIME WELL SPENT</div><h1>{walk.pack.setting==='window'?'You took a little pause.':'You went outside.'}<br/><em>That's the good part.</em></h1><p>Keep one small thing you noticed. It doesn't need to be profound.</p><div className="finish-summary"><span><Clock3 size={16}/>{walk.pack.minutes}-minute plan</span><span><Check size={16}/>{walk.completed.length} of 3 moments taken</span></div><label htmlFor="reflection" className="reflection-label">MY FIELD NOTE</label><textarea id="reflection" maxLength={1200} value={walk.reflection} onChange={e=>setWalk({...walk,reflection:e.target.value})} placeholder="The leaves made a sound I'd never noticed before…"/><div className="finish-actions"><button className="button primary" onClick={()=>void finishWalk()}><Check size={17}/>{walk.finishedAt?'Update my field note':'Keep this moment'}</button><a className="button secondary" href={`data:text/plain;charset=utf-8,${encodeURIComponent(fieldNote())}`} download="pockettrail-field-note.txt"><Download size={17}/>Download field note</a></div><button className="text-button" onClick={()=>go('setup')}>Another day, another little adventure<ArrowRight size={15}/></button></section>}

      {view==='saved'&&<section className="saved-page"><button className="back-link" onClick={()=>go('setup')}><ArrowLeft size={16}/>Plan a walk</button><div className="eyebrow"><span/>YOUR POCKET COLLECTION</div><h1>A little outside,<br/><em>ready when you are.</em></h1><p className="saved-description">Saved on this device. No account, no connection needed for downloaded activities.</p>{saved.length===0?<div className="empty-state"><Leaf size={40}/><h2>Your first adventure is waiting.</h2><p>Make a walk, then save it here to take outside.</p><button className="button primary" onClick={()=>go('setup')}>Plan my first walk<ArrowRight size={17}/></button></div>:<div className="saved-grid">{saved.map(item=><article key={item.pack.id} className="saved-card"><div className="saved-card-top"><span className="sense">{item.finishedAt?'FIELD NOTE':'READY TO GO'}</span><span>{new Date(item.savedAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span></div><h2>{item.pack.title}</h2><div className="saved-meta"><span><Clock3 size={14}/>{item.pack.minutes} min</span>{(status?.voice_ready||Object.keys(item.audio).length>0)&&<span><Headphones size={14}/>{Object.keys(item.audio).length}/3 audio saved</span>}</div>{item.reflection&&<p className="saved-reflection">{item.reflection}</p>}<div className="saved-card-actions"><button className="text-button" onClick={()=>{setWalk(item);setStep(0);go(item.finishedAt?'finish':'pack');}}>{item.finishedAt?'Open field note':'Open my walk'}<ArrowRight size={17}/></button><button className="delete-button" aria-label={`Remove saved walk: ${item.pack.title}`} onClick={()=>void deleteWalk(item.pack.id).then(loadSaved).catch(e=>setError(e.message))}><Trash2 size={16}/></button></div></article>)}</div>}</section>}

      {error&&<div className="feedback error" role="alert"><CircleHelp size={18}/><span>{error}</span><button aria-label="Dismiss error" onClick={()=>setError('')}><X size={16}/></button></div>}
      {notice&&<div className="feedback notice" role="status"><Check size={18}/><span>{notice}</span><button aria-label="Dismiss notification" onClick={()=>setNotice('')}><X size={16}/></button></div>}
    </main>
    <footer><span><Leaf size={14}/>Small adventures. Open possibilities.</span><span>{offlineReady?<><Check size={13}/>Offline app ready</>:<><Sun size={13}/>Made for a little more outside</>}</span></footer>
    {about&&<div className="modal-backdrop" onClick={()=>setAbout(false)}><section ref={aboutRef} className="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="Close how it works" onClick={()=>setAbout(false)}><X size={20}/></button><span className="brand-mark"><Trees size={25}/></span><h2 id="about-title">A little less screen.<br/>A little more outside.</h2><p>Choose your time, setting, and curiosity. An open-weight model selects three gentle activities and gives each one a personal focus.</p><p>Save the walk before stepping out. The text works offline once the app is ready. {status?.voice_ready&&' Add voice while connected to take the audio along too.'}</p><p>All activities are observations, not routes or species identifications. Stay somewhere comfortable; leave plants and wildlife as you found them.</p><div className="about-note">No account. No location tracking. Your saved walks live on this device.</div><button className="button primary" onClick={()=>setAbout(false)}>Let's make a walk<ArrowRight size={17}/></button></section></div>}
  </div>;
}
export default App;
