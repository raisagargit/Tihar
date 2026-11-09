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

  function fit(){
    scale=Math.min(window.innerWidth/1080,window.innerHeight/1920);
    stage.style.transform='translate(-50%,-50%) scale('+scale+')';
  }
  fit();window.addEventListener('resize',fit);

  function setP(v){
    p=Math.max(0,Math.min(travel,v));
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
    candle.className='';
    candle.style.transition='transform .2s ease-out,opacity '+(0.5*S)+'s ease';
    candle.style.transform='translateY('+(-travel)+'px)';
    document.getElementById('wrap').className='hide-hint';
    later(function(){candle.style.opacity=0;fade(lit,500);},150);
    later(function(){fade(document.getElementById('f1'),450);},900);
    later(function(){fade(document.getElementById('f2'),500);},1450);
    later(function(){fade(document.getElementById('f3'),500);},2000);
    later(function(){fade(document.getElementById('f4'),600);},2650);
    later(function(){replay.className='show';},3600);
  }
  candle.addEventListener('pointerdown',function(e){
    if(done)return;
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
