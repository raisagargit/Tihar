(function(){
  var BASE='img/';
  var SPEED=1;
  var q=new URLSearchParams(location.search).get('speed');
  var S=q==='fast'?0.5:(q==='slow'?1:SPEED);

  var FILES={bg:'bg.jpg',lit:'lit.jpg',f1:'f1.jpg',f2:'f2.jpg',f3:'f3.jpg',f4:'f4.jpg'};
  var stage=document.getElementById('stage'),
      candle=document.getElementById('candle'),
      replay=document.getElementById('replay'),
      lit=document.getElementById('lit'),
      scale=1,travel=290,p=0,startY=0,startP=0,dragging=false,done=false,timers=[];

  var pending=0;
  function loaded(){pending--;if(pending<=0)stage.className='ready';}
  for(var k in FILES){
    var el=document.getElementById(k);pending++;
    el.onload=loaded;el.onerror=loaded;el.src=BASE+FILES[k];
  }
  var ci=document.getElementById('candleimg');pending++;ci.onload=loaded;ci.onerror=loaded;ci.src=BASE+'candle.png';

  var AC=null,muted=false,master=null,noiseBuf=null;
  function initAudio(){
    if(AC){if(AC.state==='suspended'&&AC.resume)AC.resume();return;}
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C)return;
    try{
      AC=new C();
      master=AC.createGain();master.gain.value=0.9;master.connect(AC.destination);
      var len=AC.sampleRate*2;noiseBuf=AC.createBuffer(1,len,AC.sampleRate);
      var d=noiseBuf.getChannelData(0);for(var i=0;i<len;i++)d[i]=Math.random()*2-1;
    }catch(e){AC=null;}
  }
  function noise(){var s=AC.createBufferSource();s.buffer=noiseBuf;return s;}
  function boom(vol){
    if(!AC||muted)return;
    var t=AC.currentTime,n=noise(),f=AC.createBiquadFilter(),g=AC.createGain();
    f.type='lowpass';f.frequency.setValueAtTime(2200,t);f.frequency.exponentialRampToValueAtTime(90,t+0.7);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.8);
    n.connect(f);f.connect(g);g.connect(master);n.start(t,Math.random(),0.9);
    var o=AC.createOscillator(),og=AC.createGain();
    o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+0.35);
    og.gain.setValueAtTime(vol*0.9,t);og.gain.exponentialRampToValueAtTime(0.001,t+0.4);
    o.connect(og);og.connect(master);o.start(t);o.stop(t+0.45);
  }
  function whistle(){
    if(!AC||muted)return;
    var t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
    o.type='sine';o.frequency.setValueAtTime(500,t);o.frequency.exponentialRampToValueAtTime(1900,t+0.3);
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.12,t+0.05);g.gain.exponentialRampToValueAtTime(0.001,t+0.32);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+0.35);
  }
  function crackle(count,span){
    if(!AC||muted)return;
    var t0=AC.currentTime;
    for(var i=0;i<count;i++){
      var t=t0+Math.random()*span,n=noise(),f=AC.createBiquadFilter(),g=AC.createGain();
      f.type='highpass';f.frequency.value=1500+Math.random()*3000;
      g.gain.setValueAtTime(0.18+Math.random()*0.25,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.04+Math.random()*0.04);
      n.connect(f);f.connect(g);g.connect(master);n.start(t,Math.random(),0.1);
    }
  }
  var slideSrc=null,slideGain=null,slideFilt=null;
  function slideStart(){
    if(!AC||slideSrc)return;
    slideSrc=AC.createBufferSource();slideSrc.buffer=noiseBuf;slideSrc.loop=true;
    slideFilt=AC.createBiquadFilter();slideFilt.type='bandpass';slideFilt.Q.value=1.2;slideFilt.frequency.value=400;
    slideGain=AC.createGain();slideGain.gain.value=0;
    slideSrc.connect(slideFilt);slideFilt.connect(slideGain);slideGain.connect(master);slideSrc.start();
  }
  function slideMove(delta,prog){
    if(!slideSrc||muted)return;
    var t=AC.currentTime,v=Math.min(0.14,Math.abs(delta)*0.01);
    slideGain.gain.setTargetAtTime(v,t,0.02);
    slideGain.gain.setTargetAtTime(0,t+0.07,0.08);
    slideFilt.frequency.setTargetAtTime(350+prog*1100,t,0.05);
  }
  function slideStop(){
    if(!slideSrc)return;
    var s=slideSrc;
    slideGain.gain.setTargetAtTime(0,AC.currentTime,0.04);
    slideSrc=null;
    setTimeout(function(){try{s.stop();}catch(e){}},400);
  }
  function ignite(){
    if(!AC||muted)return;
    var t=AC.currentTime,n=noise(),f=AC.createBiquadFilter(),g=AC.createGain();
    f.type='bandpass';f.Q.value=0.8;f.frequency.setValueAtTime(500,t);f.frequency.exponentialRampToValueAtTime(2600,t+0.3);
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.3,t+0.08);g.gain.exponentialRampToValueAtTime(0.001,t+0.55);
    n.connect(f);f.connect(g);g.connect(master);n.start(t,Math.random(),0.6);
  }
  var muteBtn=document.getElementById('mute');
  muteBtn.addEventListener('click',function(){
    initAudio();muted=!muted;
    muteBtn.innerHTML=muted?'Sound off':'Sound on';
  });

  function unlock(){
    initAudio();
    if(AC&&AC.state!=='running'&&AC.resume){try{AC.resume();}catch(e){}}
  }
  var evs=['pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','click','keydown'];
  for(var ei=0;ei<evs.length;ei++)document.addEventListener(evs[ei],unlock,true);

  function fit(){
    scale=Math.min(window.innerWidth/1080,window.innerHeight/1920);
    stage.style.transform='translate(-50%,-50%) scale('+scale+')';
  }
  fit();window.addEventListener('resize',fit);

  function setP(v){
    var old=p;
    p=Math.max(0,Math.min(travel,v));
    slideMove(p-old,p/travel);
    candle.style.transform='translateY('+(-p)+'px)';
    if(p>=travel*0.93&&!done)light();
  }
  function later(fn,ms){timers.push(setTimeout(fn,ms*S));}
  function fade(el,ms){
    var t=(ms*S/1000)+'s';
    el.style.webkitTransition='opacity '+t+' ease';el.style.transition='opacity '+t+' ease';
    el.style.opacity=1;
  }
  function light(){
    done=true;dragging=false;
    initAudio();
    slideStop();
    candle.className='';
    candle.style.transition='transform .2s ease-out,opacity '+(0.5*S)+'s ease';
    candle.style.transform='translateY('+(-travel)+'px)';
    document.getElementById('wrap').className='hide-hint';
    later(ignite,150);
    later(function(){candle.style.opacity=0;fade(lit,500);},150);
    later(function(){fade(document.getElementById('f1'),450);},900);
    later(function(){fade(document.getElementById('f2'),500);},1450);
    later(function(){fade(document.getElementById('f3'),500);},2000);
    later(function(){fade(document.getElementById('f4'),600);},2650);
    later(function(){whistle();},650);
    later(function(){boom(0.9);},900);
    later(function(){whistle();},900);
    later(function(){boom(0.7);},1150);
    later(function(){crackle(20,0.9);},1300);
    later(function(){whistle();},1350);
    later(function(){boom(0.8);},1600);
    later(function(){crackle(24,1.2);},1700);
    later(function(){boom(0.5);crackle(16,0.8);},2100);
    later(function(){replay.className='show';},3600);
  }
  candle.addEventListener('pointerdown',function(e){
    if(done)return;
    initAudio();
    slideStart();
    dragging=true;startY=e.clientY;startP=p;
    candle.className='';candle.style.transition='none';
    document.getElementById('wrap').className='hide-hint';
    if(candle.setPointerCapture)candle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  candle.addEventListener('pointermove',function(e){
    if(dragging)setP(startP+(startY-e.clientY)/scale);
  });
  function release(){
    if(!dragging)return;dragging=false;
    slideStop();
    if(!done){candle.className='back';candle.style.transition='';setP(0);document.getElementById('wrap').className='';}
  }
  candle.addEventListener('pointerup',release);
  candle.addEventListener('pointercancel',release);

  replay.addEventListener('click',function(){
    for(var i=0;i<timers.length;i++)clearTimeout(timers[i]);timers=[];
    var all=[lit,document.getElementById('f1'),document.getElementById('f2'),document.getElementById('f3'),document.getElementById('f4')];
    for(var j=0;j<all.length;j++){all[j].style.transition='none';all[j].style.webkitTransition='none';all[j].style.opacity=0;}
    candle.style.transition='none';candle.style.opacity=1;candle.className='';p=0;candle.style.transform='';
    done=false;replay.className='';document.getElementById('wrap').className='';
  });
})();
