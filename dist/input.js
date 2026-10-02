// 不主动捕获鼠标。即使在控件外松手、切换窗口或切换章节，也会结束手势。
export function bindGesture(target, { start=()=>{}, move=()=>{}, end=()=>{}, cancel=()=>{}, enabled=()=>true, signal }, surface=window) {
  let pointer=null;
  function releaseCapture(id){try{if(target.hasPointerCapture?.(id))target.releasePointerCapture(id)}catch{}}
  function stop(event,completed=false){if(pointer===null)return;const id=pointer;pointer=null;releaseCapture(id);if(!signal.aborted)(completed?end:cancel)(event);}
  target.addEventListener('pointerdown',event=>{
    if(!enabled()||pointer!==null||event.button!==0||event.isPrimary===false)return;
    pointer=event.pointerId;start(event);
  },{signal});
  surface.addEventListener('pointermove',event=>{
    if(event.pointerId!==pointer)return;
    if(event.pointerType==='mouse'&&event.buttons===0){stop(event);return}
    move(event);
  },{signal});
  surface.addEventListener('pointerup',event=>{if(event.pointerId===pointer)stop(event,true)},{signal});
  surface.addEventListener('pointercancel',event=>{if(event.pointerId===pointer)stop(event)},{signal});
  target.addEventListener('lostpointercapture',event=>{if(event.pointerId===pointer)stop(event)},{signal});
  surface.addEventListener('blur',event=>stop(event),{signal});
  surface.addEventListener('pointerout',event=>{if(event.relatedTarget===null&&event.pointerType==='mouse')stop(event)},{signal});
  signal.addEventListener('abort',()=>{if(pointer!==null)releaseCapture(pointer);pointer=null},{once:true});
  return ()=>stop({type:'cancel'});
}
