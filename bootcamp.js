'use strict';
// Curriculum overlay: preserve the original renderer, storage schema and IDs.
// All dynamic values are escaped. The application stays fully local/offline.
const legacyHome = navigationRoutes.home;
const legacyLesson = navigationRoutes.showLesson;
const previousConceptVisual = attachConceptVisual;
// Scope this richer interaction to the two environment lessons, keeping all
// mathematical visualizations and the learner's saved state untouched.
attachConceptVisual=function(lesson){
 if(['b1','w1d1'].includes(lesson.id))attachExecutionStudio();
 else previousConceptVisual(lesson);
};

function attachExecutionStudio(){
 const panel=document.createElement('section');
 panel.id='conceptVisual';panel.className='block execution-studio';panel.dataset.kind='environment';
 const icons=[
  '<rect x="4" y="7" width="24" height="21" rx="4"/><path d="M11 7V4h10v3M4 14h24M12 14v4h8v-4"/>',
  '<path d="M8 3h11l6 6v20H8zM19 3v7h6M12 17l-3 3 3 3M20 17l3 3-3 3M17 16l-3 8"/>',
  '<rect x="7" y="7" width="18" height="18" rx="4"/><path d="M12 1v6M20 1v6M12 25v6M20 25v6M1 12h6M1 20h6M25 12h6M25 20h6M13 12l7 4-7 4z"/>',
  '<rect x="3" y="5" width="26" height="23" rx="4"/><path d="M3 11h26M8 16l4 4-4 4M16 24h7"/>'
 ];
 const steps=[
  {name:'确认环境',tag:'选对工具箱',title:'先决定：由哪个 Python 来执行？',body:'conda activate 选择环境，影响后续找到的解释器和库。它还没有执行脚本；cd 只改变工作目录，不会替你换环境。',code:'尚未读取脚本',result:'等待运行'},
  {name:'读取脚本',tag:'找到要做的事',title:'脚本是指令，文件夹是寻找它的地址。',body:'在终端输入 python demo.py 后，解释器查找并读取这个脚本。示例假设 demo.py 已在工作目录中；真实文件不存在时会报错。',code:'print(2 + 3)',result:'等待计算'},
  {name:'解释与执行',tag:'真正开始计算',title:'Python 执行加法，再调用 print。',body:'解释器执行脚本里的指令：先得到 2 + 3 的值 5，再由 print 将它写到标准输出。这里是概念演示，省略了解析和字节码等内部细节。',code:'2 + 3 → 5',result:'准备输出'},
  {name:'查看输出',tag:'核对真实结果',title:'终端显示 5，不是终端自己算出了 5。',body:'这个例子中，终端显示 Python 写出的标准输出。出现提示符代表本次脚本结束；输出符合预期也只证明这次运行，不等于已经掌握全部知识。',code:'print(5)',result:'5'}
 ];
panel.innerHTML=`<div class="exec-heading"><div><span class="exec-kicker">EXECUTION STUDIO · 交互演示</span><h2>一行代码，怎样变成结果？</h2><p>点击任意阶段，或播放一次完整流程。每一步都能停下来观察。</p></div><span class="exec-demo">仅模拟 · 不执行命令</span></div><div class="exec-toolbar"><button id="execPlay" type="button" class="primary">▶ 播放流程</button><button id="execPrev" type="button" aria-label="上一步执行阶段">← 上一步</button><button id="execNext" type="button" aria-label="下一步执行阶段">下一步 →</button><button id="execReset" type="button">↺ 重置</button><label for="execSpeed">节奏<select id="execSpeed"><option value="2600">标准 · 2.6秒</option><option value="4500">慢速 · 4.5秒</option></select></label></div><div id="visualDrawing" class="exec-flow" role="group" aria-label="程序执行的四个阶段">${steps.map((s,i)=>`<button class="exec-step" data-exec-step="${i}" type="button" aria-pressed="false"><span class="exec-step-top"><span class="exec-index">0${i+1}</span><span class="exec-state">未开始</span></span><svg viewBox="0 0 32 32" aria-hidden="true"><title>${s.name}</title>${icons[i]}</svg><strong>${s.name}</strong><small>${s.tag}</small></button>`).join('')}</div><div class="exec-scrub"><label for="visualParameter">流程进度 <output id="visualValue"></output></label><input id="visualParameter" type="range" min="0" max="3" step="1" value="0" aria-label="选择执行阶段"></div><div class="exec-inspector"><div class="exec-explain"><span class="exec-kicker" id="execStageLabel"></span><h3 id="execStageTitle"></h3><p id="visualReading" aria-live="polite"></p><div class="exec-facts"><span>当前环境 <b id="execEnv"></b></span><span>工作目录 <b id="execCwd"></b></span></div></div><div class="exec-terminal"><div class="exec-terminal-bar"><span class="exec-dots" aria-hidden="true">● ● ●</span><span>Anaconda Prompt · 示意</span><span id="execTerminalStatus"></span></div><pre id="execTerminal" aria-label="模拟终端输出"></pre><div class="exec-code"><span>当前执行内容 · 示意</span><code id="execCode"></code></div></div></div><div class="exec-try"><div><h3>试一试：换目录，会换 Python 吗？</h3><p>分别切换下面两项，观察环境与路径。此脚本只用内置加法，在两个环境下都能得到 5。</p></div><div class="exec-scenarios"><button id="execChangeDir" type="button">切换工作目录</button><button id="execChangeEnv" type="button">切换 Conda 环境</button></div><p id="execScenarioFeedback" role="status">环境决定工具箱，目录决定在哪里找文件。</p></div><details><summary>为什么不把终端、环境和解释器画成同一个东西？</summary><p>终端承载命令与输出；Conda管理环境；环境中有Python解释器与已安装库；脚本描述要执行的操作。改变目录不改变解释器，改变环境也不会自动运行脚本。</p></details><p class="source-meta">示意目录 C:\\study / C:\\practice 和 demo.py 不代表本机已存在。本演示不会读写文件、切换实际环境或标记课程掌握。离开页面或切换学习面板会暂停播放；动画参数不作为学习进度保存。</p>`;
 const anchor=$('#learningBridge');if(anchor)anchor.after(panel);else $('.lesson-body').prepend(panel);
 const find=s=>panel.querySelector(s);
 let stage=0,playing=false,timer=null,environment='yantu-study',folder='C:\\study';
 const render=()=>{
  const step=steps[stage];
  panel.dataset.stage=String(stage);panel.classList.toggle('is-playing',playing);
  find('#visualParameter').value=stage;find('#visualParameter').setAttribute('aria-valuetext',`${stage+1} / 4 · ${step.name}`);
  find('#visualValue').textContent=`${stage+1} / 4 · ${step.name}`;
  find('#execStageLabel').textContent=`STEP 0${stage+1} / 04`;
  find('#execStageTitle').textContent=step.title;find('#visualReading').textContent=step.body;
  find('#execEnv').textContent=environment;find('#execCwd').textContent=folder;
  find('#execCode').textContent=step.code;find('#execTerminalStatus').textContent=step.result;
  const interpreter=environment==='base'?'C:\\ANACONDA\\python.exe':'…\\.conda\\envs\\yantu-study\\python.exe';
  const lines=[`(${environment}) ${folder}>`, `# 解释器：${interpreter}`];
  if(stage>=1)lines.push('> python demo.py');
  if(stage===2)lines.push('# 正在执行 print(2 + 3)…');
  if(stage===3)lines.push('5',`(${environment}) ${folder}>`);
  find('#execTerminal').textContent=lines.join('\n');
  for(const button of panel.querySelectorAll('[data-exec-step]')){const index=Number(button.dataset.execStep);button.setAttribute('aria-pressed',String(index===stage));button.classList.toggle('is-complete',index<stage);button.querySelector('.exec-state').textContent=index<stage?'已走过':index===stage?'正在看':'待查看';}
  find('#execPrev').disabled=stage===0;find('#execNext').disabled=stage===3;
  find('#execPlay').textContent=playing?'Ⅱ 暂停':stage===3?'↻ 重播流程':'▶ 播放流程';
 };
 const stop=()=>{clearTimeout(timer);timer=null;playing=false;render();};
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(!panel.isConnected||panel.hidden||document.hidden){stop();return;}stage++;if(stage>=3){stage=3;stop();}else{render();schedule();}},Number(find('#execSpeed').value));};
 const select=value=>{stop();stage=Math.max(0,Math.min(3,value));render();};
 find('#execPlay').onclick=()=>{if(playing)return stop();if(stage===3)stage=0;playing=true;render();schedule();};
 find('#execPrev').onclick=()=>select(stage-1);find('#execNext').onclick=()=>select(stage+1);
 find('#execReset').onclick=()=>{stop();stage=0;environment='yantu-study';folder='C:\\study';find('#execSpeed').value='2600';find('#execScenarioFeedback').textContent='环境决定工具箱，目录决定在哪里找文件。';render();};
 find('#visualParameter').oninput=e=>select(Number(e.target.value));
 find('#execSpeed').onchange=()=>{if(playing)schedule();};
 for(const button of panel.querySelectorAll('[data-exec-step]')){button.onclick=()=>select(Number(button.dataset.execStep));button.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const i=Number(button.dataset.execStep),next=e.key==='Home'?0:e.key==='End'?3:Math.max(0,Math.min(3,i+(e.key==='ArrowRight'?1:-1)));select(next);find(`[data-exec-step="${next}"]`).focus();}};}
 find('#execChangeDir').onclick=()=>{stop();folder=folder==='C:\\study'?'C:\\practice':'C:\\study';find('#execScenarioFeedback').textContent=`目录改为 ${folder}；环境仍是 ${environment}。真实运行还需检查新目录有没有 demo.py。`;render();};
 find('#execChangeEnv').onclick=()=>{stop();environment=environment==='base'?'yantu-study':'base';find('#execScenarioFeedback').textContent=`环境改为 ${environment}；工作目录仍是 ${folder}。这里只更新模拟状态，未操作本机。`;render();};
 // Stop immediately on tab changes/removal; disconnect all listeners to avoid
 // accumulating timers across repeated visits to a lesson.
 const visibility=()=>{if(document.hidden&&playing)stop();};
 document.addEventListener('visibilitychange',visibility);
 const observer=new MutationObserver(()=>{if(!panel.isConnected){clearTimeout(timer);document.removeEventListener('visibilitychange',visibility);observer.disconnect();}else if(panel.hidden&&playing)stop();});
 observer.observe(document.querySelector('#main'),{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
 render();
}
let bootWeekContext = null;
const mainSequence = () => [...new Set(course.curriculum.flatMap(w=>w.lessons))];
const mainWeek = id => course.curriculum.find(w=>w.lessons.includes(id));

function campHome(){
 active=null;bootWeekContext=null;
 const ids=mainSequence(),done=ids.filter(completed).length;
 const next=ids.includes(state.last)&&!completed(state.last)?state.last:ids.find(id=>!completed(id))||ids[0];
 const lesson=course.lessons.find(l=>l.id===next),week=mainWeek(next);
 page('学习总览',`<div class="eyebrow">DEEP LEARNING · BUILD WITH EVIDENCE</div><h1>从第一行 Python，走到可复现的项目。</h1><p class="muted">十六周深度学习训练营 · 每周12—16小时 · 以掌握程度推进，不催你赶进度</p><section class="hero"><div><span class="pill">第 ${week.id} 周 · ${esc(week.stage)}</span><h2>${esc(lesson.title)}</h2><p>先回忆，再动手，最后留下证据。已有笔记与原八周课程完整保留。</p><div class="actions"><button class="primary" id="continue">继续学习 →</button><button id="campStart">从第1周开始</button></div></div><div class="hero-art"><b>${done} / ${ids.length}</b><span>主线首轮验收记录</span><span>完成勾选 ≠ 独立掌握</span></div></section><div class="stats"><div class="stat"><b>16 周</b><span>基础 → 视觉 → LLM → 科研</span></div><div class="stat"><b>${course.lessons.filter(l=>due(l.id)).length}</b><span>到期复述 · 去复习页处理</span></div><div class="stat"><b>${[4,8,12,16].filter(n=>completed('p'+String(n).padStart(2,'0'))).length} / 4</b><span>项目关卡自评，不是证书</span></div></div><section class="camp-actions"><button id="allProjects">项目与能力验收</button><button id="campEvidence">课程核验与边界</button><button id="legacyTrack">原八周研究专项</button></section><div class="section-title"><h2>你的十六周路线</h2><small>先修没掌握就停一停；实习忙周可以顺延</small></div><div class="grid camp-grid">${course.curriculum.map(w=>{const d=w.lessons.filter(completed).length;return `<section class="card camp-week ${w.checkpoint?'checkpoint':''}"><span class="pill">${String(w.id).padStart(2,'0')} · ${esc(w.stage)}</span><h3>${esc(w.title)}</h3><p>${esc(w.project)}</p><div class="progress" role="progressbar" aria-label="第${w.id}周学习进度" aria-valuemin="0" aria-valuemax="${w.lessons.length}" aria-valuenow="${d}"><span style="width:${100*d/w.lessons.length}%"></span></div><small>${d}/${w.lessons.length} 项首轮验收 · ${w.hours}小时/周</small><button data-camp-week="${w.id}">进入第${w.id}周 →</button></section>`;}).join('')}</div><div class="warning">对齐训练营的课程顺序、练习和交付方式，不代表商业认证或就业保证。微型模型与合成数据验证机制；预训练LLM微调、真实业务泛化和论文结果尚需独立实施。</div>`);
 $('#continue').onclick=()=>showLesson(next);$('#campStart').onclick=()=>campWeek(1);
 $('#allProjects').onclick=()=>campProjects();$('#campEvidence').onclick=()=>campEvidence();$('#legacyTrack').onclick=()=>legacyOverview();
 $$bind('[data-camp-week]',b=>campWeek(Number(b.dataset.campWeek)));
}

function chapterRouteHTML(w,compact=false){
 const b=w.learning_bridge;if(!b)return '';
 const content=`<dl class="chapter-route"><div><dt>学前准备</dt><dd>${esc(b.before)}</dd></div><div><dt>本章解决什么</dt><dd>${esc(b.focus)}</dd></div><div><dt>之后通向哪里</dt><dd>${esc(b.after)}</dd></div><div><dt>章末再验收</dt><dd>${esc(b.ready)}</dd></div></dl>`;
 return compact?`<details class="chapter-context"><summary>本章路线 · 第${w.id}周：${esc(w.title)}</summary>${content}</details>`:`<section class="block chapter-context"><span class="pill">本章路线 · 不把章末目标当前置要求</span><h2>这一章接在哪里？</h2>${content}</section>`;
}

function campWeek(n){
 active=null;bootWeekContext=n;
 const w=course.curriculum.find(w=>w.id===n);
 page(`第${n}周 · ${w.title}`,`<div class="eyebrow">WEEK ${String(n).padStart(2,'0')} · ${esc(w.stage)}</div><h1>${esc(w.title)}</h1><p class="muted">预计12—16小时，含复习、修改代码和项目。不是仅把短课读完。</p><section class="block"><h2>本周要交付：${esc(w.project)}</h2><p>${esc(w.task)}</p><div class="example"><b>验收门槛</b><p>${esc(w.rubric)}</p></div><details><summary>每天怎么安排？</summary><p>周一概念与先修；周二手算；周三运行参考；周四只改一个变量并排错；周五对照；周六整理项目；周日休息或隔日复述。未达到验收就延长，不机械进入下周。</p></details></section><div class="lesson-list">${w.lessons.map((id,i)=>{const l=course.lessons.find(l=>l.id===id);return `<button class="lesson-row" data-camp-lesson="${id}"><div><span>${i+1} · ${esc(l.duration)}分钟 ${id.startsWith('p')?'· 项目交付':''}</span><br><b>${esc(l.title)}</b></div><span>${completed(id)?'✓ 首轮记录完成':lessonState(id).read?'继续':'进入 →'}</span></button>`;}).join('')}</div><div class="actions"><button id="weekProject">下载与运行本周项目</button><button id="weekPrev" ${n===1?'disabled':''}>← 前一周</button><button id="weekNext" ${n===16?'disabled':''}>后一周 →</button></div><pre id="campRunOutput" hidden aria-live="polite"></pre><p class="source-meta">运行不会勾选掌握；完整代码在项目课中可读。输出保存在labs/outputs，各次互不覆盖。</p>`);
 $('#main > .block').insertAdjacentHTML('beforebegin',chapterRouteHTML(w));
 $$bind('[data-camp-lesson]',b=>showLesson(b.dataset.campLesson));$('#weekProject').onclick=()=>runCamp(n,$('#weekProject'),$('#campRunOutput'));
 $('#weekPrev').onclick=()=>campWeek(n-1);$('#weekNext').onclick=()=>campWeek(n+1);
}

async function runCamp(n,button,output){
 button.disabled=true;output.hidden=false;output.textContent='运行CPU教学项目，不下载权重，不调用付费API…';
 try{const {job}=await api('/api/lab',{week:n,track:'bootcamp'});let result;
  do {await new Promise(resolve=>setTimeout(resolve,600));result=await api('/api/jobs/'+job);output.textContent=result.output;}while(result.status==='running');
  toast(result.status==='done'?'项目执行完成；请核对结果并独立修改。':'项目执行失败，请保留错误信息。');
 }catch(e){output.textContent=e.message;}finally{button.disabled=false;}
}

function campProjects(){
 active=null;page('项目与能力验收',`<h1>用作品，证明你能做什么。</h1><p>每周交付的文字、错误记录和证据索引写在项目课的练习区，会随学习备份一起保存。训练日志、权重在labs/outputs，需另行备份。四个关卡是自评，不冒充导师或第三方认证。</p><div class="grid">${course.curriculum.map(w=>`<section class="card ${w.checkpoint?'checkpoint':''}"><span class="pill">第${w.id}周 ${w.checkpoint?'· 关卡':''}</span><h2>${esc(w.project)}</h2><p>${esc(w.rubric)}</p><p>${completed('p'+String(w.id).padStart(2,'0'))?'✓ 首轮自评已记录':'待提交独立证据'}</p><button data-project="p${String(w.id).padStart(2,'0')}">填写项目证据 →</button></section>`).join('')}</div>`);$$bind('[data-project]',b=>showLesson(b.dataset.project));
}

function campEvidence(){
active=null;page('课程核验与边界',`<h1>课程依据与能力边界</h1><p>核验日期：${esc(course.verification.date)}。本次按个人读研技能的证据要求，区分官方事实、原创教学、小模型实测与未验证应用，不把生成材料当作你的掌握状态。</p><section class="block"><h2>这次改了什么</h2><p>保留原64课、22个短代码例子、2D/3D实验、主课与教学代码（私人原始附件不公开）。新增37节概念与工程桥梁课、16周项目课，重排为十六周主线。Python、数据与训练工程前置；LLM覆盖token、注意力、微型Transformer、SFT/LoRA、偏好优化、检索与安全评测；扩散移到第14周。</p><p>必修项目离线CPU可跑，无新增付费服务。没有自动完成真实LLM微调、企业部署或论文实验。后训练强化学习、分布式训练、大型多模态训练属于后续专题，不挤占本轮基础。</p><p>版本策略：本地Python3.10/PyTorch2.7教学代码实际测试。官方stable/main文档会更新，特别是TRL/PEFT参数；将来安装前要单独隔离环境、核对模型卡和兼容版本，不覆盖实验环境。</p></section><section class="block"><h2>优秀课程中借鉴的组织原则</h2><p>Hugging Face LLM Course明确要求良好Python基础，并建议先完成入门深度学习；因此本课不从LLM微调命令开头。采用概念→小练习→可复现项目→错误分析的路径。未复制外部课程全文，也没有它们的授权认证。</p></section><section class="block"><h2>官方文档与原论文</h2>${course.verification.sources.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></p>`).join('')}</section><div class="warning">联网核验保证所查来源与表述相符，不保证覆盖所有前沿。程序通过功能测试，也不等于教学效果经过学员或专家试验。课程短测是形成性自检；迁移任务和项目证据才是下一阶段依据。</div>`);
}

function bridgeReviewHTML(){const r=course.bridge_review;if(!r)return '';return `<section class="block"><h2>学习衔接与内容复审 · ${esc(r.date)}</h2><p>117节课分别说明本课承接与闭卷问题；16章分别列出准备、目标、去向和章末验收。旧专项实验编号与十六周主线明确分开。补充了矩阵梯度、归一化与LoRA初始化的条件，并收窄第14周项目的实际完成范围。</p><p>核验覆盖主课程及教学程序，不等于逐篇重审私人附件，也不是课程认证。真实数据训练、GPU性能及论文结论仍需单独验证。</p><details><summary>本轮复核的官方来源</summary>${r.sources.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)}</a></p>`).join('')}</details></section>`;}
const campEvidenceBeforeReview=campEvidence;
campEvidence=function(){campEvidenceBeforeReview();$('#main').insertAdjacentHTML('beforeend',bridgeReviewHTML());};
function legacyOverview(){bootWeekContext=null;legacyHome();$('#main').insertAdjacentHTML('afterbegin','<div class="warning">这里是保留的原八周专项路径。首页推荐使用十六周主线；旧课程与所有笔记仍可访问。</div>');}

function focusedLesson(id){
 legacyLesson(id);
 const l=course.lessons.find(l=>l.id===id);if(!l)return;
 const w=course.curriculum.find(w=>w.id===bootWeekContext&&w.lessons.includes(id))||mainWeek(id);
 if(w&&$('#learningBridge'))$('#learningBridge').insertAdjacentHTML('beforeend',chapterRouteHTML(w,true));
 if(l.support_ids?.length&&$('#learningBridge')){
  const parents=l.support_ids.map(id=>course.lessons.find(x=>x.id===id)).filter(Boolean);
  $('#learningBridge').insertAdjacentHTML('beforeend',`<details class="bridge-support"><summary>卡住时，回看这些具体概念</summary><p>按需要回看，不要求重复勾选完成。</p><div class="actions">${parents.map(x=>`<button data-bridge-support="${x.id}">${esc(x.title)}</button>`).join('')}</div></details>`);
  $$bind('[data-bridge-support]',b=>showLesson(b.dataset.bridgeSupport));
 }
 if(l.week&&$('#runLab')){
  $('#runLab').textContent=`下载原专项第${l.week}阶段实验`;
  $('#runLab').nextElementSibling.textContent=`此入口调用 labs/lab.py --week ${l.week}，编号沿用原八周专项，不是十六周主线周次。主线项目使用 labs/bootcamp.py。`;
 }
 // Override previous/next to follow the teaching sequence, not append order.
 const sequence=w?w.lessons:course.lessons.filter(x=>!x.bootcamp_week).map(x=>x.id),idx=sequence.indexOf(id);
 if(w){$('.eyebrow').textContent=`十六周主线 · 第${w.id}周 · ${l.duration}分钟`;
  $('.lesson-side .card').insertAdjacentHTML('afterbegin',`<button id="backCampWeek">← 第${w.id}周课程目录</button>`);
  $('#backCampWeek').onclick=()=>campWeek(w.id);
 }
 $('#prev').disabled=idx<=0;$('#prev').onclick=()=>showLesson(sequence[idx-1]);
 $('#next').textContent=idx===sequence.length-1?'返回本周验收':'下一课 →';
 $('#next').onclick=()=>idx===sequence.length-1?(w?campWeek(w.id):home()):showLesson(sequence[idx+1]);
 // Old catalog order is not the new pedagogical order: replace recall prompt.
 const recall=$('.lesson-body > details');
 if(recall&&recall.querySelector('#backPrerequisite')){recall.remove();}
 // Hide old broad prerequisites for reused lessons: present the actual prior step.
 const prerequisites=document.querySelectorAll('.lesson-side [data-jump]');for(const node of prerequisites)node.remove();
 if(w){const heading=[...document.querySelectorAll('.lesson-side h3')].find(h=>h.textContent==='先修知识');if(heading?.nextElementSibling)heading.nextElementSibling.textContent=w.learning_bridge?.before||'按本章路线回顾先修知识。';}
 if(idx>0){const before=course.lessons.find(x=>x.id===sequence[idx-1]);$('.lesson-side .card').insertAdjacentHTML('beforeend',`<p>本周上一环节：</p><button id="campPrereq">${esc(before.title)}</button>`);$('#campPrereq').onclick=()=>showLesson(before.id);}
 if(l.bootcamp_week){$('.lesson-side .card').insertAdjacentHTML('beforeend',`<hr><button id="campLab">下载第${l.bootcamp_week}周实验</button><button id="campCode">阅读完整注释代码</button><pre id="campRunOutput" hidden aria-live="polite"></pre>`);$('#campLab').onclick=()=>runCamp(l.bootcamp_week,$('#campLab'),$('#campRunOutput'));$('#campCode').onclick=()=>{$('#modalBody').innerHTML=`<h2>labs/bootcamp.py · 按week${l.bootcamp_week}函数定位</h2><p>每周独立函数；共用训练循环与注意力函数在同一文件。可在本机编辑器修改自己的副本。</p><pre>${esc(course.bootcamp_code)}</pre>`;$('#modal').showModal();};}
 if(['c17','c18','c19','c20','p09','p10'].includes(id))attachAttention();
 // Panels keep the actual inputs in the DOM: switching never loses unsaved text.
 const body=$('.lesson-body'),children=[...body.children];
 for(const node of children){node.dataset.pane=node.querySelector('#note')?'notes':node.querySelector('.quiz')?'quiz':node.querySelector('#answer')||node.querySelector('#copySnippet')?'practice':node.id==='originalMaterials'?'reference':'learn';}
 const tabs=document.createElement('div');tabs.className='focus-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','课程学习步骤');
 const choices=[['learn','1 理解与图解'],['practice','2 动手练习'],['quiz','3 检查理解'],['notes','4 笔记与复述']];
 if(children.some(node=>node.dataset.pane==='reference'))choices.push(['reference','原计划完整讲义']);
 tabs.innerHTML=choices.map(([key,title])=>`<button role="tab" id="tab-${key}" data-pane="${key}" aria-selected="false">${title}</button>`).join('');body.before(tabs);
 const choose=key=>{for(const node of children)node.hidden=node.dataset.pane!==key;for(const b of tabs.children){const selected=b.dataset.pane===key;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;}window.scrollTo(0,0);};
 for(const button of tabs.children){button.onclick=()=>choose(button.dataset.pane);button.onkeydown=e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const i=[...tabs.children].indexOf(button),n=choices.length;const target=e.key==='Home'?0:e.key==='End'?n-1:(i+(e.key==='ArrowRight'?1:n-1))%n;choose(tabs.children[target].dataset.pane);tabs.children[target].focus();}};}
 choose('learn');
}

function attachAttention(){
 const panel=document.createElement('section');panel.className='block attention-lab';panel.id='attentionLab';
 panel.innerHTML='<span class="pill">可计算的注意力热图</span><h2>未来位置为什么必须遮住？</h2><p>4个位置，每行是一个Query，每列是一个Key。颜色越深权重越大；V为[1,2,3,4]。对角分数固定2，其他分数0；选中行第4列分数可调。这里是手造分数，不是训练模型解释。</p><label for="attRow">查看Query行 <select id="attRow"><option value="0">第1行</option><option value="1">第2行</option><option value="2">第3行</option><option value="3">第4行</option></select></label><label for="attScore">第4列分数 <input id="attScore" type="range" min="-4" max="4" step="0.5" value="2"></label><label class="check"><input id="attMask" type="checkbox" checked>因果掩码：禁止读取未来</label><div id="attDrawing"></div><p id="attNumbers" aria-live="polite"></p><p>计算：先屏蔽未来，再逐行softmax，最后对V加权求和。注意力权重不是因果解释，也不是答案可信度。</p>';
 $('.lesson-body').prepend(panel);
 const redraw=()=>{const row=Number($('#attRow').value),score=Number($('#attScore').value),causal=$('#attMask').checked;
  const weights=Array.from({length:4},(_,i)=>{const z=Array.from({length:4},(_,j)=>causal&&j>i?-Infinity:i===row&&j===3?score:i===j?2:0);const m=Math.max(...z),e=z.map(x=>Math.exp(x-m)),sum=e.reduce((a,b)=>a+b,0);return e.map(x=>x/sum);});
  let cells='';for(let i=0;i<4;i++)for(let j=0;j<4;j++){const v=weights[i][j];cells+=`<rect x="${50+j*57}" y="${35+i*48}" width="55" height="46" fill="hsl(150,35%,${96-v*65}%)" stroke="${i===row?'#9d511b':'white'}"/><text x="${77+j*57}" y="${63+i*48}" text-anchor="middle" fill="${v>.55?'white':'#17372b'}">${v.toFixed(2)}</text>`;}
  $('#attDrawing').innerHTML=`<svg viewBox="0 0 320 250" role="img" aria-label="四乘四因果注意力权重热图"><text x="160" y="20" text-anchor="middle">列：Key位置 1 → 4</text>${cells}<text x="160" y="247" text-anchor="middle">行：Query位置 1 → 4</text></svg>`;
  const values=weights[row];$('#attNumbers').textContent=`第${row+1}行权重=[${values.map(x=>x.toFixed(4)).join(', ')}]，行和=${values.reduce((a,b)=>a+b,0).toFixed(4)}；输出Y=${values.reduce((s,x,i)=>s+x*(i+1),0).toFixed(4)}。${causal?'遮罩开启：未来分数再高也不能读取。':'遮罩关闭：可看到未来，不适用于自回归训练。'}`;
 };for(const el of panel.querySelectorAll('input,select'))el.oninput=redraw;redraw();
}

// Explicit registration ensures the independent Back button can restore all pages.
Object.assign(navigationRoutes,{home:campHome,showLesson:focusedLesson,campWeek,campProjects,campEvidence,legacyOverview});
home=trackedPage('home',campHome);showLesson=trackedPage('showLesson',focusedLesson);
campWeek=trackedPage('campWeek',campWeek);campProjects=trackedPage('campProjects',campProjects);campEvidence=trackedPage('campEvidence',campEvidence);legacyOverview=trackedPage('legacyOverview',legacyOverview);
renderNav=function(){
 $('#weeks').innerHTML=course.curriculum.map(w=>`<button class="nav" data-camp-week="${w.id}"><span class="week-num">${String(w.id).padStart(2,'0')}</span>${esc(w.title)}</button>`).join('');$$bind('#weeks [data-camp-week]',b=>campWeek(Number(b.dataset.campWeek)));
};
$('#home').onclick=()=>home();$('#studyGuide').textContent='◇ 原专项知识地图';
const projectNav=document.createElement('button');projectNav.className='nav';projectNav.id='projectNav';projectNav.textContent='▣ 项目与能力验收';projectNav.onclick=()=>campProjects();$('#reviews').after(projectNav);
document.title='研途 · 十六周深度学习训练营';
document.querySelector('footer').textContent='十六周是学习节奏，不是掌握保证。进度保存在本机；教学与真实研究结果分别记录。';
$('#search').placeholder='搜索 Python、CNN、注意力、LoRA、扩散…';
if(course&&state){renderNav();home();}

// ── Workspace UX 2.1 ────────────────────────────────────────────────────────
// Original implementations, informed by public open-source interaction patterns.
// No third-party runtime, CDN, telemetry or replacement of learner data.
const uxInitialHash=location.hash;
const uxPhases=[['01','打稳基础','Python · 数据 · 数学',1,4],['02','训练与工程','PyTorch · 视觉 · 调试',5,8],['03','语言与智能','Transformer · LLM · 评测',9,12],['04','研究与交付','部署 · 扩散 · 项目',13,16]];
const uxPreferences={get(key,fallback=null){try{return JSON.parse(localStorage.getItem('yantu-gh-learning-camp-ui:'+key))??fallback;}catch{return fallback;}},set(key,value){try{localStorage.setItem('yantu-gh-learning-camp-ui:'+key,JSON.stringify(value));}catch{toast('浏览器设置无法保存；课程仍可使用。');}}};
let uxActivePhase=0,uxRoute='home',uxCommandReturn=null,uxMenuReturn=null;
const uxIcons={home:'<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16"/>',review:'<path d="M4 9a8 8 0 1 1 0 7M4 3v6h6M12 8v5l3 2"/>',project:'<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M8 6V3h8v3M3 12h18M10 12v3h4v-3"/>',search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',book:'<path d="M12 5C8 2 4 3 2 4v15c3-2 7-1 10 1 3-2 7-3 10-1V4c-2-1-6-2-10 1v15"/>',settings:'<path d="M5 3v18M12 3v18M19 3v18M2 8h6M9 16h6M16 7h6"/>',check:'<path d="m5 12 4 4L20 5"/>',arrow:'<path d="M4 12h16M14 6l6 6-6 6"/>'};
function uxIcon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true">${uxIcons[name]||uxIcons.book}</svg>`;}
function uxSetHash(hash){history.replaceState(null,'','#'+hash);}
function uxLessonStatus(id){const s=lessonState(id);return completed(id)?'已完成首轮':s.read||s.answer||s.note?'学习中':'未开始';}
function uxSetActive(week=null){
 document.querySelectorAll('aside .nav').forEach(b=>{b.classList.remove('selected');b.removeAttribute('aria-current');});
 const top={home:'#home',map:'#routeMap',projects:'#projectNav',reviews:'#reviews',library:'#library',results:'#results',settings:'#uxSettings',materials:'#materials',coverage:'#materials',studyGuide:'#studyGuide'}[uxRoute];
 const button=week?document.querySelector(`#weeks [data-camp-week="${week}"]`):top?$(top):null;
 if(button){button.classList.add('selected');button.setAttribute('aria-current','page');const group=button.closest('details');if(group)group.open=true;}
 const ids=mainSequence(),count=ids.filter(completed).length;
 if($('#uxSidebarProgress'))$('#uxSidebarProgress').innerHTML=`<div><b>${count}</b> / ${ids.length} 学习单元 <span>${Math.round(100*count/ids.length)}%</span></div><div class="progress"><span style="width:${100*count/ids.length}%"></span></div><small>按掌握推进，不必赶进度</small>`;
}
renderNav=function(){
 $('#weeks').innerHTML=uxPhases.map(([index,name,desc,from,to],i)=>`<details class="ux-nav-group" ${i===0?'open':''}><summary><span>${index}</span><div>${name}<small>第 ${from}—${to} 周</small></div></summary><div>${course.curriculum.filter(w=>w.id>=from&&w.id<=to).map(w=>`<button class="nav" data-camp-week="${w.id}"><span class="week-num">${String(w.id).padStart(2,'0')}</span><span>${esc(w.title)}</span><i aria-label="${w.lessons.filter(completed).length}/${w.lessons.length}完成">${w.lessons.every(completed)?'✓':''}</i></button>`).join('')}</div></details>`).join('');
 $$bind('#weeks [data-camp-week]',b=>campWeek(Number(b.dataset.campWeek)));uxSetActive();
};
const uxOriginalPage=page;
page=function(title,html){uxOriginalPage(title,html);$('#uxMenuShade').hidden=true;$('#menu').setAttribute('aria-expanded','false');document.body.classList.toggle('ux-lesson',Boolean(active));$('#breadcrumb').textContent=title;window.studyDrafts?.status();};

function uxHome(){
 uxRoute='home';active=null;bootWeekContext=null;uxSetHash('home');
 const ids=mainSequence(),next=ids.includes(state.last)&&!completed(state.last)?state.last:ids.find(id=>!completed(id))||ids[0];
 const l=course.lessons.find(l=>l.id===next),w=mainWeek(next),done=ids.filter(completed).length;
 const reviewsDue=course.lessons.filter(l=>due(l.id)),wrong=course.lessons.filter(l=>Object.values(lessonState(l.id).scores||{}).includes(false));
 page('学习总览',`<div class="ux-page-heading"><div><div class="eyebrow">YOUR LEARNING WORKSPACE</div><h1>今天，把一个知识点学透。</h1><p class="muted">十六周深度学习路线 · 先理解，再验证，留下自己的证据。</p></div><span class="ux-local-badge">● 本地优先 · 无需账号</span></div><div class="ux-dashboard"><section class="ux-continue-card"><div class="ux-card-top"><span class="pill">继续上次的学习</span><span>WEEK ${String(w.id).padStart(2,'0')}</span></div><h2>${esc(l.title)}</h2><p>${esc(l.intuition)}</p><div class="ux-next-metadata"><span>${uxIcon('book')}${esc(l.duration)} 分钟</span><span>${esc(w.title)}</span></div><div class="actions"><button class="primary" id="continue">继续学习 ${uxIcon('arrow')}</button><button id="currentWeek">本周目录</button></div><div class="ux-progress-caption"><span>主线首轮验收记录</span><strong>${done} / ${ids.length}</strong></div><div class="progress"><span style="width:${100*done/ids.length}%"></span></div></section><section class="ux-inbox"><span class="eyebrow">LEARNING INBOX</span><h2>值得回看</h2><button id="uxDue"><b>${reviewsDue.length}</b><span>到期复述<small>隔一段时间，再讲一遍</small></span>${uxIcon('arrow')}</button><button id="uxWrong"><b>${wrong.length}</b><span>待纠正知识点<small>从错因找到下一步</small></span>${uxIcon('arrow')}</button><div class="ux-inbox-note">每周建议12—16小时。实习忙时减少任务，完成一项也算积累。</div></section></div><div class="section-title"><h2>学习路线</h2><button id="routeAll">查看完整16周 ${uxIcon('arrow')}</button></div><div class="ux-phase-tabs" role="tablist" aria-label="学习阶段">${uxPhases.map(([n,t,d,a,b],i)=>`<button role="tab" aria-selected="${i===uxActivePhase}" data-phase="${i}"><small>阶段 ${n}</small><strong>${t}</strong><span>第${a}—${b}周</span></button>`).join('')}</div><div id="uxHomeWeeks" class="grid camp-grid"></div><div class="ux-bottom-links"><button id="allProjects">项目与能力验收</button><button id="campEvidence">课程核验与边界</button><button id="legacyTrack">原八周研究专项</button></div>`);
 $('#continue').onclick=()=>showLesson(next);$('#currentWeek').onclick=()=>campWeek(w.id);$('#uxDue').onclick=()=>reviews();$('#uxWrong').onclick=()=>reviews();$('#routeAll').onclick=()=>uxCurriculum();
 $('#allProjects').onclick=()=>campProjects();$('#campEvidence').onclick=()=>campEvidence();$('#legacyTrack').onclick=()=>legacyOverview();
 const draw=()=>{const phase=uxPhases[uxActivePhase];$('#uxHomeWeeks').innerHTML=course.curriculum.filter(w=>w.id>=phase[3]&&w.id<=phase[4]).map(uxWeekCard).join('');$$bind('#uxHomeWeeks [data-camp-week]',b=>campWeek(Number(b.dataset.campWeek)));};
 for(const b of document.querySelectorAll('[data-phase]')){b.onclick=()=>{uxActivePhase=Number(b.dataset.phase);for(const t of document.querySelectorAll('[data-phase]'))t.setAttribute('aria-selected',String(t===b));draw();};b.onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const target=(Number(b.dataset.phase)+(e.key==='ArrowRight'?1:3))%4;const next=document.querySelector(`[data-phase="${target}"]`);next.click();next.focus();}};}
 draw();uxSetActive();
}
function uxWeekCard(w){const n=w.lessons.filter(completed).length;return `<section data-stage="${Math.floor((w.id-1)/4)}" class="card camp-week ${w.checkpoint?'checkpoint':''}"><div class="ux-card-top"><span class="ux-week-label">WEEK ${String(w.id).padStart(2,'0')}</span><span class="pill">${w.checkpoint?'阶段验收':n===w.lessons.length?'已完成首轮':n?'进行中':'可开始'}</span></div><h3>${esc(w.title)}</h3><p>${esc(w.project)}</p><div class="progress"><span style="width:${100*n/w.lessons.length}%"></span></div><div class="ux-card-bottom"><small>${n}/${w.lessons.length} 单元 · ${w.hours}小时/周</small><button data-camp-week="${w.id}" aria-label="进入第${w.id}周">进入 ${uxIcon('arrow')}</button></div></section>`;}
function uxCurriculum(){uxRoute='map';active=null;uxSetHash('map');page('完整学习路线',`<div class="eyebrow">CURRICULUM</div><h1>一条路线，四个阶段。</h1><p class="muted">先修、实践与项目验收依次推进。点击一周查看具体课程；所有旧笔记仍关联原课程。</p>${uxPhases.map(([n,t,d,a,b])=>`<section class="ux-phase-section"><div class="section-title"><div><span class="eyebrow">PHASE ${n} · 第${a}—${b}周</span><h2>${t}</h2></div><span class="muted">${d}</span></div><div class="grid">${course.curriculum.filter(w=>w.id>=a&&w.id<=b).map(uxWeekCard).join('')}</div></section>`).join('')}`);$$bind('#main [data-camp-week]',b=>campWeek(Number(b.dataset.campWeek)));uxSetActive();}
const uxWeekRenderer=navigationRoutes.campWeek;
function uxWeek(n){uxRoute='week';uxSetHash('week/'+n);uxWeekRenderer(n);uxSetActive(n);const w=course.curriculum.find(w=>w.id===n);$('#main').insertAdjacentHTML('afterbegin',`<nav class="ux-breadcrumbs" aria-label="面包屑"><button id="uxCrumbHome">总览</button><span>/</span><button id="uxCrumbMap">学习路线</button><span>/ 第${n}周</span></nav>`);$('#uxCrumbHome').onclick=()=>home();$('#uxCrumbMap').onclick=()=>uxCurriculum();$('#main .block').classList.add('ux-week-brief');}

const uxLessonRenderer=navigationRoutes.showLesson;
function lessonWeek(id){return course.curriculum.find(w=>w.id===bootWeekContext&&w.lessons.includes(id))||mainWeek(id);}
function lessonHash(id){const w=lessonWeek(id);return 'lesson/'+id+(course.curriculum.filter(x=>x.lessons.includes(id)).length>1&&w?'?week='+w.id:'');}
function uxLesson(id){
 uxRoute='lesson';uxSetHash(lessonHash(id));uxLessonRenderer(id);
 const lesson=course.lessons.find(l=>l.id===id);if(!lesson)return;
 const week=course.curriculum.find(w=>w.id===bootWeekContext&&w.lessons.includes(id))||mainWeek(id);
 uxSetActive(week?.id);
 $('#main').insertAdjacentHTML('afterbegin',`<nav class="ux-breadcrumbs" aria-label="面包屑"><button id="uxCrumbHome">总览</button>${week?`<span>/</span><button id="uxCrumbWeek">第${week.id}周 · ${esc(week.title)}</button>`:''}<span>/ 当前课程</span></nav><div class="ux-reading-tools"><button id="uxFocus" aria-pressed="${document.body.classList.contains('ux-focus')}">◉ 专注阅读</button><label for="uxFontSize">字号<select id="uxFontSize"><option value="16">标准</option><option value="18">大字</option><option value="20">更大</option></select></label></div>`);
 $('#uxCrumbHome').onclick=()=>home();if($('#uxCrumbWeek'))$('#uxCrumbWeek').onclick=()=>campWeek(week.id);
 // Keep location and reading controls on one row without covering the title.
 const headingTools=document.createElement('div');headingTools.className='ux-lesson-heading';$('#main').prepend(headingTools);headingTools.append($('.ux-breadcrumbs'),$('.ux-reading-tools'));
 $('#uxFocus').onclick=()=>{document.body.classList.toggle('ux-focus');const enabled=document.body.classList.contains('ux-focus');$('#uxFocus').setAttribute('aria-pressed',String(enabled));$('#uxFocus').textContent=enabled?'◉ 退出专注':'◉ 专注阅读';uxPreferences.set('focus',enabled);};
 if(document.body.classList.contains('ux-focus'))$('#uxFocus').textContent='◉ 退出专注';
 $('#uxFontSize').value=String(uxPreferences.get('font',16));$('#uxFontSize').onchange=e=>{document.documentElement.style.setProperty('--reading-size',e.target.value+'px');uxPreferences.set('font',Number(e.target.value));};
 const sidebar=$('.lesson-side .card');
 // Put long guidance behind an explicit disclosure, preserving existing actions.
 const guidance=document.createElement('details');guidance.className='ux-guidance';guidance.innerHTML='<summary>本课指导与实践工具</summary>';
 while(sidebar.firstChild)guidance.append(sidebar.firstChild);sidebar.append(guidance);
 sidebar.insertAdjacentHTML('afterbegin','<div class="ux-checklist"><span class="eyebrow">YOUR CHECKLIST</span><h3>这节课，走到哪里了？</h3><div id="uxLessonChecklist"></div></div><nav id="uxLessonToc" aria-label="当前面板目录"></nav>');
 const tabs=[...document.querySelectorAll('.focus-tabs [role=tab]')];
 $('.lesson-body').insertAdjacentHTML('afterend','<div class="ux-lesson-footer"><span id="uxStepHint"></span><button id="uxStepBack">← 上一步</button><button class="primary" id="uxStepNext">下一步 →</button></div>');
 function decoratePane(scroll=false){
  const selected=tabs.find(t=>t.getAttribute('aria-selected')==='true'),key=selected.dataset.pane,index=tabs.indexOf(selected);
  uxPreferences.set('pane:'+id,key);
  const nodes=[...document.querySelectorAll('.lesson-body > *')].filter(n=>!n.hidden);const toc=[];
  nodes.forEach(node=>{if(!node.id)node.id='ux-pane-section-'+[...node.parentElement.children].indexOf(node);node.setAttribute('role','tabpanel');node.setAttribute('aria-labelledby',selected.id);const h=node.querySelector('h2');if(h)toc.push([node.id,h.textContent]);});
  selected.setAttribute('aria-controls',nodes.map(n=>n.id).join(' '));
  $('#uxLessonToc').innerHTML=`<h3>本页内容</h3>${toc.map(([target,label])=>`<button data-toc="${target}">${esc(label)}</button>`).join('')}`;
  $$bind('[data-toc]',button=>document.getElementById(button.dataset.toc).scrollIntoView({block:'start',behavior:'auto'}));
  $('#uxStepHint').textContent=`${index+1} / ${tabs.length} · ${selected.textContent}`;
  $('#uxStepBack').disabled=index===0;$('#uxStepBack').onclick=()=>tabs[index-1].click();
  $('#uxStepNext').textContent=index===tabs.length-1?'回到本周目录':'下一步 →';$('#uxStepNext').onclick=()=>index===tabs.length-1?(week?campWeek(week.id):home()):tabs[index+1].click();
  if(scroll){const top=document.querySelector('.focus-tabs').getBoundingClientRect().top+scrollY-82;window.scrollTo(0,Math.max(0,top));}
 }
 for(const tab of tabs)tab.addEventListener('click',()=>decoratePane(true));
 $('.focus-tabs').addEventListener('keydown',()=>requestAnimationFrame(()=>decoratePane(false)));
 const remembered=uxPreferences.get('pane:'+id,'learn');const desired=tabs.find(t=>t.dataset.pane===remembered);if(desired&&desired.dataset.pane!=='learn')desired.click();else decoratePane(false);
 uxRefreshChecklist();
 for(const pre of document.querySelectorAll('.lesson-body pre')){if(pre.closest('.execution-studio'))continue;const button=document.createElement('button');button.className='ux-copy';button.textContent='复制代码';button.type='button';button.onclick=async()=>{try{await navigator.clipboard.writeText(pre.textContent);button.textContent='✓ 已复制';setTimeout(()=>{if(button.isConnected)button.textContent='复制代码';},1600);}catch{toast('复制不可用，请选中文本手动复制。');}};pre.before(button);}
}
function uxRefreshChecklist(){if(!$('#uxLessonChecklist')||!active)return;const s=lessonState(active);$('#uxLessonChecklist').innerHTML=[['阅读与解释',s.read,'learn'],['写出练习过程',s.answer?.trim().length>=10,'practice'],['独立练习自评',s.practice,'practice'],['两道自测正确',passed(active),'quiz']].map(([title,ok,pane])=>`<button data-checklist-pane="${pane}" class="${ok?'is-done':''}"><span>${ok?'✓':'○'}</span>${title}</button>`).join('');$$bind('[data-checklist-pane]',b=>$('#tab-'+b.dataset.checklistPane).click());}
const uxCoreUpdate=update;update=function(...args){uxCoreUpdate(...args);uxRefreshChecklist();uxSetActive(active?lessonWeek(active)?.id:null);studyDrafts.status();};

// Local drafts are an additional safety net, never a substitute for SQLite or
// a downloaded backup. Each page owns its key; one tab cannot erase another.
const uxDraftPrefix='yantu-gh-learning-camp-draft-v1:';
const uxDraftKey=uxDraftPrefix+crypto.randomUUID();
window.studyDrafts={
 retained:false,error:'',
 capture(){if(!state)return false;try{localStorage.setItem(uxDraftKey,JSON.stringify({app:'dacim-study-v1',schema:1,saved:Date.now(),baseRevision:revision,state}));this.retained=true;return true;}catch{this.retained=false;return false;}},
 acknowledge(){try{localStorage.removeItem(uxDraftKey);}catch{}this.retained=false;this.error='';},
 list(){const found=[];try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key?.startsWith(uxDraftPrefix))continue;try{const d=JSON.parse(localStorage.getItem(key));if(d.app==='dacim-study-v1'&&d.state?.schema===1&&course?.lessons.some(l=>l.id===d.state.last))found.push({key,...d});}catch{}}}catch{}return found.sort((a,b)=>b.saved-a.saved);},
 status(error){if(error!==undefined)this.error=error;const panel=$('#uxSaveAlert');if(!panel)return;const drafts=this.list().filter(d=>d.key!==uxDraftKey);const failed=dirty&&this.error;
  panel.hidden=!failed&&!drafts.length;$('#uxSaveMessage').textContent=failed?(this.retained?'修改已留在浏览器草稿中，尚未同步到浏览器数据库。':'修改尚未保存，且浏览器草稿不可用。请立即导出备份。'):(drafts.length?`发现 ${drafts.length} 份未同步草稿，请先查看再决定如何处理。`:'');
  $('#uxSaveDetail').textContent=failed?this.error:'';$('#uxRetrySave').hidden=!failed;$('#saveStatus').dataset.state=failed?'error':dirty?'pending':'saved';
 },
 async show(){const drafts=this.list();$('#modalBody').innerHTML=`<h2>草稿与恢复</h2><p>草稿只存于当前浏览器、当前地址。清理浏览器数据可能删除它；重要笔记请导出。不同窗口的版本不会自动互相覆盖。</p>${drafts.length?drafts.map((d,i)=>`<section class="card"><h3>${esc(new Date(d.saved).toLocaleString('zh-CN'))}</h3><p>课程：${esc(course.lessons.find(l=>l.id===d.state.last)?.title)} · 数据库基线 ${d.baseRevision}</p><div class="actions"><button data-draft-preview="${i}">查看内容</button><button data-draft-export="${i}">导出这份草稿</button><button data-draft-restore="${i}">核对并恢复</button></div></section>`).join(''):'<p class="empty">没有待恢复草稿。已同步的笔记保存在浏览器数据库。</p>'}`;
  $$bind('[data-draft-export]',b=>{const d=drafts[Number(b.dataset.draftExport)];download('研途草稿备份.json',{app:'dacim-study-v1',exported:new Date().toISOString(),state:d.state});});
  $$bind('[data-draft-preview]',b=>{const d=drafts[Number(b.dataset.draftPreview)];const pre=document.createElement('pre');pre.className='document';pre.textContent=JSON.stringify(d.state,null,2);b.closest('section').append(pre);b.disabled=true;});
  $$bind('[data-draft-restore]',async b=>{const d=drafts[Number(b.dataset.draftRestore)];try{await saveQueue;if(dirty)throw Error('当前页面也有未同步修改，请先导出或保存当前内容。');const server=await api('/api/state');if(server.revision!==d.baseRevision)throw Error('数据库版本已变化。为避免覆盖另一窗口，请导出草稿，比较后手动合并笔记。');if(!confirm('将恢复此草稿并保存；同时会下载当前数据库内容作为恢复前备份。继续？'))return;download('研途恢复前备份.json',{app:'dacim-study-v1',state:server.state});state=d.state;revision=server.revision;conflict=false;await persist();if(dirty)throw Error('尚未同步成功；草稿保留。');localStorage.removeItem(d.key);$('#modal').close();home();this.status();toast('草稿已恢复并写入本机。');}catch(e){toast(e.message);}});
  if(!$('#modal').open)$('#modal').showModal();
 }
};

function uxSettings(){uxRoute='settings';active=null;uxSetHash('settings');page('设置与备份',`<div class="eyebrow">LOCAL & PRIVATE</div><h1>你的学习，留在你的电脑。</h1><section class="block"><h2>保存与恢复</h2><p>学习进度写入当前浏览器IndexedDB。连接中断时新增浏览器草稿保护；恢复时仍检查版本，不覆盖其他窗口。浏览器草稿不是永久备份。</p><div class="actions"><button id="uxBackupNow" class="primary">导出学习备份</button><button id="uxDraftsNow">查看未同步草稿</button><button id="uxImportNow">导入备份</button></div><p>导出的JSON包含笔记、练习和自评；实验权重、图片、日志需另行备份labs/outputs。</p></section><section class="block"><h2>使用说明</h2><p>Ctrl / ⌘ + K 打开课程与资料快捷搜索；Esc关闭弹窗或手机目录。课程内可调字号、启用专注阅读，并记住每课上次学习面板。</p><p>完成清单是形成性自评，不是能力认证。没有真实结果时，项目证据应明确写未测。</p></section><section class="block"><h2>本次借鉴的开源交互案例</h2><p>核验日期：2026-10-03。Stars是关注度，不是教学质量评分；以下为GitHub页面显示的近似值，可能变化。</p><div class="ux-case"><a href="https://github.com/freeCodeCamp/freeCodeCamp" target="_blank" rel="noopener">freeCodeCamp · 456.7k stars</a><p>借鉴自定节奏的课程→练习→项目路径；不复制认证或宣称同等学习效果。</p></div><div class="ux-case"><a href="https://github.com/withastro/starlight" target="_blank" rel="noopener">Starlight · 9.4k stars</a><p>借鉴分组折叠侧栏、当前位置与内容导航。参考官方Sidebar指南。</p></div><div class="ux-case"><a href="https://github.com/mantinedev/mantine" target="_blank" rel="noopener">Mantine · 31.8k stars</a><p>借鉴AppShell、Spotlight与Tabs的职责分离、键盘交互和响应式组织。</p></div><p>本机界面为独立HTML/CSS/JavaScript实现，没有复制第三方组件源码或引入React/CDN，也没有向这些网站上传学习数据。</p></section>`);$('#uxBackupNow').onclick=()=>$('#export').click();$('#uxDraftsNow').onclick=()=>studyDrafts.show();$('#uxImportNow').onclick=()=>$('#import').click();uxSetActive();}

function uxSearchOpen(){uxCommandReturn=document.activeElement;const dialog=$('#uxCommand');if(!dialog.open)dialog.showModal();$('#uxCommandInput').value='';uxSearchResults('');$('#uxCommandInput').focus();}
function uxSearchResults(query){const q=query.trim().toLowerCase();const match=(title,body)=>title.toLowerCase().includes(q)||body.toLowerCase().includes(q);let items=[];
 if(!q){items=[{type:'action',id:'continue',title:'继续学习',detail:'回到最近学习的课程'},{type:'action',id:'map',title:'完整学习路线',detail:'查看四个阶段与16周课程'},{type:'action',id:'drafts',title:'查看草稿与恢复',detail:'保护未同步的学习内容'}];}
 else{items=course.lessons.filter(l=>match(l.title,l.explanation)).sort((a,b)=>Number(b.title.toLowerCase().includes(q))-Number(a.title.toLowerCase().includes(q))).slice(0,12).map(l=>({type:'lesson',id:l.id,title:l.title,detail:`课程 · ${uxLessonStatus(l.id)} · ${l.duration}分钟`}));items.push(...sources.filter(s=>match(s.title,s.body)).slice(0,5).map(s=>({type:'source',id:s.id,title:s.title,detail:'原始资料 · 本地全文'})));}
 $('#uxCommandResults').innerHTML=items.length?items.map((item,i)=>`<button data-command="${i}"><span>${uxIcon(item.type==='source'?'book':'arrow')}</span><div><b>${esc(item.title)}</b><small>${esc(item.detail)}</small></div><span>↵</span></button>`).join(''):'<div class="empty">没有找到匹配项。试试“梯度”“注意力”或“LoRA”。</div>';
 $('#uxCommandCount').textContent=q?`显示 ${items.length} 项 · 输入框按↓进入结果`:'常用入口 · 输入知识点开始搜索';
 $$bind('[data-command]',b=>{const item=items[Number(b.dataset.command)];$('#uxCommand').close();if(item.type==='lesson')showLesson(item.id);else if(item.type==='source')openSource(item.id);else if(item.id==='map')uxCurriculum();else if(item.id==='drafts')studyDrafts.show();else showLesson(state.last);});
}
function uxCloseMenu(){document.body.classList.remove('menu-open');$('#uxMenuShade').hidden=true;$('#menu').setAttribute('aria-expanded','false');uxMenuReturn?.focus();}
function uxSetupShell(){
 document.body.classList.add('ux-shell');document.documentElement.style.setProperty('--reading-size',uxPreferences.get('font',16)+'px');document.body.classList.toggle('ux-focus',uxPreferences.get('focus',false));
 const sidebar=document.querySelector('aside');sidebar.id='uxSidebar';sidebar.setAttribute('aria-label','学习导航');
 document.querySelector('.brand').innerHTML='<span class="mark">研</span><div>研途 <small>DEEP LEARNING WORKSPACE</small></div>';
 const primary=document.createElement('nav');primary.className='ux-primary-nav';primary.setAttribute('aria-label','主要功能');
 for(const [id,name,icon] of [['home','学习总览','home'],['routeMap','学习路线','map'],['reviews','复习与错题','review'],['projectNav','项目与验收','project']]){const button=$('#'+id)||document.createElement('button');button.id=id;button.className='nav';button.innerHTML=`${uxIcon(icon)}<span>${name}</span>`;primary.append(button);}
 document.querySelector('.brand').after(primary);
 const resources=document.createElement('details');resources.className='ux-resources';resources.innerHTML='<summary>资料与工具 <span>＋</span></summary>';
 for(const id of ['library','results','materials','studyGuide'])resources.append($('#'+id));
 const settings=document.createElement('button');settings.id='uxSettings';settings.className='nav';settings.innerHTML=uxIcon('settings')+'<span>设置与备份</span>';settings.onclick=()=>uxSettings();resources.append(settings);
 $('#weeks').after(resources);
 document.querySelector('.aside-bottom').innerHTML='<div id="uxSidebarProgress"></div><span>研途 UX 2.2 · 分享学习版</span>';
 $('#home').onclick=()=>home();$('#routeMap').onclick=()=>uxCurriculum();$('#projectNav').onclick=()=>campProjects();$('#reviews').onclick=()=>reviews();
 const command=document.createElement('button');command.id='uxQuickSearch';command.innerHTML=uxIcon('search')+'<span>快速查找</span><kbd>Ctrl K</kbd>';command.onclick=uxSearchOpen;$('.search-row').replaceWith(command); // retain full-search input in an accessible secondary drawer
 document.querySelector('header').insertBefore(command,document.querySelector('.header-right'));
 // Keep the independent back control in navigation, never over course actions.
 document.querySelector('header').insertBefore($('#goBack'),$('#breadcrumb'));
 const legacySearch=document.createElement('div');legacySearch.className='ux-full-search';legacySearch.innerHTML='<label for="search">全文检索</label><input id="search" type="search" placeholder="输入知识点，检索课程与原始资料…">';resources.append(legacySearch);$('#search').oninput=e=>search(e.target.value);
 const overlay=document.createElement('button');overlay.id='uxMenuShade';overlay.hidden=true;overlay.type='button';overlay.setAttribute('aria-label','关闭导航目录');overlay.onclick=uxCloseMenu;document.body.append(overlay);
 $('#menu').setAttribute('aria-controls','uxSidebar');$('#menu').setAttribute('aria-expanded','false');$('#menu').onclick=()=>{if(document.body.classList.contains('menu-open'))return uxCloseMenu();uxMenuReturn=document.activeElement;document.body.classList.add('menu-open');overlay.hidden=false;$('#menu').setAttribute('aria-expanded','true');$('#home').focus();};
 const recovery=document.createElement('section');recovery.id='uxSaveAlert';recovery.hidden=true;recovery.setAttribute('role','status');recovery.innerHTML='<div><b id="uxSaveMessage"></b><small id="uxSaveDetail"></small></div><div class="actions"><button id="uxRetrySave">重试保存</button><button id="uxDraftManager">查看草稿</button><button id="uxDraftBackup">导出当前内容</button></div>';document.querySelector('header').after(recovery);
 $('#uxRetrySave').onclick=()=>persist();$('#uxDraftManager').onclick=()=>studyDrafts.show();$('#uxDraftBackup').onclick=()=>$('#export').click();
 const commandDialog=document.createElement('dialog');commandDialog.id='uxCommand';commandDialog.setAttribute('aria-labelledby','uxCommandTitle');commandDialog.innerHTML='<div class="ux-command-head"><h2 id="uxCommandTitle">你想学什么？</h2><button id="uxCommandClose" aria-label="关闭快捷搜索">Esc</button></div><label class="sr-only" for="uxCommandInput">搜索课程或资料</label><input id="uxCommandInput" type="search" placeholder="搜索知识点、课程、资料…" autocomplete="off"><p id="uxCommandCount" role="status"></p><div id="uxCommandResults"></div>';
 document.body.append(commandDialog);$('#uxCommandClose').onclick=()=>commandDialog.close();commandDialog.addEventListener('close',()=>uxCommandReturn?.focus());$('#uxCommandInput').oninput=e=>uxSearchResults(e.target.value);
 commandDialog.addEventListener('keydown',e=>{const results=[...commandDialog.querySelectorAll('[data-command]')],index=results.indexOf(document.activeElement);if(e.key==='Escape'){e.preventDefault();e.stopPropagation();commandDialog.close();}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(results.length)results[(index+(e.key==='ArrowDown'?1:results.length-1)+results.length)%results.length].focus();}else if(e.key==='Enter'&&document.activeElement===$('#uxCommandInput')&&results[0]){e.preventDefault();results[0].click();}});
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&course&&state){e.preventDefault();if(!$('#modal').open)uxSearchOpen();}if(e.key==='Escape'&&document.body.classList.contains('menu-open'))uxCloseMenu();if(e.key==='Tab'&&document.body.classList.contains('menu-open')){const options=[...sidebar.querySelectorAll('button,input,summary')].filter(el=>el.getClientRects().length&&!el.disabled);if(e.shiftKey&&document.activeElement===options[0]){e.preventDefault();options.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===options.at(-1)){e.preventDefault();options[0].focus();}}});
}
Object.assign(navigationRoutes,{home:uxHome,showLesson:uxLesson,campWeek:uxWeek,uxCurriculum,uxSettings});
home=trackedPage('home',uxHome);showLesson=trackedPage('showLesson',uxLesson);campWeek=trackedPage('campWeek',uxWeek);uxCurriculum=trackedPage('uxCurriculum',uxCurriculum);uxSettings=trackedPage('uxSettings',uxSettings);
for(const [name,route] of [['reviews','reviews'],['library','library'],['showResults','results'],['campProjects','projects'],['materials','materials'],['coverage','coverage'],['studyGuide','studyGuide'],['campEvidence','evidence'],['legacyOverview','legacy'],['showWeek','legacyWeek'],['search','search']]){const render=navigationRoutes[name];navigationRoutes[name]=function(...args){uxRoute=route;uxSetHash(route+(args[0]!==undefined&&args[0]!==null?'/'+encodeURIComponent(args[0]):''));const result=render(...args);uxSetActive();return result;};}
reviews=trackedPage('reviews',navigationRoutes.reviews);library=trackedPage('library',navigationRoutes.library);showResults=trackedPage('showResults',navigationRoutes.showResults);campProjects=trackedPage('campProjects',navigationRoutes.campProjects);materials=trackedPage('materials',navigationRoutes.materials);coverage=trackedPage('coverage',navigationRoutes.coverage);studyGuide=trackedPage('studyGuide',navigationRoutes.studyGuide);campEvidence=trackedPage('campEvidence',navigationRoutes.campEvidence);legacyOverview=trackedPage('legacyOverview',navigationRoutes.legacyOverview);showWeek=trackedPage('showWeek',navigationRoutes.showWeek);search=trackedPage('search',navigationRoutes.search);
// Decorate UI time labels only; never rewrite code, inputs, or lesson prose.
// The observer also covers dynamically rendered routes and search results.
function uxDecorateTimes(){
 const selectors='.ux-next-metadata,.ux-inbox-note,.ux-card-bottom,.lesson-list,.eyebrow,.lesson-side,.ux-phase-tabs,#uxCommandResults,.exec-toolbar label,#main>p.muted';
 const pattern=/\d+(?:\.\d+)?(?:\s*[—–~－-]\s*\d+(?:\.\d+)?)?\s*(?:分钟|小时|秒|MIN\b)/g;
 for(const root of document.querySelectorAll(selectors)){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
   if(node.parentElement.closest('.ux-time,svg,pre,code,textarea,input,option,script,style'))continue;
   const matches=[...node.textContent.matchAll(pattern)];if(!matches.length)continue;
   // Replace the former book glyph rather than leaving two adjacent icons.
   if(node.parentElement.closest('.ux-next-metadata'))node.parentElement.querySelector('svg')?.remove();
   const fragment=document.createDocumentFragment();let offset=0;
   for(const match of matches){
    fragment.append(node.textContent.slice(offset,match.index));
    const label=document.createElement('span');label.className='ux-time';
    label.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>';
    label.append(match[0]);fragment.append(label);offset=match.index+match[0].length;
   }
   fragment.append(node.textContent.slice(offset));node.replaceWith(fragment);
  }
 }
 const speed=document.querySelector('label[for="execSpeed"]');
 if(speed&&!speed.querySelector('.ux-time-icon'))speed.insertAdjacentHTML('afterbegin','<svg class="ux-time-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>');
}
uxSetupShell();
new MutationObserver(uxDecorateTimes).observe(document.querySelector('#main'),{childList:true,subtree:true,characterData:true});
new MutationObserver(uxDecorateTimes).observe(document.querySelector('#uxCommandResults'),{childList:true,subtree:true});
window.studyUIReady=()=>{
 studyDrafts.status();if(studyDrafts.list().length)return;
 const match=uxInitialHash.match(/^#(lesson|week)\/(\w+)(?:\?week=(\d+))?$/);
 if(match){if(match[1]==='lesson'&&course.lessons.some(l=>l.id===match[2])){bootWeekContext=Number(match[3])||null;showLesson(match[2]);}if(match[1]==='week'&&course.curriculum.some(w=>w.id===Number(match[2])))campWeek(Number(match[2]));return;}
 const routes={'#map':uxCurriculum,'#settings':uxSettings,'#reviews':reviews,'#projects':campProjects,'#library':library,'#results':showResults,'#materials':materials,'#coverage':coverage,'#studyGuide':studyGuide,'#evidence':campEvidence,'#legacy':legacyOverview};
 if(routes[uxInitialHash])routes[uxInitialHash]();
 const filtered=uxInitialHash.match(/^#(materials|library|legacyWeek)\/(\d+)$/);if(filtered&&Number(filtered[2])<=8)({materials,library,legacyWeek:showWeek})[filtered[1]](Number(filtered[2]));
 if(uxInitialHash.startsWith('#search/'))try{const query=decodeURIComponent(uxInitialHash.slice(8));$('#search').value=query;search(query);}catch{}
};
// Shared edition starts after its storage adapter is ready.
