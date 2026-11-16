// Küçük, dosyasız geri bildirim sesleri (Web Audio)
let ctx: AudioContext | null = null;

function ton(frekanslar: number[], sure = 0.09, tip: OscillatorType = "sine", ses = 0.06) {
  try {
    ctx ??= new AudioContext();
    const t0 = ctx.currentTime;
    frekanslar.forEach((f, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = tip;
      o.frequency.value = f;
      const bas = t0 + i * sure;
      g.gain.setValueAtTime(0, bas);
      g.gain.linearRampToValueAtTime(ses, bas + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, bas + sure * 1.8);
      o.connect(g).connect(ctx!.destination);
      o.start(bas);
      o.stop(bas + sure * 2);
    });
  } catch {
    // ses desteklenmiyorsa sessiz devam
  }
}

export const sesler = {
  dogru: () => ton([660, 990], 0.08, "triangle"),
  yanlis: () => ton([220, 185], 0.12, "sine", 0.05),
  bitis: () => ton([523, 659, 784, 1047], 0.1, "triangle"),
};
