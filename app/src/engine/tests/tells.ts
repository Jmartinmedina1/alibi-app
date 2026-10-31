import { addBot, apply, createGame, nextWake, tick } from '../engine';
import type { Game } from '../types';
let rounds=0, decoyRounds=0, topSus=0, liarSusOnReal=0, liarReacts=0, detSusOnReal=0, detReacts=0;
function play(seed:number){
  let now=1e6; let s=seed; const rnd=()=>((s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff);
  const g:Game=createGame({code:'T',host:{id:'h0',name:'H',emoji:'🐬'},settings:{practice:true,pack:'party',rounds:2},seed,now});
  for(let i=0;i<3;i++) addBot(g); apply(g,'h0',{type:'start'},now);
  let n=0; const seen=new Set<number>();
  while(g.phase!=='gameover'&&n++<20000){ now+=400;
    const tryA=(a:any)=>{try{apply(g,'h0',a,now)}catch{}};
    const ex=g.round?.exchanges.at(-1);
    if(g.phase==='answer'&&ex?.targetId==='h0') tryA({type:'answer',cardId:ex.options!.find(o=>o.real)!.id});
    else if(['intro','case','reveal','result'].includes(g.phase)) tryA({type:'ready'});
    else if(g.phase==='pick'&&ex?.askerId==='h0') tryA({type:'pickTarget',targetId:g.players.find(p=>p.id!=='h0')!.id,topic:ex.topicChoices[0]});
    else if(g.phase==='vote'){ tryA({type:'vote',targetId:g.players[1].id}); }
    else if(g.phase==='guess'){ const r=g.round!; if(r.liarId==='h0') tryA({type:'guess',locationId:r.locationId}); }
    if(g.phase==='vote'&&g.round&&!seen.has(g.round.n)){ seen.add(g.round.n); const r=g.round;
      if(r.liarId!=='h0'){ rounds++;
        let decoy=false; const sus:Record<string,number>={};
        for(const e of r.exchanges){ if(!e.pickedId) continue; const c=e.options!.find(o=>o.id===e.pickedId)!;
          if(e.targetId===r.liarId&&!c.real) decoy=true;
          for(const [p,x] of Object.entries(e.reactions)){ if(p==='h0') continue; if(x==='sus') sus[e.targetId!]=(sus[e.targetId!]??0)+1;
            if(c.real){ const isL=p===r.liarId; if(isL){liarReacts++; if(x==='sus')liarSusOnReal++;} else {detReacts++; if(x==='sus')detSusOnReal++;} } } }
        if(decoy) decoyRounds++;
        const top=Object.entries(sus).sort((a,b)=>b[1]-a[1]); if(top.length&&top[0][0]===r.liarId&&(top[1]?.[1]??-1)<top[0][1]) topSus++;
      } }
    tick(g,now); const w=nextWake(g); if(w!=null&&w>now+400) now=w; }
}
for(let i=1;i<=600;i++) play(i);
const pc=(a:number,b:number)=>(100*a/b).toFixed(0)+'%';
console.log(`bot-liar rounds ${rounds}: liar picked a wrong answer ${pc(decoyRounds,rounds)}; liar clearly most-suspected by bots ${pc(topSus,rounds)}; liar "sus" on true answers ${pc(liarSusOnReal,liarReacts)} vs detective bots ${pc(detSusOnReal,detReacts)}`);
