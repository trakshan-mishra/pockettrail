import type { WalkMeasurement } from './types';

export interface ClockSample { monotonic: number; wall: number; hidden: boolean }
export function sampleClock(): ClockSample {
  return {monotonic:performance.now(),wall:Date.now(),hidden:document.visibilityState==='hidden'};
}

function timingWarning(before: ClockSample, after: ClockSample): number {
  const elapsed = after.monotonic-before.monotonic;
  return elapsed < 0 || Math.abs((after.wall-before.wall)-elapsed)>2000 ? 1 : 0;
}

export function beginMeasurement(prep: ClockSample, now: ClockSample): WalkMeasurement {
  return {prepMs:Math.max(0,now.monotonic-prep.monotonic),sessionMs:0,hiddenMs:0,screenChecks:0,active:true,interruptions:0,timingWarnings:timingWarning(prep,now)};
}

export function advanceMeasurement(value: WalkMeasurement, before: ClockSample, after: ClockSample): WalkMeasurement {
  if (!value.active) return value;
  const elapsed = Math.max(0,after.monotonic-before.monotonic);
  return {...value,sessionMs:value.sessionMs+elapsed,hiddenMs:value.hiddenMs+(before.hidden?elapsed:0),screenChecks:value.screenChecks+(before.hidden&&!after.hidden?1:0),timingWarnings:value.timingWarnings+timingWarning(before,after)};
}

export function interruptMeasurement(value: WalkMeasurement): WalkMeasurement {
  return {...value,active:false,interruptions:value.interruptions+1};
}

export function duration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds/1000);
  return `${Math.floor(seconds/60)}m ${seconds%60}s`;
}

export function measurementNote(value: WalkMeasurement, completed: number): string {
  return `YOUR WALK (browser-observed, on this device)\nPrep time: ${duration(value.prepMs)}\nSession length: ${duration(value.sessionMs)}\nScreen checks (hidden to visible): ${value.screenChecks}\nMinutes the page was hidden: ${(value.hiddenMs/60000).toFixed(2)}\nActivities completed: ${completed} of 3\nReload interruptions: ${value.interruptions}\nClock or sleep timing warnings: ${value.timingWarnings}\nPage visibility is not proof of screen-off time or being outdoors. Reload gaps and unsaved time are not measured.`;
}
