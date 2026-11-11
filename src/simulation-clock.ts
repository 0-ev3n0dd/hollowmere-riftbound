/** One shared wall clock for RAF and background wakes: never double-count time. */
export class SimulationClock {
  readonly stepSeconds = 1 / 60;
  readonly maxBacklogSeconds = 60;
  private last: number | null = null;
  private debt = 0;
  steps = 0;

  get backlogSeconds() {
    return this.debt;
  }

  reset(now: number) {
    this.last = now;
    this.debt = 0;
  }

  pump(
    now: number,
    active: () => boolean,
    step: (dt: number) => void,
    maxSteps: number,
  ) {
    if (this.last === null || !active()) {
      this.reset(now);
      return 0;
    }
    const elapsed = Math.max(0, now - this.last) / 1000;
    this.last = Math.max(this.last, now);
    // A suspended process cannot run. Bound recovery rather than replaying hours.
    this.debt = Math.min(this.maxBacklogSeconds, this.debt + elapsed);
    let count = 0;
    while (this.debt + 1e-10 >= this.stepSeconds && count < maxSteps) {
      this.debt = Math.max(0, this.debt - this.stepSeconds);
      step(this.stepSeconds);
      count++;
      this.steps++;
      if (!active()) {
        this.debt = 0; // Manual pause/draft/death never banks simulation time.
        break;
      }
    }
    return count;
  }
}
