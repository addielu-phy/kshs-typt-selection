export const PRESENTATION_SECONDS = 180;

export function parseRoster(text = '') {
  const cleaned = String(text).replace(/^\uFEFF/, '').trim();
  if (!cleaned) return [];
  const lines = cleaned.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const rawNames = lines.length === 1 && /[,;\t]/.test(lines[0])
    ? lines[0].split(/[,;\t]/)
    : lines.map(line => {
        const cells = line.split(/[,;\t]/).map(cell => cell.trim()).filter(Boolean);
        return cells.at(-1) || '';
      });
  const headers = new Set(['姓名', '學生姓名', 'name', 'student', 'student name']);
  const seen = new Set();
  return rawNames
    .map(name => name.replace(/^["']|["']$/g, '').trim())
    .filter(name => {
      const key = name.toLocaleLowerCase();
      if (!name || headers.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function shuffleWithRandom(items, random = Math.random) {
  const values = [...items];
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

export function createSession(roster, random = Math.random) {
  if (!Array.isArray(roster) || roster.length === 0) throw new Error('名單至少需要 1 位學生。');
  return {
    roster: [...roster],
    order: shuffleWithRandom(roster, random),
    current: 0,
    completed: [],
    secondsLeft: PRESENTATION_SECONDS,
    timerRunning: false,
    finished: false,
  };
}

export function advanceStudent(state) {
  if (state.finished) return { ...state };
  const currentName = state.order[state.current];
  const completed = currentName ? [...state.completed, currentName] : [...state.completed];
  const current = Math.min(state.current + 1, state.order.length);
  return {
    ...state,
    current,
    completed,
    secondsLeft: PRESENTATION_SECONDS,
    timerRunning: false,
    finished: current >= state.order.length,
  };
}

export function previousStudent(state) {
  if (state.current <= 0) return { ...state, secondsLeft: PRESENTATION_SECONDS, timerRunning: false };
  const current = state.current - 1;
  return {
    ...state,
    current,
    completed: state.completed.slice(0, current),
    secondsLeft: PRESENTATION_SECONDS,
    timerRunning: false,
    finished: false,
  };
}

export function remainingSeconds(deadlineMs, nowMs = Date.now()) {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}

export function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}
