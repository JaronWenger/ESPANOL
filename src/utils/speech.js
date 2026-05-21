// Trigger Chrome's async voice loading as early as possible
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener('voiceschanged', () => {});
}

// Chrome GC fix: V8 collects the utterance object after speak() returns,
// cutting audio mid-word. A module-level reference prevents collection.
let _utterance = null;

function pickSpanishVoice() {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return (
    voices.find(v => v.lang === 'es-ES') ||
    voices.find(v => v.lang.startsWith('es-')) ||
    voices.find(v => v.lang.startsWith('es')) ||
    null
  );
}

// Speak Spanish text robustly across Chrome and Safari.
// Chrome requires: explicit voice set + resume() to unstick after cancel().
// Safari requires: no delay between cancel() and speak().
export function speakEs(text, { rate = 0.75, onStart, onEnd } = {}) {
  const ss = window.speechSynthesis;
  if (!ss || !text) return;

  const makeUtter = () => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-ES';
    utter.rate = rate;
    const voice = pickSpanishVoice();
    if (voice) utter.voice = voice;
    if (onStart) utter.onstart = onStart;
    utter.onend = () => { _utterance = null; onEnd?.(); };
    utter.onerror = () => { _utterance = null; };
    return utter;
  };

  if (ss.speaking || ss.pending) {
    // Already speaking: cancel the stuck utterance and wait for Chrome to settle.
    // Speech was already activated by a prior call so no user gesture needed here.
    ss.cancel();
    _utterance = null;
    setTimeout(() => {
      _utterance = makeUtter();
      ss.speak(_utterance);
    }, 150);
  } else {
    // Idle: speak immediately — must stay within the user gesture call stack.
    _utterance = makeUtter();
    ss.speak(_utterance);
  }
}
