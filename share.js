'use strict';
// Static edition: IndexedDB transactions replace the private Python API.
// Compare-and-swap revisions prevent one tab from silently overwriting another.
let shareDB=null,shareStorageError='',shareRouting=false,shareStarted=false,shareInstallPrompt=null,shareRegistration=null;
const blankProgress=()=>({revision:0,state:{schema:1,lessons:{},last:'b1'}});
const copyJSON=value=>JSON.parse(JSON.stringify(value));
function validateShareState(value){
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
 if(!object(value)||value.schema!==1||Object.keys(value).some(k=>!['schema','lessons','last'].includes(k)))throw Error('备份结构不正确');
 const ids=new Set(course.lessons.map(l=>l.id));
 if(!ids.has(value.last)||!object(value.lessons))throw Error('备份课程编号不正确');
 for(const [id,s] of Object.entries(value.lessons)){
  if(!ids.has(id)||!object(s)||Object.keys(s).some(k=>!['note','answer','read','practice','scores','reviewAt','reviewed','updated'].includes(k)))throw Error('备份含未知课程或字段');
  for(const key of ['note','answer'])if(key in s&&(typeof s[key]!=='string'||s[key].length>40000))throw Error('笔记格式错误或超过40000字');
  for(const key of ['read','practice','reviewed'])if(key in s&&typeof s[key]!=='boolean')throw Error('勾选字段格式错误');
  for(const key of ['reviewAt','updated'])if(key in s&&(!Number.isFinite(s[key])||s[key]<0||s[key]>1e15))throw Error('时间字段格式错误');
  if('scores' in s&&(!object(s.scores)||Object.entries(s.scores).some(([k,v])=>!['0','1'].includes(k)||typeof v!=='boolean')))throw Error('测验记录格式错误');
 }
 if(JSON.stringify(value).length>2000000)throw Error('备份超过容量限制');
 return copyJSON(value);
}
function openShareDB(){return new Promise((resolve,reject)=>{
 const request=indexedDB.open('yantu-gh-learning-camp-progress',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('progress');
 request.onerror=()=>reject(request.error||Error('浏览器数据库不可用'));
 request.onblocked=()=>reject(Error('其他页面阻止数据库升级，请关闭旧学习标签页后重试'));
 request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();resolve(db);};
});}
function readShareProgress(){return new Promise((resolve,reject)=>{
 if(!shareDB)return resolve(blankProgress());
 const tx=shareDB.transaction('progress','readonly'),request=tx.objectStore('progress').get('current');
 request.onsuccess=()=>{try{const value=request.result||blankProgress();validateShareState(value.state);if(!Number.isSafeInteger(value.revision)||value.revision<0)throw Error('进度版本损坏');resolve(copyJSON(value));}catch(e){reject(e);}};
 request.onerror=()=>reject(request.error);tx.onabort=()=>reject(tx.error||Error('读取被中断'));
});}
function writeShareProgress(value,expected){return new Promise((resolve,reject)=>{
 if(!shareDB)return reject(Error('浏览器持久存储不可用；请导出当前笔记，不要关闭页面'));
 let snapshot;try{snapshot=validateShareState(value);if(!Number.isSafeInteger(expected)||expected<0)throw Error('版本号不正确');}catch(e){return reject(e);}
 const tx=shareDB.transaction('progress','readwrite'),store=tx.objectStore('progress'),request=store.get('current');
 let reason=null,next;
 request.onsuccess=()=>{
  const previous=request.result||blankProgress();
  if(previous.revision!==expected){conflict=true;reason=Error('其他标签页已更新进度。已保留当前草稿，请导出并核对后刷新，未覆盖另一页。');tx.abort();return;}
  next=previous.revision+1;store.put({revision:next,state:snapshot},'current');
 };
 tx.oncomplete=()=>resolve({revision:next});
 tx.onerror=()=>{reason=reason||tx.error;};
 tx.onabort=()=>reject(reason||tx.error||Error('保存失败，可能是存储空间不足'));
});}
api=async function(path,data){
 if(path==='/api/session')return {token:'browser-only',app:'dacim-study-v1'};
 if(path==='/api/state')return data?writeShareProgress(data.state,data.revision):readShareProgress();
 throw Error('分享版不提供本机或云端实验执行接口，请下载实验包。');
};

// Replace private-material surfaces rather than silently displaying broken paths.
attachOriginalMaterials=function(){};
const shareLabGuide=week=>`<section class="share-info"><h2>${week?'第'+week+'周实验':'本机实验与下载'}</h2><p>网页不会运行Python，也不读取你的文件。下载实验包、解压，在Anaconda Prompt运行，再将实际结果记录到项目课。</p><div class="share-actions"><a href="./experiments.zip" download>下载完整教学实验包</a><a href="./experiments/README_先读我.txt" download>下载安装与运行说明</a></div><p>初次实验请先读说明；已有可用环境无需重复安装。示例环境名为 yantu-study，已有环境可改成自己的名字。</p><pre>${esc('conda activate yantu-study\n'+(week?'python -X utf8 labs\\bootcamp.py --week '+week:'python -X utf8 labs\\bootcamp.py --week 1'))}</pre><p>先在终端进入实际解压目录再运行。原八周专项另用 labs\\lab.py，周次不可混用。日志与权重保存在你自己的电脑，不会自动上传或同步。</p><p class="source-meta">本包不含原作者环境、个人进度、论文PDF、训练结果或模型权重。</p></section>`;
function shareDownloads(week){active=null;uxRoute='downloads';uxSetHash('downloads');page('实验下载与说明',shareLabGuide(week)+'<p>课程可在网页离线学习；实验包需要联网下载一次。已下载文件可在本机重复使用。</p>');uxSetActive();}
runLab=function(week){$('#modalBody').innerHTML=shareLabGuide()+`<p>当前为原八周专项第${week}周：<code>python -X utf8 labs\\lab.py --week ${week}</code></p>`;$('#modal').showModal();};
runCamp=function(week){$('#modalBody').innerHTML=shareLabGuide(week);$('#modal').showModal();};
function shareLibrary(){active=null;uxRoute='library';uxSetHash('library');page('资料与代码',`<h1>公开学习资料</h1><p>主课、练习和交互图示已包含在本站。原工作台私人附件不公开；以下外部资料保留原始来源，不转载全文。</p><section class="block"><h2>教学代码</h2>${sources.map(s=>`<p><button data-share-source="${esc(s.id)}">阅读 ${esc(s.title)}</button></p>`).join('')}<button id="shareGoDownloads">下载全部实验</button></section><section class="block"><h2>官方教程与原论文</h2>${course.verification.sources.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)}</a></p>`).join('')}</section>`);$$bind('[data-share-source]',b=>openSource(b.dataset.shareSource));$('#shareGoDownloads').onclick=()=>shareDownloads();uxSetActive();}
openSource=function(id){const s=sources.find(s=>s.id===id);if(!s)return toast('此历史私人资料未在分享版公开；请查看公开课程来源。');$('#modalBody').innerHTML=`<h2>${esc(s.title)}</h2><p>原创教学代码；请先阅读注释，再修改自己的副本。</p><a href="${esc(s.url)}" download>下载代码</a><pre class="document">${esc(s.body)}</pre>`;if(!$('#modal').open)$('#modal').showModal();};
function shareEvidence(){active=null;uxSetHash('evidence');page('课程范围与隐私',`<h1>先分清：学习材料与真实结果</h1><section class="block"><h2>课程范围</h2><p>本站保留117个学习单元、十六周主线、短练习及二维/三维机制演示。教材仍需补强部分数学推导和真实数据实践；它不是完整商业认证课程，也不保证就业、论文录用或所有学习者按时掌握。</p><p>小词表Transformer、线性LoRA、词组检索与加噪实验均为教学案例，不代表真实LLM微调、完整RAG或真实图像恢复基线。实验包说明保留这些边界。</p><h2>你的数据在哪里</h2><p>笔记、回答和进度写入当前浏览器的IndexedDB，未上传到本站服务器；每个浏览器独立，无账号、无跨设备同步。清理站点数据、隐私模式结束或浏览器回收存储可能造成丢失，请定期导出JSON。</p><p>本站未加入分析追踪脚本。托管平台仍可能记录正常网站访问日志；访问外部论文或教程遵循对应网站规则。</p><h2>公开内容</h2><p>只发布主课程、交互代码、自编教学实验和外部原文链接。不包含原作者笔记、学习数据库、私有资料库、模型权重及虚拟环境。模型、论文和第三方依赖遵循各自许可，不因在本站被引用而改变授权。</p><h2>学习备份</h2><p>导出的JSON包含你自己的笔记与回答；不要把它当成分享课程的文件发给别人。分享课程请使用“分享本页”，它只复制课程网址。</p></section>`);uxSetActive();}
const shareEvidenceBeforeReview=shareEvidence;
shareEvidence=function(){shareEvidenceBeforeReview();$('#main').insertAdjacentHTML('beforeend',bridgeReviewHTML());};
for(const [name,fn] of [['library',shareLibrary],['materials',shareLibrary],['coverage',shareLibrary],['showResults',()=>shareDownloads()],['campEvidence',shareEvidence]])navigationRoutes[name]=fn;
library=trackedPage('library',shareLibrary);materials=trackedPage('materials',shareLibrary);coverage=trackedPage('coverage',shareLibrary);showResults=trackedPage('showResults',()=>shareDownloads());campEvidence=trackedPage('campEvidence',shareEvidence);
navigationRoutes.shareDownloads=shareDownloads;shareDownloads=trackedPage('shareDownloads',shareDownloads);

// Preserve browser back/forward and deep links without adding note content to URLs.
uxSetHash=function(hash){if(shareRouting||!shareStarted)return;const next='#'+hash;if(location.hash!==next)history.pushState(null,'',next);};
function routeShare(hash){
 shareRouting=true;
 try{
  const parts=hash.replace(/^#/,'').split('/'),name=parts[0],raw=decodeURIComponent(parts.slice(1).join('/')),arg=name==='lesson'?raw.split('?')[0]:raw;
  if(name==='lesson'&&course.lessons.some(l=>l.id===arg)){bootWeekContext=Number(new URLSearchParams(raw.split('?')[1]||'').get('week'))||null;showLesson(arg);}
  else if(name==='week'&&course.curriculum.some(w=>w.id===Number(arg)))campWeek(Number(arg));
  else if(name==='search'&&arg)search(arg);
  else ({map:uxCurriculum,reviews,projects:campProjects,library,materials,coverage,results:showResults,downloads:shareDownloads,settings:uxSettings,evidence:campEvidence,legacy:legacyOverview,studyGuide,home}[name]||home)();
 }catch{home();}finally{shareRouting=false;}
}
window.addEventListener('popstate',()=>{if(shareStarted)routeShare(location.hash);});
window.addEventListener('hashchange',()=>{if(shareStarted)routeShare(location.hash);});

function showShareURL(){const url=new URL(location.href);url.search='';url.hash=active?lessonHash(active):location.hash||'home';$('#modalBody').innerHTML=`<h2>分享当前课程</h2><p>只分享网址，不含你的笔记、测验或学习进度。</p><label for="shareURL">复制后发给同学</label><input readonly class="share-link" id="shareURL" value="${esc(url.href)}"><div class="actions"><button id="shareCopy">复制链接</button>${navigator.share?'<button id="shareSystem">系统分享</button>':''}</div><p class="source-meta">对方使用自己的浏览器进度。微信内浏览器若不能安装或下载，请用系统浏览器打开。</p>`;$('#modal').showModal();$('#shareCopy').onclick=async()=>{try{await navigator.clipboard.writeText(url.href);toast('课程链接已复制');}catch{$('#shareURL').select();toast('自动复制不可用，请手动复制已选中的链接');}};if($('#shareSystem'))$('#shareSystem').onclick=()=>navigator.share({title:document.title,url:url.href}).catch(e=>{if(e.name!=='AbortError')toast('请复制链接分享');});}
function installHelp(){if(shareInstallPrompt){shareInstallPrompt.prompt();shareInstallPrompt.userChoice.finally(()=>{shareInstallPrompt=null;});return;}$('#modalBody').innerHTML='<h2>安装到桌面或主屏幕</h2><p>支持的桌面浏览器可在地址栏或菜单中选择“安装应用”；iPhone/iPad可在支持的浏览器分享菜单里选择“添加到主屏幕”。不同浏览器入口不同，不保证出现统一按钮。</p><p>安装并不等于永久保存数据，也不会安装Python。请等待页面显示“课程已可离线”再断网；外部链接和未下载的实验包仍需联网。</p>';$('#modal').showModal();}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();shareInstallPrompt=e;});

async function setupOffline(){
 const status=$('#shareOffline');
 if(!('serviceWorker' in navigator)){status.textContent='此浏览器不支持课程离线缓存';return;}
 try{
  shareRegistration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
  // A first install briefly has a waiting worker too; only an existing active
  // version makes this an update. Recheck after activation to clear stale UI.
  const waiting=()=>{$('#shareUpdate').hidden=!(shareRegistration.waiting&&shareRegistration.active);};
  waiting();shareRegistration.addEventListener('updatefound',()=>{const worker=shareRegistration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')waiting();});});
  await navigator.serviceWorker.ready;waiting();status.textContent=navigator.onLine?'课程已可离线 · 外部原文仍需联网':'离线学习中';
 }catch{status.textContent='离线缓存未准备好；联网阅读仍可用';}
}
let shareReloadAfterUpdate=false;
navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(shareReloadAfterUpdate)location.reload();});
function shareShell(){
 const bar=document.createElement('section');bar.className='share-bar';bar.setAttribute('aria-label','分享与离线');bar.innerHTML='<p id="shareOffline" role="status">正在准备课程离线缓存…</p><button id="sharePage">分享本页</button><button id="shareInstall">安装与离线</button><button id="shareDownload">实验下载</button><button id="shareUpdate" hidden>有新版 · 更新</button>';
 document.querySelector('header').after(bar);
 const notice=document.createElement('p');notice.className='share-notice';notice.id='shareStorageNotice';notice.hidden=!shareStorageError;notice.textContent='当前只能临时阅读：'+shareStorageError+'。请导出重要内容，不要依赖刷新恢复。';bar.after(notice);
 $('#sharePage').onclick=showShareURL;$('#shareInstall').onclick=installHelp;$('#shareDownload').onclick=()=>shareDownloads();
 $('#shareUpdate').onclick=async()=>{await persist();if(dirty)return toast('请先导出未保存内容，暂不更新');if(!confirm('当前内容已保存。更新会刷新页面，确认继续？'))return;shareReloadAfterUpdate=true;shareRegistration?.waiting?.postMessage({type:'ACTIVATE_UPDATE'});};
 for(const id of ['materials'])$('#'+id).hidden=true;
 $('#library').textContent='公开资料与代码';$('#library').onclick=()=>library();$('#results').textContent='实验下载与说明';$('#results').onclick=()=>shareDownloads();
 document.querySelector('footer').classList.add('share-footer');document.querySelector('footer').textContent='分享版 · 笔记仅存此浏览器，无跨设备同步；请定期导出备份。教学案例不等于真实科研结果。';
 window.addEventListener('online',()=>{$('#shareOffline').textContent='已联网 · 离线缓存以安装状态为准';});
 window.addEventListener('offline',()=>{$('#shareOffline').textContent='已断网 · 已缓存课程可继续学习';});
 setupOffline();
}

// Import is fully validated and a pre-import backup is downloaded before replacement.
$('#import').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
  if(file.size>2000000)throw Error('备份超过2MB');const data=JSON.parse(await file.text());
  if(data.app!=='dacim-study-v1')throw Error('不是本程序的学习备份');const candidate=validateShareState(data.state);
  if(!confirm('将替换此浏览器的学习记录，并下载替换前备份。确认导入？'))return;
  await persist();if(dirty)throw Error('当前修改尚未保存，请先导出并解决存储或版本冲突');
  download('研途_导入前备份.json',{app:'dacim-study-v1',state});
  const result=await api('/api/state',{state:candidate,revision});revision=result.revision;state=candidate;dirty=false;conflict=false;studyDrafts.acknowledge();home();toast('备份已导入此浏览器');
 }catch(error){toast('导入失败：'+error.message);}finally{e.target.value='';}
};
async function initShare(){
 try{
  [course,sources]=await Promise.all(['course.json','sources.json'].map(async name=>{const r=await fetch('./'+name);if(!r.ok)throw Error('无法加载 '+name);return r.json();}));
  try{shareDB=await openShareDB();}catch(e){shareStorageError=e.message;}
  ({state,revision}=await readShareProgress());token='browser-only';renderNav();home();
  $('#saveStatus').textContent=shareDB?'此浏览器保存 · 无云同步':'存储不可用 · 请导出';
  shareShell();studyDrafts.status();shareStarted=true;
  // Preserve recovery before entering a course (entering a lesson also saves last-viewed).
  if(!studyDrafts.list().length)routeShare(uxInitialHash||'#home');
 }catch(e){$('#main').innerHTML=`<h1>暂时无法打开课程</h1><p>${esc(e.message)}</p><p>首次访问需要联网。如果浏览器中已有笔记，不要清空站点数据；请先恢复网络或关闭其他旧版本标签页。</p>`;}
}
initShare();
