import { CONFIG } from './config.js';
export const STAGES = ['intro', 'identity', 'upgrade', 'allocation', 'tasks', 'stars', 'hunt', 'reaction', 'energy', 'gifts', 'cake', 'letter'];
export const PROGRESS_KEY = 'starlight-birthday-progress-v1';
export const WISH_KEY = 'starlight-birthday-private-wish-v1';
export function freshState() { return { version: 1, stage: 'intro', attributes: CONFIG.attributes.map(() => 0), completed: [], gifts: [], found: [], fakeOpened: false, rounds: [], candle: 'unlit', eggs: [], attempts: { stars: 0, hunt: 0, reaction: 0 } }; }
const uniqueIndices = (a, n) => Array.isArray(a) ? [...new Set(a)].filter(v => Number.isInteger(v) && v >= 0 && v < n) : [];
export function normalizeState(value) {
  const s = freshState();
  if (!value || value.version !== 1) return s;
  s.stage = STAGES.includes(value.stage) ? value.stage : 'intro';
  s.attributes = CONFIG.attributes.map((_, i) => Math.min(CONFIG.points, Math.max(0, Math.floor(Number(value.attributes?.[i]) || 0))));
  s.completed = uniqueIndices(value.completed, 3); s.gifts = uniqueIndices(value.gifts, 5);
  s.found = uniqueIndices(value.found, 3); s.fakeOpened = value.fakeOpened === true;
  s.rounds = Array.isArray(value.rounds) ? value.rounds.filter(n => Number.isFinite(n) && n >= 0).slice(0, CONFIG.games.reaction.rounds) : [];
  s.candle = ['unlit','lit','hidden','out'].includes(value.candle) ? value.candle : 'unlit';
  s.eggs = Array.isArray(value.eggs) ? value.eggs.filter(n => ['star','cake'].includes(n)) : [];
  for (const key of Object.keys(s.attempts)) s.attempts[key] = Math.min(99, Math.max(0, Math.floor(Number(value.attempts?.[key]) || 0)));
  // 恢复时校验关键解锁条件，损坏的旧记录不会跳过必要步骤。
  const index = STAGES.indexOf(s.stage);
  if (index >= 8 && s.completed.length < 3) s.stage = ['stars','hunt','reaction'].find((_, i) => !s.completed.includes(i));
  else if (index >= 10 && s.gifts.filter(n => n < 4).length < 4) s.stage = 'gifts';
  if (s.stage === 'letter') { s.candle = 'out'; if (!s.gifts.includes(4)) s.gifts.push(4); }
  return s;
}
export function allocate(values, index, requested) {
  return values.map((n, i) => i === index ? Math.max(0, Math.min(CONFIG.points, Math.round(Number(requested) || 0))) : n);
}
export function allocationFeedback(values) {
  if (values.every(n => n === CONFIG.points)) return ['生日的祝福，当然不用做选择。快乐、健康、好运……每一项都为你拉满。', '愿你新的一岁，想要的都拥有，美好不必二选一。'];
  const entries = CONFIG.attributes.map((name,i) => ({ name, value: values[i] }));
  const max = Math.max(...values); const lines = [];
  if (Math.max(...values) - Math.min(...values) <= 3) lines.push('看来你选择了稳健发展路线。每一种美好，都值得拥有。');
  else {
    const top = entries.filter(e => e.value === max).map(e => e.name).join('、');
    lines.push(`收到！把更多的祝福留给${top}。愿你的偏爱，都有回响。`);
  }
  const v = name => entries.find(e => e.name === name)?.value ?? 10;
  if (v('睡眠') < 5) lines.push('友情提醒：似乎忘记给睡眠留一点位置。今晚记得早点休息。');
  if (v('财富') >= 25) lines.push('系统发现了一个非常明确的新年愿望。愿钱包也一起升级。');
  if (v('自由') >= 20) lines.push('愿你有说走就走的底气，也有说不的自由。');
  if (v('勇气') >= 20) lines.push('勇气已加满。下一次出发，请带着对自己的相信。');
  if (v('健康') >= 20) lines.push('先把自己照顾好，其他美好慢慢来。这个选择很棒。');
  if (v('快乐') >= 20) lines.push('快乐优先！不开心的事情，今天先排到队尾。');
  if (v('学业') + v('事业') >= 35) lines.push('愿认真努力的你，也常常得到意料之外的奖励。');
  return lines.slice(0,3);
}
export function createStore(storage, report = () => {}) {
  let warned = false;
  const warn = () => { if (!warned) { warned = true; report('这里暂时无法保存进度，但这次旅程仍然可以继续。'); } };
  const safe = (fn, fallback) => { try { return fn(); } catch { warn(); return fallback; } };
  return {
    load: () => safe(() => normalizeState(JSON.parse(storage.getItem(PROGRESS_KEY))), freshState()),
    save: s => safe(() => { storage.setItem(PROGRESS_KEY, JSON.stringify(s)); return true; }, false),
    saveWish: wish => safe(() => { storage.setItem(WISH_KEY, wish); return true; }, false),
    hasWish: () => safe(() => storage.getItem(WISH_KEY) !== null, false),
    readWish: () => safe(() => storage.getItem(WISH_KEY), null),
    forgetWish: () => safe(() => { storage.removeItem(WISH_KEY); return true; }, false),
    reset: () => safe(() => { storage.removeItem(PROGRESS_KEY); storage.removeItem(WISH_KEY); return true; }, false),
  };
}
