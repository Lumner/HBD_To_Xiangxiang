import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { freshState, normalizeState, allocate, allocationFeedback, createStore, WISH_KEY, PROGRESS_KEY } from '../dist/state.js';
import { CONFIG } from '../dist/config.js';
import { escapeHTML } from '../dist/ui.js';

test('十项祝福可独立拉满，任何单项不能超出范围',()=>{
  let values=CONFIG.attributes.map(()=>0);
  for(let i=0;i<values.length;i++) values=allocate(values,i,100);
  assert.deepEqual(values,Array(10).fill(100));
  assert.equal(allocate(values,0,999)[0],100);
  assert.equal(allocate(values,0,-20)[0],0);
  assert.deepEqual(allocate(values,0,25).slice(1),Array(9).fill(100));
  assert.match(allocationFeedback(values).join(''),/每一项都为你拉满/);
});
test('满格属性、小游戏、礼物、蜡烛和最终章节都能恢复',()=>{
  const state={...freshState(),stage:'letter',attributes:Array(10).fill(100),completed:[0,1,2],gifts:[0,1,2,3,4],candle:'out',found:[0,1,2],rounds:[300,400,500,600,700]};
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(state))),state);
});
test('损坏的进度不能绕过解锁条件，也不会产生负属性',()=>{
  const state=normalizeState({version:1,stage:'letter',attributes:[-20,900,'坏数据'],completed:[0,0,8],gifts:[0]});
  assert.equal(state.stage,'hunt');
  assert.deepEqual(state.attributes.slice(0,3),[0,100,0]);
  assert.equal(normalizeState(null).stage,'intro');
  assert.equal(normalizeState({version:22}).stage,'intro');
});
test('愿望只进入独立本地键，可主动重读和删除',()=>{
  const memory=new Map();const local={getItem:key=>memory.get(key)??null,setItem:(key,v)=>memory.set(key,v),removeItem:key=>memory.delete(key)};
  const store=createStore(local);const secret='愿所有人平安，测试用愿望';
  assert.equal(store.saveWish(secret),true);store.save(freshState());
  assert.equal(memory.get(WISH_KEY),secret);
  assert.equal(memory.get(PROGRESS_KEY).includes(secret),false);
  assert.equal(store.readWish(),secret);
  store.forgetWish();assert.equal(store.readWish(),null);
  store.saveWish(secret);store.reset();assert.equal(memory.size,0);
});
test('禁用存储和损坏数据仍可开始旅程，并只提示一次',()=>{
  let warnings=0;const broken={getItem(){throw Error()},setItem(){throw Error()},removeItem(){throw Error()}};
  const store=createStore(broken,()=>warnings++);
  assert.equal(store.load().stage,'intro');assert.equal(store.save(freshState()),false);assert.equal(store.saveWish('愿望'),false);assert.equal(store.readWish(),null);assert.equal(warnings,1);
  assert.equal(createStore({getItem:()=>'{'}).load().stage,'intro');
});
test('愿望展示转义网页字符，防止把录入内容当成代码',()=>{
  assert.equal(escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
test('没有上传请求、追踪脚本或远程资源；愿望输入使用遮字类型',async()=>{
  const files=await readdir(new URL('../dist/',import.meta.url));
  for(const name of files.filter(n=>/\.(js|html|css)$/.test(n))){const source=await readFile(new URL('../dist/'+name,import.meta.url),'utf8');assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|https?:\/\/(?!www\.w3\.org)/,name);}
  const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');assert.match(app,/<textarea id="wish"[^>]*inputmode="text"/);assert.doesNotMatch(app,/type="password"|console\.log/);
});
test('集中配置中的展示文案没有额外外语',()=>{
  const {theme,...copy}=CONFIG;
  function check(v){if(typeof v==='string')assert.doesNotMatch(v.replaceAll('Happy Birthday to You',''),/[a-zA-Z]/);else if(Array.isArray(v))v.forEach(check);else if(v&&typeof v==='object')Object.values(v).forEach(check)}
  check(copy);
});
