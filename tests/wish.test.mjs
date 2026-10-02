import test from 'node:test';
import assert from 'node:assert/strict';
import { mountWishInput } from '../dist/wish.js';

function setup(){const field=new EventTarget();field.value='';const counter={textContent:''},mask={textContent:''};const controller=new AbortController();return{field,counter,mask,controller,input:mountWishInput(field,counter,mask,controller.signal)}}
test('中文输入法组合期间不改写输入，选字后完整保留中文',()=>{
  const t=setup();t.field.dispatchEvent(new Event('compositionstart'));
  t.field.value='xiang';t.field.dispatchEvent(new Event('input'));
  assert.equal(t.input.composing,true);assert.equal(t.field.value,'xiang');
  t.field.value='湘湘，愿你平安喜乐';t.field.dispatchEvent(new Event('compositionend'));t.field.dispatchEvent(new Event('input'));
  assert.equal(t.input.composing,false);assert.equal(t.input.read(),'湘湘，愿你平安喜乐');assert.doesNotMatch(t.mask.textContent,/湘|平安|xiang/);
});
test('中文、多行和表情不丢失，计数按字符而不是编码长度',()=>{
  const t=setup();t.field.value='愿望\n平安✨';t.field.dispatchEvent(new Event('input'));
  assert.equal(t.input.read(),'愿望\n平安✨');assert.match(t.counter.textContent,/6 个字/);
  t.input.clear();assert.equal(t.field.value,'');assert.equal(t.mask.textContent,'');
});
test('离开输入章节会撤销组合事件监听',()=>{
  const t=setup();t.controller.abort();t.field.dispatchEvent(new Event('compositionstart'));assert.equal(t.input.composing,false);
});
