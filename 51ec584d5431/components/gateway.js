/** Page 5: follow one Agent request through routing, sanitizing and blocking. */
export function mountGateway(slide, onChange = () => {}) {
  const host = slide.querySelector('#gateway-host');
  const root = host.attachShadow({mode:'open'});
  root.append(slide.querySelector('#gateway-template').content.cloneNode(true));
  const $ = id => root.getElementById(id);
  const routes = ['g-route-agent','g-route-0','g-route-1','g-route-2','g-route-3','g-route-sanitizer','g-route-guard'];
  const states = [
    ['Agentと複数LLM','同じAIエージェントから、複数のLLMへ。','複数の接続先を、一つの経路で扱う。'],
    ['モデルを切り替える','Agentからの要求は同じ。選ぶモデルを変える。','OpenAI Sol → Claude Opus'],
    ['接続障害で切り替える','Azure OpenAIへ届かなければ、バックアップへ。','Azure OpenAI → バックアップ OpenAI'],
    ['送る前にマスクする','個人情報を外部サービスで処理し、LLMへ。','マスク前のデータはLLMへ送らない。'],
    ['危険な入力を止める','ジェイルブレイクを検知し、LLMへ送らない。','検知 → BLOCK']
  ];
  let step = 0, busy = false, generation = 0, frame = null, settle = null;
  const packet = $('g-packet');
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const snapshot = () => ({step,busy,count:states.length,title:states[step][0]});
  const visible = (id,on) => $(id).classList.toggle('g-visible',on);
  const names = [
    ['Claude','OpenAI','Gemini','ローカルモデル'],
    ['Claude Opus','OpenAI Sol','Gemini','ローカルモデル'],
    ['バックアップ OpenAI','Azure OpenAI','Gemini','ローカルモデル'],
    ['Claude','OpenAI','Gemini','ローカルモデル'],
    ['Claude','OpenAI','Gemini','ローカルモデル']
  ];
  function activeModel(index) {
    for(let i=0;i<4;i++) {
      $('g-model-'+i).classList.toggle('g-active',i===index);
      $('g-route-'+i).classList.toggle('g-hot',i===index);
    }
  }
  function clearMotion() {
    packet.classList.remove('g-visible','g-alert');
    for(const id of routes) $(id).classList.remove('g-hot','g-failed');
    $('g-model-1').classList.remove('g-error');
  }
  function render() {
    clearMotion();
    $('g-title').textContent=states[step][0];
    $('g-sentence').textContent=states[step][1];
    $('g-caption').textContent=states[step][2];
    for(let i=0;i<4;i++) {
      $('g-model-'+i).querySelector('strong').textContent=names[step][i];
      $('g-model-'+i).querySelector('span').textContent=step===2 && i===1?'接続失敗':'LLM';
      $('g-model-'+i).classList.toggle('g-muted',step===4 || (step===1||step===2) && i>1);
    }
    visible('g-sanitizer',step===3);
    visible('g-route-sanitizer',step===3);
    visible('g-guard',step===4);
    visible('g-route-guard',step===4);
    visible('g-sanitized',step===3);
    visible('g-block',step===4);
    $('g-agent-data').textContent=step===3?'カード番号 / 電話 / メール':step===4?'ジェイルブレイクを含む入力':'同じ要求の入口';
    $('g-gateway-state').textContent=['接続先を選ぶ','選択先: Claude Opus','代替: OpenAI','マスク済みを送る','BLOCK · 転送停止'][step];
    activeModel([null,0,0,1,null][step]);
    if(step>0)$('g-route-agent').classList.add('g-hot');
    if(step===2){$('g-model-1').classList.add('g-error');$('g-route-1').classList.add('g-failed')}
    slide.dataset.step=String(step);slide.dataset.busy=String(busy);
    onChange(snapshot());
  }
  function animate(duration, token, paint) {
    return new Promise(resolve=>{
      let start;settle=resolve;
      function tick(now){
        if(token!==generation){frame=null;settle=null;resolve(false);return}
        start??=now;const t=Math.min(1,(now-start)/duration);paint(t);
        if(t<1) frame=requestAnimationFrame(tick);
        else {frame=null;settle=null;resolve(true)}
      }
      frame=requestAnimationFrame(tick);
    });
  }
  async function travel(id,token,{reverse=false,alert=false}={}) {
    const path=$(id), length=path.getTotalLength();
    path.classList.add(alert?'g-failed':'g-hot');
    packet.classList.add('g-visible');packet.classList.toggle('g-alert',alert);
    const ok=await animate(Math.max(420,length/620*1000),token,t=>{
      const pt=path.getPointAtLength(length*(reverse?1-t:t));
      packet.setAttribute('transform',`translate(${pt.x} ${pt.y})`);
    });
    packet.classList.remove('g-visible','g-alert');
    path.classList.remove('g-hot','g-failed');
    if(id==='g-route-agent'&&step>0)path.classList.add('g-hot');
    return ok;
  }
  async function pause(ms,token){return animate(ms,token,()=>{})}
  function cancel(){
    generation++;if(frame!==null)cancelAnimationFrame(frame);frame=null;
    if(settle){settle(false);settle=null}busy=false;render();
  }
  function jump(target){cancel();step=Math.max(0,Math.min(states.length-1,target));render()}
  async function play(replay=false){
    if(busy || (!replay&&step===states.length-1) || (replay&&step===0))return false;
    if(replay){step--;render()}
    step++;const token=++generation;busy=true;render();
    if(reduced()){busy=false;render();return true}
    activeModel(null);let ok=true;
    if(step===1){
      $('g-gateway-state').textContent='選択先: OpenAI Sol';
      ok=await travel('g-route-agent',token);
      if(ok)ok=await travel('g-route-1',token);
      if(ok){activeModel(1);ok=await pause(500,token)}
      if(ok){$('g-gateway-state').textContent='選択先: Claude Opus';activeModel(null);ok=await pause(380,token)}
      if(ok)ok=await travel('g-route-agent',token);
      if(ok)ok=await travel('g-route-0',token);
      if(ok)activeModel(0);
    }else if(step===2){
      $('g-model-1').classList.remove('g-error');$('g-route-1').classList.remove('g-failed');
      $('g-gateway-state').textContent='第一候補: Azure';
      ok=await travel('g-route-agent',token);
      if(ok)ok=await travel('g-route-1',token);
      if(ok){$('g-model-1').classList.add('g-error');$('g-route-1').classList.add('g-failed');ok=await pause(650,token)}
      if(ok){$('g-gateway-state').textContent='代替: OpenAI';ok=await travel('g-route-0',token)}
      if(ok)activeModel(0);
    }else if(step===3){
      visible('g-sanitized',false);
      $('g-gateway-state').textContent='入力を検査';
      ok=await travel('g-route-agent',token);
      if(ok)ok=await travel('g-route-sanitizer',token);
      if(ok){$('g-gateway-state').textContent='マスク済みを送る';ok=await travel('g-route-sanitizer',token,{reverse:true})}
      if(ok)visible('g-sanitized',true);
      if(ok)ok=await travel('g-route-1',token);
      if(ok)activeModel(1);
    }else if(step===4){
      visible('g-block',false);$('g-gateway-state').textContent='入力を検査';
      ok=await travel('g-route-agent',token);
      if(ok)ok=await travel('g-route-guard',token);
      if(ok)ok=await travel('g-route-guard',token,{reverse:true,alert:true});
      if(ok){$('g-gateway-state').textContent='BLOCK · 転送停止';visible('g-block',true)}
    }
    if(token!==generation||!ok)return false;
    busy=false;render();return true;
  }
  render();
  return {next:()=>play(),previous(){if(step===0)return false;jump(step-1);return true},replay:()=>play(true),jump,cancel,getState:snapshot,states:states.map(([name])=>name)};
}
