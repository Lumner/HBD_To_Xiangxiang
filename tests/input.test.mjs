import test from 'node:test';
import assert from 'node:assert/strict';
import { bindGesture } from '../dist/input.js';

function setup(options={},nativeTouch=false){
  const target=new EventTarget(),surface=new EventTarget(),controller=new AbortController(),log=[];
  if(nativeTouch)surface.ontouchstart=null;
  target.setPointerCapture=()=>{throw Error('不应该捕获鼠标')};target.hasPointerCapture=()=>false;
  bindGesture(target,{signal:controller.signal,start:()=>log.push('start'),move:()=>log.push('move'),end:()=>log.push('end'),cancel:()=>log.push('cancel'),...options},surface);
  function send(type,where=surface,extra={}){const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:1,pointerType:'mouse',button:0,buttons:1,isPrimary:true,changedTouches:[{identifier:7}],touches:type==='touchend'?[]:[{identifier:7}],...extra});where.dispatchEvent(e);return e}
  return{target,surface,controller,log,send};
}
test('在控件外松手也结束手势，不捕获鼠标，不重复结束',()=>{const t=setup();t.send('pointerdown',t.target);t.send('pointermove');t.send('pointerup');t.send('pointerup');assert.deepEqual(t.log,['start','move','end'])});
test('切换窗口与指针取消会清理长按状态',()=>{for(const kind of ['blur','pointercancel']){const t=setup();t.send('pointerdown',t.target);t.send(kind);t.send('pointerup');assert.deepEqual(t.log,['start','cancel'])}});
test('漏掉松手事件后，鼠标无按钮移动会自动恢复',()=>{const t=setup();t.send('pointerdown',t.target);t.send('pointermove',t.surface,{buttons:0});t.send('pointerdown',t.target);t.send('pointerup');assert.deepEqual(t.log,['start','cancel','start','end'])});
test('切换章节撤销监听，不会把后续点击困在旧控件上',()=>{const t=setup();t.send('pointerdown',t.target);t.controller.abort();t.send('pointerup');t.send('pointerdown',t.target);assert.deepEqual(t.log,['start'])});
test('第二根手指不能意外结束当前手势',()=>{const t=setup();t.send('pointerdown',t.target);t.send('pointerup',t.surface,{pointerId:2});assert.deepEqual(t.log,['start']);t.send('pointerup');assert.deepEqual(t.log,['start','end'])});
test('手机长按阻止系统手势，指针取消不会抢先结束真实触点',()=>{
  const t=setup({touchHold:true},true);
  t.send('pointerdown',t.target,{pointerType:'touch'});
  assert.equal(t.send('touchstart',t.target).defaultPrevented,true);
  assert.equal(t.send('contextmenu',t.target).defaultPrevented,true);
  t.send('pointercancel',t.surface,{pointerType:'touch'});
  t.send('lostpointercapture',t.target,{pointerType:'touch'});
  assert.deepEqual(t.log,['start']);
  assert.equal(t.send('touchmove').defaultPrevented,true);
  t.send('touchend');t.send('pointerup',t.surface,{pointerType:'touch'});
  assert.deepEqual(t.log,['start','move','end']);
});
test('手机长按在控件外真实松手只完成一次，第二根手指不干扰',()=>{
  const t=setup({touchHold:true},true);t.send('touchstart',t.target);
  t.send('touchend',t.surface,{changedTouches:[{identifier:8}],touches:[{identifier:7}]});
  assert.deepEqual(t.log,['start']);t.send('touchend');t.send('touchend');
  assert.deepEqual(t.log,['start','end']);
});
test('真实触摸取消或窗口失焦清理蓄力，随后可重新长按',()=>{
  for(const reason of ['touchcancel','blur']){
    const t=setup({touchHold:true},true);t.send('touchstart',t.target);t.send(reason);t.send('touchend');
    t.send('touchstart',t.target);t.send('touchend');
    assert.deepEqual(t.log,['start','cancel','start','end']);
  }
});
test('切到轻触模式或离开章节后不阻止默认触摸和点击',()=>{
  let enabled=false;const t=setup({touchHold:true,enabled:()=>enabled},true);
  assert.equal(t.send('touchstart',t.target).defaultPrevented,false);assert.deepEqual(t.log,[]);
  enabled=true;t.send('touchstart',t.target);t.controller.abort();t.send('touchend');
  assert.equal(t.send('touchstart',t.target).defaultPrevented,false);assert.deepEqual(t.log,['start']);
});
test('不支持原生触摸事件的设备仍可使用触摸指针，鼠标行为保留',()=>{
  const t=setup({touchHold:true});t.send('pointerdown',t.target,{pointerType:'touch'});t.send('pointerup',t.surface,{pointerType:'touch'});
  t.send('pointerdown',t.target);t.send('pointerup');assert.deepEqual(t.log,['start','end','start','end']);
});
