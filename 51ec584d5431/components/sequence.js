/** A finite, manually advanced sequence. Navigation remains owned by the deck. */
export function mountSequence(slide, specification, onChange = () => {}) {
  let step = 0, busy = false, generation = 0;
  let animations = [];
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const snapshot = () => ({step, busy, count: specification.states.length, title: specification.states[step]});
  function cancelAnimations() { generation++; animations.forEach(a => a.cancel()); animations = []; }
  function render() {
    slide.querySelectorAll('[data-reveal]').forEach(el => el.classList.toggle('dim', step < +el.dataset.reveal));
    slide.querySelectorAll('[data-part]').forEach(el => el.classList.toggle('highlight', (specification.highlights?.[step] || []).includes(el.dataset.part)));
    slide.querySelectorAll('.step-list span').forEach((el, i) => el.classList.toggle('current', i === step - 1));
    slide.querySelector('.scene-caption').textContent = specification.captions[step];
    slide.dataset.step = step;
    slide.dataset.busy = String(busy);
    onChange(snapshot());
  }
  function jump(target) { cancelAnimations(); busy = false; step = Math.max(0, Math.min(specification.states.length - 1, target)); render(); }
  async function play(replay = false) {
    if (busy || (!replay && step === specification.states.length - 1) || (replay && step === 0)) return false;
    if (!replay) step++;
    const token = ++generation;
    busy = true; render();
    const packet = slide.querySelector('.sequence-packet');
    const paths = specification.paths?.[step] || [];
    if (!reduced()) {
      for (const path of paths) {
        if (token !== generation) return false;
        const target = packet || slide.querySelector('.scene-caption');
        const frames = packet ? path.map(([x,y]) => ({transform:`translate(${x}px, ${y}px)`,opacity:1})) : [{opacity:.2},{opacity:1}];
        const animation = target.animate(frames,{duration:packet?850:450,easing:'linear',fill:'none'});
        animations.push(animation);
        await animation.finished.catch(() => {});
      }
      if (!paths.length) {
        const a = slide.querySelector('.scene-caption').animate([{opacity:.2},{opacity:1}],{duration:450});
        animations.push(a); await a.finished.catch(() => {});
      }
    }
    if (token !== generation) return false;
    busy = false; animations = []; render(); return true;
  }
  render();
  return {next:()=>play(),previous(){if(step===0)return false;jump(step-1);return true;},replay:()=>play(true),jump,cancel:()=>jump(step),getState:snapshot,states:specification.states};
}

export const sequences = {
  ecosystem: {
    states:['点としての接続','複数の接続領域','面として捉える'],
    captions:['AgentとLLMの接続から考え始める。','Agent同士、APIや業務データへの接続も加わる。','接続全体に共通する制御と運用を設計する。']
  },
  code: {
    states:['全体像','必要なツールを探す','処理をコードにする','複数APIを呼び出す','結果を集約・加工する','必要な結果を返す'],
    captions:['デモで見た結果を、内部の流れから振り返ります。','目的に必要なツールと、呼び出し方を探す。','LLMが、呼出しと加工をまとめたコードを組み立てる。','Code Mode MCPの実行環境から、複数APIを呼び出す。','中間データは実行側で扱い、必要な形へ集約・加工する。','処理した結果を返し、Agent / LLMが回答に使う。'],
    highlights:[[],['search'],['agent'],['runtime','apis'],['runtime'],['agent']],
    paths:{1:[[[275,160],[400,160],[400,88],[500,88]],[[500,88],[400,88],[400,160],[275,160]]],2:[[[275,235],[500,235]]],3:[[[950,238],[1075,238],[1075,98],[1165,98]],[[1165,98],[1075,98],[1075,238],[950,238]],[[950,238],[1165,238]],[[1165,238],[950,238]],[[950,238],[1075,238],[1075,348],[1165,348]],[[1165,348],[1075,348],[1075,238],[950,238]]],4:[[[540,267],[820,267],[820,311],[540,311],[540,355],[820,355]]],5:[[[500,290],[275,290]]]}
  },
  architecture: {
    states:['管理面','実行環境を構成','リクエストを処理','同じ実行経路から結果を返す'],
    captions:['Konnectでソースと構成、デプロイを管理する。','GatewayとCode Mode MCPが、実行を担う。','Agentの呼出しはGatewayを経て、MCP Serverと接続先へ。','実リクエストの往復は管理面を経由しない。'],
    highlights:[['control'],['gateway','server'],['gateway','server'],['gateway','server']],
    paths:{1:[[[510,105],[510,235]],[[1010,105],[1010,235]]],2:[[[250,310],[380,310],[640,310],[835,310],[1180,310],[1290,310]]],3:[[[1290,310],[1180,310],[835,310],[640,310],[380,310],[250,310]]]}
  }
};
