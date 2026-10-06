// A small, local sound: no audio service or sponsor credit is needed.
export class TimerCue {
  private context: AudioContext | null = null;
  private scheduled: OscillatorNode[] = [];

  async ready(): Promise<boolean> {
    try {
      this.context ??= new AudioContext();
      await this.context.resume();
      return this.context.state === 'running';
    } catch { return false; }
  }

  private tones(at: number): OscillatorNode[] {
    if (!this.context) return [];
    return [523.25, 659.25].map((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      const start = at + index * .22;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.055, start + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .8);
      oscillator.connect(gain); gain.connect(this.context!.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(start); oscillator.stop(start + .85);
      return oscillator;
    });
  }

  schedule(seconds: number): void {
    this.cancel();
    if (this.context) this.scheduled = this.tones(this.context.currentTime + seconds);
  }

  preview(): void {
    if (this.context) this.tones(this.context.currentTime);
    this.vibrate();
  }

  complete(): void {
    // Let the already scheduled chime finish when the visual timer reaches zero.
    this.scheduled = [];
    this.vibrate();
  }

  private vibrate(): void {
    try { navigator.vibrate?.([100, 70, 100]); } catch { /* Optional browser support. */ }
  }

  cancel(): void {
    for (const oscillator of this.scheduled) {
      try { oscillator.stop(); } catch { /* An ended tone needs no cancellation. */ }
    }
    this.scheduled = [];
  }

  dispose(): void { this.cancel(); void this.context?.close(); }
}
