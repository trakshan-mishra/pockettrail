export type Condition = 'daytime' | 'evening' | 'rainy';
export type Setting = 'park' | 'garden' | 'neighborhood' | 'window';
export type Interest = 'calm' | 'curious' | 'create';
export interface Preferences { minutes: 10 | 20 | 30; setting: Setting; interest: Interest; condition: Condition; constraints: string; avoid: ('camera' | 'drawing')[]; sample: boolean }
export interface Activity { id: string; title: string; instruction: string; focus: string; reflection: string; sense: string; minutes: number }
export interface Pack { id: string; title: string; intro: string; minutes: number; setting: Setting; interest: Interest; condition?: Condition; activities: Activity[]; source: 'preview' | 'ollama' | 'backboard'; model: string; latency_seconds: number; tokens: number; cached: boolean }
export interface WalkMeasurement { prepMs: number; sessionMs: number; hiddenMs: number; screenChecks: number; active: boolean; interruptions: number; timingWarnings: number }
export interface SavedWalk { pack: Pack; completed: string[]; reflection: string; savedAt: string; finishedAt?: string; audio: Record<string, Blob>; measurement?: WalkMeasurement }
export interface Status { backend: string; model: string; model_ready: boolean; voice_ready: boolean; usage: Record<string, number>; limits: Record<string, number> }
