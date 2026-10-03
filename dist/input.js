// 鼠标不主动捕获；手机长按独立跟踪真实触点，避免系统长按取消指针流。
export function bindGesture(target, { start=()=>{}, move=()=>{}, end=()=>{}, cancel=()=>{}, enabled=()=>true, touchHold=false, signal }, surface=window) {
  let pointer=null,touch=null;
  const nativeTouch=touchHold&&'ontouchstart' in surface;
  function releaseCapture(id){try{if(target.hasPointerCapture?.(id))target.releasePointerCapture(id)}catch{}}
  function stop(event,completed=false){if(pointer===null&&touch===null)return;const id=pointer;pointer=null;touch=null;if(id!==null)releaseCapture(id);if(!signal.aborted)(completed?end:cancel)(event);}
  target.addEventListener('pointerdown',event=>{
    if(nativeTouch&&event.pointerType==='touch')return;
    if(!enabled()||pointer!==null||touch!==null||event.button!==0||event.isPrimary===false)return;
    pointer=event.pointerId;start(event);
  },{signal});
  if(nativeTouch){
    const changed=event=>Array.from(event.changedTouches).some(point=>point.identifier===touch);
    // 必须是局部、非被动的监听：只在长按控件上阻止系统选字、菜单和滚动。
    target.addEventListener('touchstart',event=>{
      if(!enabled()||pointer!==null||touch!==null||event.touches.length!==1)return;
      if(event.cancelable)event.preventDefault();
      touch=event.changedTouches[0].identifier;start(event);
    },{signal,passive:false});
    surface.addEventListener('touchmove',event=>{
      if(touch===null||!changed(event))return;
      if(event.cancelable)event.preventDefault();move(event);
    },{signal,passive:false});
    surface.addEventListener('touchend',event=>{
      if(touch===null||!changed(event))return;
      if(event.cancelable)event.preventDefault();stop(event,true);
    },{signal,passive:false});
    surface.addEventListener('touchcancel',event=>{if(touch!==null&&changed(event))stop(event)},{signal});
  }
  if(touchHold)target.addEventListener('contextmenu',event=>{if(enabled())event.preventDefault()},{signal});
  surface.addEventListener('pointermove',event=>{
    if(event.pointerId!==pointer)return;
    if(event.pointerType==='mouse'&&event.buttons===0){stop(event);return}
    move(event);
  },{signal});
  surface.addEventListener('pointerup',event=>{if(event.pointerId===pointer)stop(event,true)},{signal});
  surface.addEventListener('pointercancel',event=>{if(event.pointerId===pointer)stop(event)},{signal});
  target.addEventListener('lostpointercapture',event=>{if(event.pointerId===pointer)stop(event)},{signal});
  surface.addEventListener('blur',event=>stop(event),{signal});
  surface.addEventListener('pointerout',event=>{if(pointer!==null&&event.relatedTarget===null&&event.pointerType==='mouse')stop(event)},{signal});
  signal.addEventListener('abort',()=>{if(pointer!==null)releaseCapture(pointer);pointer=null;touch=null},{once:true});
  return ()=>stop({type:'cancel'});
}
