// 用普通文本框接收中文输入法，不替换正在组合的文字；遮字只由样式负责。
export function mountWishInput(field, counter, mask, signal) {
  let composing=false;
  const update=()=>{
    const length=Array.from(field.value).length;
    counter.textContent=composing?'正在输入中文，选好字词后就会悄悄记下。':length?`已悄悄记下 ${length} 个字，内容已遮住。`:'支持中文输入。文字会被遮住，保存后可以由你亲手打开。';
    mask.textContent=length?'● '.repeat(Math.min(length,18)):'';
  };
  field.addEventListener('compositionstart',()=>{composing=true;update()},{signal});
  field.addEventListener('compositionend',()=>{composing=false;update()},{signal});
  field.addEventListener('input',update,{signal});
  update();
  return {get composing(){return composing},read(){return field.value.trim()},clear(){field.value='';composing=false;update()}};
}
