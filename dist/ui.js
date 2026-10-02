import { CONFIG } from './config.js';
export const escapeHTML = str => String(str).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const button = (key,id,extra='',kind='primary') => `<button id="${id}" class="${kind}" ${extra}>${escapeHTML(CONFIG.buttons[key])}</button>`;
export const orbit = () => `<div class="orbit-art" aria-hidden="true"><div class="orbit-glow"></div><div class="orbit three"></div><div class="orbit"></div><div class="orbit two"></div><span class="hero-star">✦</span><span class="satellite">✧</span><span class="satellite other">✧</span><span class="orbit-label">为你留住一束星光</span><span class="orbit-caption">今天，宇宙偏心于你</span></div>`;
export function chapter(number, title, subtitle = '') { return `<div class="chapter"><p class="eyebrow">你的特别旅程 · ${['序章','第一章','第二章','第三章','第四章','第五章'][number]}</p><h2>${title}</h2>${subtitle ? `<p class="subtext">${subtitle}</p>` : ''}</div>`; }
export function progress(step) { return `<nav class="journey" aria-label="生日旅程进度">${['相遇','升级','集星','礼物','许愿'].map((s,i)=>`<span class="${i < step ? 'done' : i === step ? 'current' : ''}" ${i === step ? 'aria-current="step"' : ''}><i aria-hidden="true">${i < step ? '✓' : '✧'}</i>${s}</span>`).join('')}</nav>`; }
export function giftArt(i, opened = false) { return `<span class="gift-art tone-${i} ${opened?'opened':''}" aria-hidden="true"><i class="gift-lid"></i><i class="gift-body"></i><i class="gift-ribbon"></i><i class="gift-bow"></i><i class="gift-spark">✧</i></span>`; }
export function cake(lit = false) { return `<button class="cake-scene ${lit?'lit':''}" id="cake-art" aria-label="生日蛋糕，轻点一下"><span class="cake-aura" aria-hidden="true"></span><span class="cake-art" aria-hidden="true"><span class="candles">${[0,1,2,3,4].map(i=>`<i class="candle" style="--i:${i}"><b class="flame"></b><b class="wick"></b></i>`).join('')}</span><span class="cake-top"></span><span class="cake-layer upper"></span><span class="cake-icing"><i></i><i></i><i></i><i></i><i></i></span><span class="cake-layer lower"></span><span class="cake-dots">✧　 ·　 ✧　 ·　 ✧</span><span class="cake-plate"></span></span></button>`; }
let toastTimer;
export function toast(message) { const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4200); }
export function dialog(title, content, {confirm = CONFIG.buttons.close, onConfirm = () => {}, onClose = () => {}, cancel} = {}) {
  const el=document.querySelector('#dialog');
  document.querySelector('#dialog-content').innerHTML=`<p class="eyebrow">有一份心意给你</p><h2 id="dialog-title">${escapeHTML(title)}</h2>${content}<div class="actions"><button id="dialog-confirm" class="primary">${escapeHTML(confirm)}</button>${cancel?`<button id="dialog-cancel" class="secondary">${escapeHTML(cancel)}</button>`:''}</div>`;
  el.setAttribute('aria-labelledby','dialog-title');
  el.onclose=()=>{ if(!el.open) { document.querySelector('#dialog-content').replaceChildren(); onClose(); } };
  document.querySelector('#dialog-confirm').onclick=()=>{el.close();onConfirm();};
  if(cancel) document.querySelector('#dialog-cancel').onclick=()=>el.close();
  if(!el.open) el.showModal();
}
export function scope() {
  const controller=new AbortController();const timers=new Set();
  return {signal:controller.signal, after(fn,ms){const id=setTimeout(()=>{timers.delete(id);if(!controller.signal.aborted)fn()},ms);timers.add(id);return id}, every(fn,ms){const id=setInterval(()=>{if(!controller.signal.aborted)fn()},ms);timers.add(id);return id}, stop(){controller.abort();for(const id of timers){clearTimeout(id);clearInterval(id)}timers.clear()}};
}
