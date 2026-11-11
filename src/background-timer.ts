// A dedicated worker supplies wake-ups when requestAnimationFrame is suspended.
// Simulation remains on the main thread and always uses bounded fixed steps.
let timer: ReturnType<typeof setInterval> | undefined;
self.onmessage = (event: MessageEvent<string>) => {
  if (event.data === "start" && timer === undefined) {
    timer = setInterval(() => self.postMessage("tick"), 250);
  } else if (event.data === "stop") {
    clearInterval(timer);
    timer = undefined;
  }
};
export {};
