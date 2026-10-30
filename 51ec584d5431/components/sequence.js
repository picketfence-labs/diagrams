/** A finite, manually advanced sequence. Navigation remains owned by the deck. */
export function mountSequence(slide, specification, onChange = () => {}) {
  let step = 0, busy = false, generation = 0;
  const packet = slide.querySelector('.sequence-packet');
  let frame = null, settle = null;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const snapshot = () => ({step, busy, count: specification.states.length, title: specification.states[step]});
  function cancelAnimations() {
    generation++;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; settle?.(); settle = null;
    packet?.setAttribute('opacity','0');
  }
  // Keep moving packets in SVG coordinates; cancellation clears a single frame
  // and resolves the in-flight segment before another sequence can start.
  function move(path, token) {
    return new Promise(resolve => {
      settle = resolve;
      let start;
      const tick = now => {
        if (token !== generation) { settle = null; resolve(); return; }
        start ??= now;
        const progress = Math.min(1,(now-start)/850);
        const position = progress*(path.length-1);
        const index = Math.min(path.length-2,Math.floor(position));
        const fraction = position-index;
        const [a,b] = [path[index],path[index+1]];
        packet.setAttribute('cx',String(a[0]+(b[0]-a[0])*fraction));
        packet.setAttribute('cy',String(a[1]+(b[1]-a[1])*fraction));
        packet.setAttribute('opacity','1');
        if (progress < 1) frame = requestAnimationFrame(tick);
        else { frame = null; settle = null; packet.setAttribute('opacity','0'); resolve(); }
      };
      frame = requestAnimationFrame(tick);
    });
  }
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
    const paths = specification.paths?.[step] || [];
    if (!reduced() && packet) {
      for (const path of paths) {
        if (token !== generation) return false;
        await move(path,token);
      }
    }
    if (token !== generation) return false;
    busy = false; render(); return true;
  }
  render();
  return {next:()=>play(),previous(){if(step===0)return false;jump(step-1);return true;},replay:()=>play(true),jump,cancel:()=>jump(step),getState:snapshot,states:specification.states};
}

export const sequences = {
  code: {
    states:['全体像','必要なツールを探す','処理をコードにする','複数APIを呼び出す','結果を集約・加工する','必要な結果を返す'],
    captions:['申込・契約・商品から、成立率の上位5商品を出す。','ツールを探し、引数と返却形式をget_schemaで確認する。','LLMが、データ取得と成立率の計算をコードにする。','申込300件・契約200件・商品5件を、各APIから取得する。','商品IDごとに件数を集計し、成立率で並べ替える。','上位5商品の集計結果を返し、Agent / LLMが回答にする。'],
    highlights:[[],['search'],['agent'],['runtime','apis'],['runtime'],['agent']],
    paths:{1:[[[275,235],[500,235]]],2:[[[275,235],[500,235]]],3:[[[950,238],[1075,238],[1075,98],[1165,98]],[[1165,98],[1075,98],[1075,238],[950,238]],[[950,238],[1165,238]],[[1165,238],[950,238]],[[950,238],[1075,238],[1075,348],[1165,348]],[[1165,348],[1075,348],[1075,238],[950,238]]],4:[[[540,267],[820,267],[820,311],[540,311],[540,355],[820,355]]],5:[[[500,290],[275,290]]]}
  },
  architecture: {
    states:['Konnectでソースを登録','Kong Operatorが配置','Sandboxで実行','複数APIを呼び出す','小さな結果を返す'],
    captions:['KonnectにOpenAPI仕様とMCPのSourceを登録し、構成を管理する。','Kong OperatorがKubernetes上のGatewayとCode Mode MCPを配置・管理する。','Agentの依頼をGateway経由で受け、隔離されたSandboxでコードを実行する。','Sandbox側から必要なAPIを呼び出し、その場で結果を集約・加工する。','生データをAgentへ往復させず、必要な結果を小さく返す。'],
    highlights:[['control'],['gateway','server'],['server'],['server'],['server']],
    paths:{1:[[[510,105],[510,235]],[[1010,105],[1010,235]]],2:[[[250,310],[380,310],[640,310],[835,310],[1180,310],[1290,310]]],3:[[[1290,310],[1180,310],[835,310],[640,310],[380,310],[250,310]]]}
  }
};
