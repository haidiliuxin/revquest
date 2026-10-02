const STORAGE_KEY = 'revquest-mvp-v2';

const lessons = [
  {
    title: '样本侦察站：这是什么程序？', short: 'Windows PE 与 .NET', duration: '8 分钟',
    summary: '在打开反编译器之前，先摸清文件的格式、平台和运行环境。',
    lead: '逆向像一次寻宝：先看看地图，再决定带什么工具。今天的样本是 Windows 可执行文件 PE，里面运行的是 .NET 程序。',
    codeTitle: '侦察记录 · RevQuest.FirstSteps.exe', codeLang: 'PE / WINDOWS',
    code: `<span class="line-no">1</span>Format: <span class="hex">PE32+</span> executable<br><span class="line-no">2</span>Machine: <span class="opcode">AMD64 / x86-64</span><br><span class="line-no">3</span>Subsystem: Windows Console<br><span class="line-no">4</span>Runtime: <span class="opcode">.NET 8</span><br><span class="line-no">5</span>Imports: Console input / output`,
    paragraphs: ['PE（Portable Executable）是 Windows 常见的可执行文件格式。`.exe` 扩展名很常见，但文件结构才是判断格式的证据。', '这个教学样本用 .NET 编写，适合先用 ILSpy 读反编译后的 C#，再逐步认识 IL 和原生汇编。静态分析不需要先运行样本。'],
    objectives: ['认识 Windows PE 文件', '知道 .NET 程序可以反编译成 C#', '分析前先记录文件平台和格式'],
    checkpoint: { q: '初学者要先读懂这个 .NET 教学程序，哪个工具方向最合适？', options: ['十六进制编辑器逐字节手算所有内容。', '用 ILSpy 查看程序集并阅读反编译出的 C#。', '把 .exe 改名为 .txt 再阅读。'], answer: 1, explain: '答对啦！ILSpy 可以查看 .NET 程序集里的类型、方法和反编译代码，很适合本路线的第一份 EXE。' },
  },
  {
    title: '反编译镜之森：找到入口方法', short: '程序集、类型与 Main', duration: '10 分钟',
    summary: '在程序集里找到程序从哪里开始、哪些方法负责检查输入。',
    lead: '反编译器会把编译后的指令整理成比较易读的代码。我们先从 Main 出发，再跟进它调用的方法。',
    codeTitle: 'ILSpy 反编译视图 · Program.Main', codeLang: 'C#',
    code: `<span class="line-no">1</span><span class="opcode">static int Main</span>()<br><span class="line-no">2</span>{<br><span class="line-no">3</span>    Console.Write("输入通行短语：");<br><span class="line-no">4</span>    var input = Console.ReadLine();<br><span class="line-no">5</span>    <span class="opcode">if</span> (Check(input))<br><span class="line-no">6</span>        RevealFlag();<br><span class="line-no">7</span>    <span class="opcode">return</span> 0;<br><span class="line-no">8</span>`},
    paragraphs: ['ILSpy 左侧通常会列出程序集、命名空间、类型和方法。先找 `Main`，再看它把输入交给了哪个检查函数。', '反编译结果是工具根据 IL 还原的表达形式。变量名和结构可能与原始源码不同，但调用关系和计算逻辑仍然是很有价值的线索。'],
    objectives: ['在类型列表里定位 Program', '从 Main 跟进输入检查函数', '用调用关系画出程序流程'],
    checkpoint: { q: 'Main 读取输入后调用 `Check(input)`，下一步最直接的分析目标是什么？', options: ['打开 Check 方法，弄清它的条件。', '马上去看图标和文件版本信息。', '删掉程序里所有 if 语句。'], answer: 0, explain: '很棒！沿着 Main 的调用关系进入 Check，通常就能找到程序的验证逻辑。' },
  },
  {
    title: '分支迷宫：条件决定出口', short: '长度检查与 if 判断', duration: '12 分钟',
    summary: '读懂输入长度检查、循环和失败分支，找出验证逻辑的骨架。',
    lead: '好多逆向题的校验逻辑都是“先检查格式，再逐步比较”。按程序执行顺序读，复杂代码就会变成一串小门。',
    codeTitle: 'Check · 输入验证骨架', codeLang: 'C#',
    code: `<span class="line-no">1</span><span class="opcode">if</span> (input.Length != target.Length)<br><span class="line-no">2</span>    <span class="opcode">return false</span>;<br><span class="line-no">3</span><span class="opcode">for</span> (int i = 0; i &lt; input.Length; i++)<br><span class="line-no">4</span>{<br><span class="line-no">5</span>    <span class="opcode">if</span> (Transform(input[i], i) != target[i])<br><span class="line-no">6</span>        <span class="opcode">return false</span>;<br><span class="line-no">7</span>}<br><span class="line-no">8</span><span class="opcode">return true</span>;`,
    paragraphs: ['第一个 if 检查输入长度。如果长度不符，函数马上返回 false，后面的循环不会执行。', '循环会逐个检查字符。只要某个位置的变换结果和 target 不同，就会走失败出口；所有位置都匹配，最后才会返回 true。'],
    objectives: ['先检查输入长度条件', '理解循环如何逐个比较字符', '从 return false 找到失败路径'],
    checkpoint: { q: '在逐字节校验循环里，只要一个字符不匹配，就会发生什么？', options: ['跳过当前字符，剩下的都算正确。', '立刻返回 false，走到失败路径。', '自动改成正确字符。'], answer: 1, explain: '对！遇到不匹配就 return false，所以我们可以先用长度和循环判断锁定校验骨架。' },
  },
  {
    title: '字节魔法坊：XOR 也能倒着算', short: '十六进制与 XOR 逆运算', duration: '13 分钟',
    summary: '把字节常量和变换公式转回原始输入，准备挑战最终 EXE。',
    lead: '找到 target 后，下一步是逆向每个字符的变换。XOR 有个很方便的特性：同一个数异或两次，会回到原来的值。',
    codeTitle: 'Transform · 逐个字符还原', codeLang: 'C#',
    code: `<span class="line-no">1</span>target[i] = input[i] ^ (<span class="hex">0x31</span> + i)<br><span class="line-no">2</span><span class="comment">// 把等式两边都与同一个 key XOR</span><br><span class="line-no">3</span>input[i] = target[i] ^ (<span class="hex">0x31</span> + i)<br><span class="line-no">4</span><span class="comment">// 先用十六进制算，再查 ASCII 字符</span>`,
    paragraphs: ['如果某个字符使用 `0x31 + i` 作为 key，那么第 i 个字符的 key 会随位置变化。不要对所有位置都用同一个数。', '在 ILSpy 中记下循环、key 公式和 target 数组。你可以用纸笔或 Python 验算，之后把还原出的通行短语输入样本，程序会显示 flag。'],
    objectives: ['使用 XOR 可逆性质', '考虑每个位置不同的 key', '组合反编译逻辑与运行结果验证'],
    checkpoint: { q: '若 `target[i] = input[i] ^ (0x31 + i)`，怎样还原 input[i]？', options: ['target[i] ^ (0x31 + i)', 'target[i] + 0x31 + i', 'target[i] ^ 0x31'], answer: 0, explain: '没错！再 XOR 一次相同的 key 就能还原 input[i]，并且 key 要带上当前位置 i。' },
  },
];

const challenges = [
  {
    id: 'branch-check', title: '小石桥：过比较关', subtitle: '把十六进制变成输入答案', category: '条件判断', difficulty: '热身', unlock: 1, expected: '4919',
    description: '程序读取一个整数，并用一次比较决定打印 success 还是 fail。根据反汇编片段，提交唯一能通过比较的输入。',
    codeTitle: 'entry_check · 入口检查', codeLang: 'X86-64',
    code: `<span class="line-no">1</span><span class="opcode">call</span> read_number<br><span class="line-no">2</span><span class="opcode">mov</span> ebx, eax<br><span class="line-no">3</span><span class="opcode">cmp</span> ebx, <span class="hex">0x1337</span><br><span class="line-no">4</span><span class="opcode">jne</span> fail<br><span class="line-no">5</span><span class="opcode">call</span> print_success`,
    answerLabel: '输入通过检查的整数（十进制）', answerPlaceholder: '例如：4919', check: v => v.trim() === '4919',
    hints: ['先读第 3、4 行：cmp 比较什么，jne 在什么情况下跳？', '目标值是十六进制 0x1337。试着把它换算成十进制。', '0x1337 = 4919。'],
    explanation: '0x1337 的十进制是 4919。jne 表示不相等时跳到 fail，因此唯一通过值是 4919。',
  },
  {
    id: 'xor-note', title: '萤火虫密码：解开一串字节', subtitle: '对每个字节做一次 XOR', category: '字节变换', difficulty: '基础', unlock: 3, expected: 'rev{xor!}',
    description: '分析说明：程序逐字节计算 `plain[i] ^ 0x20` 并输出结果。下面是输出字节的十六进制。还原原始 flag。',
    codeTitle: 'xor_note · 输出字节', codeLang: 'BYTE ARRAY',
    code: `<span class="line-no">1</span><span class="comment">key = 0x20</span><br><span class="line-no">2</span><span class="hex">52 45 56 5b 58 4f 52 01</span><br><span class="line-no">3</span><span class="comment">每个输出字节 = 原始字节 XOR key</span><br><span class="line-no">4</span><span class="comment">flag 使用小写字母与 rev{...} 格式</span>`,
    answerLabel: '还原后的 flag', answerPlaceholder: 'rev{...}', check: v => v.trim().toLowerCase() === 'rev{xor!}',
    hints: ['XOR 同一个值两次会还原原值：plain = cipher ^ 0x20。', '把每个十六进制字节分别与 0x20 异或，再按 ASCII 读出。', '还原字节是 `72 65 76 7b 78 6f 72 21`。'],
    explanation: '再次与 0x20 做 XOR 即可还原原字节，对应字符串 `rev{xor!}`。',
  },
  {
    id: 'independent-path', title: '无提示小挑战：短密码校验', subtitle: '把观察、分支和字节分析串起来', category: '综合分析', difficulty: '独立挑战', unlock: 4, expected: 'rev{byte}',
    description: '根据检查长度与 XOR 目标数组，独立还原并提交 flag。试着不打开提示，看看能否把刚学会的方法迁移到新题。',
    codeTitle: 'short_password · 模拟反汇编', codeLang: 'PSEUDO ASM',
    code: `<span class="line-no">1</span><span class="opcode">cmp</span> input_len, <span class="hex">9</span><br><span class="line-no">2</span><span class="opcode">jne</span> fail<br><span class="line-no">3</span><span class="comment">; 每个字节与 0x01 XOR 后等于 target[i]</span><br><span class="line-no">4</span>target: <span class="hex">73 64 77 7a 63 78 75 64 7c</span><br><span class="line-no">5</span><span class="opcode">je</span> success`,
    answerLabel: '提交还原后的 flag', answerPlaceholder: 'rev{...}', check: v => v.trim().toLowerCase() === 'rev{byte}',
    hints: ['输入长度必须为 9；长度不对会跳到 fail。', '每个 target 字节都与 0x01 XOR，就能还原输入字节。', '还原出的 ASCII 字节就是 `rev{byte}`，共 9 个字符。'],
    explanation: '每个 target 字节与 0x01 XOR 后得到 ASCII 字符串 `rev{byte}`，共 9 个字符，符合长度检查。',
  },
  {
    id: 'exe-first-quest', title: 'Boss 关：解开第一份 EXE', subtitle: '反编译样本，运行通行短语，拿到 flag', category: 'Windows PE / .NET', difficulty: '毕业挑战', unlock: 4, expected: 'revquest{pe_fun}', kind: 'exe',
    description: '这是一个自制、无网络访问、不会读写文件的 Windows .NET 控制台样本。用 ILSpy 打开 EXE，找到输入检查逻辑，还原通行短语；在本机运行程序后，它会显示 flag。最后把 flag 填在这里。',
    codeTitle: '挑战路线 · 本关没有在线执行器', codeLang: 'LOCAL ONLY',
    code: `<span class="line-no">1</span>下载教学 EXE → 用 ILSpy 打开<br><span class="line-no">2</span>在 Program.Main 跟进 CheckPhrase<br><span class="line-no">3</span>还原逐字节 XOR 与 target 数组<br><span class="line-no">4</span>在自己的 Windows 终端运行样本<br><span class="line-no">5</span>提交样本输出的 flag`,
    answerLabel: '把 EXE 显示的 flag 放在这里', answerPlaceholder: 'revquest{...}', check: v => v.trim().toLowerCase() === 'revquest{pe_fun}',
    hints: ['ILSpy 可以打开 .NET EXE。先从 Program.Main 找到调用的输入检查方法。', '检查方法会先判断长度，再进入循环。循环中每个字符都与 `0x31 + i` XOR 后和目标字节比较。', '输入是 `campus{tiny_win}`。在本机运行样本、输入它，程序会打印本关 flag。'],
    explanation: '检查方法逐字符计算 `(input[i] ^ (0x31 + i))` 并对比 Gate 数组。还原得到通行短语 `campus{tiny_win}`。本地运行后程序会打印 `revquest{pe_fun}`。',
  },
];

function freshState() {
  return { completedLessons: [], checkpointAnswers: {}, completedChallenges: [], hints: {}, notes: {}, activeLesson: 0, toolboxChecks: { runtime: false, ilspy: false }, environmentReady: false };
}
function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed && typeof parsed === 'object' ? { ...freshState(), ...parsed } : freshState();
  } catch { return freshState(); }
}
let state = loadState();
let view = 'home';
let activeChallenge = challenges[0].id;
let toastTimer;
const app = document.querySelector('#app');
const breadcrumb = document.querySelector('#breadcrumb-current');
const toast = document.querySelector('#toast');
if (window.gsap) document.documentElement.classList.add('has-gsap');

function earnedXP() { return state.completedLessons.length * 20 + state.completedChallenges.reduce((sum, id) => sum + (id === 'exe-first-quest' ? 100 : 35), 0); }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateChrome(); }
function updateChrome() {
  document.querySelectorAll('.route-item').forEach((button, index) => {
    button.classList.toggle('selected', view === 'lesson' && index === state.activeLesson);
    button.classList.toggle('completed', state.completedLessons.includes(index));
    button.querySelector('.route-marker').textContent = state.completedLessons.includes(index) ? '✓' : String(index + 1);
  });
  document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view || (view === 'lesson' && button.dataset.view === 'home')));
  document.querySelector('#challenge-nav-count').textContent = String(challenges.length - state.completedChallenges.length).padStart(2, '0');
  document.querySelector('#xp-count').textContent = earnedXP();
}
function notify(message) {
  toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer);
  if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(toast, { y: 12, scale: .94 }, { y: 0, scale: 1, duration: .35, ease: 'back.out(1.7)' });
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
function progress() { return Math.round((state.completedLessons.length / lessons.length) * 100); }
function animatePage() {
  if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.timeline({ defaults: { ease: 'power2.out' } })
    .fromTo('.animate-in', { y: 15, opacity: 0, scale: .985 }, { y: 0, opacity: 1, scale: 1, duration: .48, stagger: .075, clearProps: 'transform' });
  gsap.killTweensOf('.buddy-avatar');
  if (view === 'home') gsap.to('.buddy-avatar', { y: -5, duration: 1.35, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}
function celebrate() {
  const layer = document.querySelector('#sparkles');
  const colors = ['#ff866f', '#ffc64f', '#7dcf9b', '#9c85dc', '#76c4df'];
  layer.innerHTML = Array.from({ length: 22 }, (_, i) => `<span class="sparkle" style="--sparkle-color:${colors[i % colors.length]};--sparkle-size:${12 + (i % 4) * 4}px;left:${44 + (i % 13)}%;top:${38 + (i % 5) * 3}%">${i % 3 ? '✦' : '★'}</span>`).join('');
  if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.fromTo('.sparkle', { y: 0, x: 0, opacity: 0, scale: .4, rotation: 0 }, { y: (i) => -65 - ((i * 29) % 120), x: (i) => ((i % 2) ? 1 : -1) * (35 + ((i * 17) % 100)), opacity: 1, scale: 1, rotation: (i) => (i % 2 ? 130 : -130), duration: 1.15, stagger: .018, ease: 'power2.out', onComplete: () => { layer.innerHTML = ''; } });
  } else { layer.innerHTML = ''; }
}
function render() {
  updateChrome();
  if (view === 'home') renderHome();
  else if (view === 'lesson') renderLesson(state.activeLesson);
  else if (view === 'challenges') renderChallenges();
  else if (view === 'challenge-detail') renderChallenge(activeChallenge);
  else if (view === 'toolbox') renderToolbox();
  else if (view === 'notebook') renderNotebook();
  requestAnimationFrame(animatePage);
}
function setView(next) {
  view = next;
  breadcrumb.textContent = ({ home: '冒险地图', lesson: '冒险课程', challenges: '练习关卡', toolbox: '工具补给站', 'challenge-detail': '挑战工作区', notebook: '我的探险手册' })[view] || '冒险地图';
  render(); window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderHome() {
  const nextLesson = lessons.findIndex((_, i) => !state.completedLessons.includes(i));
  const resumeIndex = nextLesson < 0 ? lessons.length - 1 : nextLesson;
  const unlocked = challenges.filter(c => state.completedLessons.length >= c.unlock).length;
  app.innerHTML = `
    <div class="home-grid">
      <section class="hero animate-in"><div class="eyebrow">🎒 大学生的 CTF 逆向冒险</div><h1>准备好出发了吗？<br /><span>下一站：拿下第一份 EXE！</span></h1><p class="hero-description">和小字节一起穿过反编译镜之森、分支迷宫和 XOR 洞穴，最后亲手拆开一个 Windows 程序，找到它藏起来的 flag。</p><div class="hero-actions"><button class="button button-primary" data-action="resume">${state.completedLessons.length ? '继续冒险' : '开启冒险'} <span>→</span></button><span class="hero-note">4 个小岛 · 4 道挑战 · 1 个 EXE Boss</span></div><div class="hero-art" aria-hidden="true"><div class="hero-art-inner"><span>EXE</span><small>LV.1 adventurer</small></div></div></section>
      <section class="stats-card animate-in"><div class="panel-heading"><h2>冒险进度</h2><span class="subtle">继续前进，星星会变多 ✨</span></div><div class="overall-progress"><div><div class="progress-number">${progress()}<small>%</small></div><div class="progress-caption">新手路线完成度</div></div><span class="chip">🌱 ${state.completedLessons.length}/${lessons.length} 小岛</span></div><div class="progress-track"><div class="progress-fill" style="width:${progress()}%"></div></div><div class="stat-row"><div class="stat-cell"><strong>${state.completedLessons.length}</strong><span>点亮小岛</span></div><div class="stat-cell"><strong>${state.completedChallenges.length}</strong><span>完成挑战</span></div><div class="stat-cell"><strong>${earnedXP()}</strong><span>冒险 XP</span></div></div></section>
    </div>
    <div class="section-header"><div><h2>新手冒险线 <span aria-hidden="true">🧭</span></h2><p>完成每座小岛的知识问答，就能解锁新的冒险和练习。</p></div><button class="text-link" data-view="challenges">看看练习关卡 →</button></div>
    <div class="module-grid">${lessons.map((lesson, i) => { const done = state.completedLessons.includes(i), locked = i > 0 && !state.completedLessons.includes(i - 1); return `<button class="module-card animate-in ${done ? 'complete' : ''} ${i === resumeIndex ? 'is-next' : ''} ${locked ? 'locked' : ''}" data-view="lesson" data-lesson="${i}"><div class="module-topline"><span class="module-index">小岛 0${i + 1}</span><span class="module-status">${done ? '⭐ 已点亮' : locked ? '🔒' : i === resumeIndex ? '📍 出发' : '等你来玩'}</span></div><div class="module-glyph">${['🔍','🪞','🌈','✨'][i]}</div><h3>${lesson.title}</h3><p>${lesson.duration} · ${lesson.short}</p></button>`; }).join('')}</div>
    <div class="lower-grid"><section class="panel animate-in"><div class="panel-heading"><h2>这趟冒险会学会什么</h2><span class="subtle">技能收集册</span></div><div class="activity-list"><div class="activity-item"><span class="activity-icon">🔎</span><div><strong>侦察 EXE 样本</strong><small>看懂 Windows PE 和 .NET 的基本信息</small></div><span class="activity-trailing">发现</span></div><div class="activity-item"><span class="activity-icon">🧭</span><div><strong>沿着程序入口追踪</strong><small>在 ILSpy 里从 Main 找到校验方法</small></div><span class="activity-trailing">探索</span></div><div class="activity-item"><span class="activity-icon">🪄</span><div><strong>还原 XOR 密码</strong><small>用字节运算找到通行短语和 flag</small></div><span class="activity-trailing">解谜</span></div></div></section><section class="panel goal-card animate-in"><div class="eyebrow">🏆 最终目标</div><p>不只是看懂题解：完成路线后，自己下载、反编译、推导并运行一份真正的 Windows EXE，拿到程序输出的 flag。</p><div class="goal-chips"><span class="chip">Windows PE</span><span class="chip">ILSpy</span><span class="chip">XOR</span></div></section></div>`;
  app.querySelector('[data-action="resume"]').addEventListener('click', () => openLesson(resumeIndex));
  app.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', () => { if (el.dataset.lesson !== undefined) openLesson(Number(el.dataset.lesson)); else setView(el.dataset.view); }));
}

function openLesson(index) {
  if (index > 0 && !state.completedLessons.includes(index - 1)) { notify('先完成上一座小岛的小问答，再继续前进吧！'); return; }
  state.activeLesson = index; saveState(); setView('lesson');
}
function renderLesson(index) {
  const lesson = lessons[index], done = state.completedLessons.includes(index), savedAnswer = state.checkpointAnswers[index];
  app.innerHTML = `<div class="lesson-layout"><div class="lesson-main"><div class="eyebrow">🧭 新手冒险线 / 小岛 0${index + 1}</div><div class="lesson-title-row"><div><h1>${lesson.title}</h1><p>${lesson.summary}</p></div><span class="lesson-badge">⏱ ${lesson.duration}</span></div><article class="lesson-card animate-in"><p class="lead">${lesson.lead}</p><div class="code-window"><div class="code-titlebar"><span class="window-dot"></span><span class="window-dot"></span><span class="window-dot"></span><span class="code-title">${lesson.codeTitle}</span><span class="code-lang">${lesson.codeLang}</span></div><pre>${lesson.code}</pre></div>${lesson.paragraphs.map(p => `<p>${p}</p>`).join('')}<div class="callout"><span class="callout-mark">💡</span><span>冒险小贴士：先记下观察到的证据，再想它可能说明什么。逆向不是猜谜，线索可以一步步验证！</span></div><h2>三步解谜法</h2><div class="lesson-steps"><div class="step-card"><span>STEP 01</span><strong>👀 找线索</strong><p>圈出输入、常量和条件。</p></div><div class="step-card"><span>STEP 02</span><strong>🧠 猜逻辑</strong><p>用自己的话说说代码做了什么。</p></div><div class="step-card"><span>STEP 03</span><strong>🧪 验证一下</strong><p>试着答对下面的小问题。</p></div></div><div class="checkpoint"><h3>🌟 小岛知识问答 <span class="tag">答对就升级</span></h3><p class="checkpoint-question">${lesson.checkpoint.q}</p><div class="answer-options">${lesson.checkpoint.options.map((o,i) => `<button class="answer-option" data-option="${i}"><span class="radio-dot"></span>${o}</button>`).join('')}</div><div class="checkpoint-feedback ${done ? 'ok' : ''}" id="checkpoint-feedback">${done ? `⭐ ${lesson.checkpoint.explain}` : ''}</div><div class="lesson-footer"><small>${done ? '这座小岛已经点亮！' : '答对后获得 20 XP，并点亮这座小岛。'}</small><button id="check-answer" class="button button-primary button-small">${done ? (index === lessons.length - 1 ? '去打 EXE Boss！' : '继续下一座岛') : '提交答案'} →</button></div></div></article></div><aside class="lesson-aside"><section class="aside-card animate-in"><h3>🧺 本站收获</h3><div class="objective-list">${lesson.objectives.map((o,i) => `<div class="objective"><i>${done ? '✓' : String(i+1).padStart(2,'0')}</i><span>${o}</span></div>`).join('')}</div></section><section class="aside-card animate-in"><h3>🧰 探险工具</h3><div class="tool-row"><span class="tool-logo">${index === 0 ? 'PE' : index === 1 ? 'IL' : index === 3 ? 'XOR' : 'if'}</span><div class="tool-copy"><strong>${index < 2 ? 'ILSpy' : index === 3 ? 'Python / 计算器' : '条件与循环'}</strong><small>${index < 2 ? '查看 .NET 程序结构' : index === 3 ? '按字节验证变换' : '跟着分支走一遍'}</small></div></div><p class="aside-note">不用一口气学会所有工具。每到新关卡，小字节会告诉你下一步用什么。</p></section><section class="aside-card animate-in"><h3>🎁 下一份礼物</h3><p class="aside-note">${index < lessons.length - 1 ? `完成本岛问答，解锁「${lessons[index+1].short}」。` : '完成这座岛，最终 EXE Boss 就会开放！'}</p>${done ? '<span class="chip">⭐ 已点亮</span>' : ''}</section></aside></div>`;
  let selected = savedAnswer == null ? null : savedAnswer;
  const options = [...app.querySelectorAll('.answer-option')];
  options.forEach((btn,i) => { if (selected === i) btn.classList.add('selected'); btn.addEventListener('click', () => { selected = i; options.forEach(o => o.classList.remove('selected')); btn.classList.add('selected'); }); });
  document.querySelector('#check-answer').addEventListener('click', () => {
    const feedback = document.querySelector('#checkpoint-feedback');
    if (selected == null) { feedback.textContent = '先选一个答案，小字节等你呢！'; feedback.classList.remove('ok'); return; }
    state.checkpointAnswers[index] = selected;
    if (selected === lesson.checkpoint.answer) {
      if (!state.completedLessons.includes(index)) state.completedLessons.push(index);
      saveState(); feedback.textContent = `⭐ ${lesson.checkpoint.explain}`; feedback.classList.add('ok'); celebrate();
      const button = document.querySelector('#check-answer'); button.textContent = index === lessons.length - 1 ? '去打 EXE Boss！ →' : '继续下一座岛 →';
      button.onclick = () => index === lessons.length - 1 ? setView('challenges') : openLesson(index + 1);
      notify('答对啦！+20 XP，小岛点亮！');
    } else { saveState(); feedback.textContent = '差一点点！再看看代码里的条件和目标吧。'; feedback.classList.remove('ok'); }
  });
  if (done) document.querySelector('#check-answer').onclick = () => index === lessons.length - 1 ? setView('challenges') : openLesson(index + 1);
}

function renderChallenges() {
  const completed = state.completedLessons.length;
  app.innerHTML = `<div class="eyebrow">🧩 练习关卡 / PUZZLE PATH</div><div class="section-header" style="margin-top:9px"><div><h1 style="margin:0;color:#4b4149;font-size:23px;font-weight:900;letter-spacing:-.04em">来玩几个小谜题！</h1><p>热身练习帮你熟悉方法，最后还有一份真正的 EXE Boss 等你挑战。</p></div><span class="chip">✨ ${state.completedChallenges.length}/${challenges.length} 通关</span></div><div class="challenge-grid"><div class="challenge-list">${challenges.map((c,i) => { const solved = state.completedChallenges.includes(c.id), unlocked = solved || (completed >= c.unlock && (c.kind !== 'exe' || state.environmentReady)); return `<div class="challenge-row animate-in"><div class="challenge-symbol">${['🌉','🪲','🧩','👑'][i]}</div><div class="challenge-info"><h3>${c.title}</h3><p>${c.subtitle}</p><div class="challenge-meta"><span class="tag ${i < 2 ? 'easy' : ''}">${c.difficulty}</span><span class="tag">${c.category}</span></div></div><div class="challenge-actions">${solved ? '<span class="challenge-result">⭐ 通关</span>' : unlocked ? '' : `<span class="challenge-result" style="color:#a19a90">🔒 ${c.kind === 'exe' && completed >= c.unlock ? '先完成工具环境配置' : `${c.unlock} 座岛后开放`}</span>`}<button class="button ${unlocked ? 'button-secondary' : 'button-quiet'} button-small" data-open-challenge="${c.id}" ${unlocked ? '' : 'disabled'}>${solved ? '看复盘' : unlocked ? '开始玩' : '等等我'} →</button></div></div>`; }).join('')}</div><aside class="challenge-side"><section class="aside-card animate-in"><h3>🌟 冒险小规则</h3><p class="hint-policy">先自己找线索。卡住了就开一条提示；你也可以把分析过程记进探险手册。</p><div class="goal-chips"><span class="chip">👀 找线索</span><span class="chip">🧠 猜逻辑</span><span class="chip">🧪 验证</span></div></section><section class="aside-card animate-in"><h3>🏆 最后一关会用到</h3><div class="objective-list"><div class="objective"><i>✓</i><span>ILSpy 阅读 .NET 程序</span></div><div class="objective"><i>✓</i><span>追踪 Main 和输入检查</span></div><div class="objective"><i>✓</i><span>还原按位置变化的 XOR</span></div><div class="objective"><i>→</i><span>本地运行 EXE，获取它输出的 flag</span></div></div><button class="button button-secondary button-small toolbox-cta" data-view="toolbox">🧰 去工具补给站配置环境</button></section></aside></div>`;
  app.querySelectorAll('[data-open-challenge]').forEach(btn => btn.addEventListener('click', () => { activeChallenge = btn.dataset.openChallenge; setView('challenge-detail'); }));
  app.querySelectorAll('[data-view="toolbox"]').forEach(btn => btn.addEventListener('click', () => setView('toolbox')));
}

function renderChallenge(id) {
  const challenge = challenges.find(c => c.id === id);
  const solved = state.completedChallenges.includes(id), hintsUsed = state.hints[id] || 0;
  const lessonsReady = state.completedLessons.length >= challenge.unlock;
  const unlocked = solved || (lessonsReady && (challenge.kind !== 'exe' || state.environmentReady));
  const exeCard = challenge.kind === 'exe' ? `<div class="download-card"><span class="download-icon">📦</span><div class="download-copy"><strong>RevQuest.FirstSteps.exe</strong><small>Windows x64 · .NET 8 · 自制静态教学样本</small><div class="download-meta"><span class="pe-tag">PE32+</span><span class="pe-tag">.NET</span><span class="pe-tag">无联网 / 不读写文件</span></div></div><a class="button button-primary button-small" href="./challenges/RevQuest.FirstSteps.exe" download>下载 EXE ↓</a></div><div class="download-step"><b>1</b><span>用 DIE 打开样本，确认它是 Windows PE，并记下架构与 .NET 特征。</span></div><div class="download-step"><b>2</b><span>用 HxD 观察文件开头的 <code>4D 5A</code>（ASCII 为 <code>MZ</code>）；只查看，不要改写样本。</span></div><div class="download-step"><b>3</b><span>用 ILSpy 打开 EXE，从 <code>Program.Main</code> 跟到 <code>CheckPhrase</code>。</span></div><div class="download-step"><b>4</b><span>还原通行短语后，在自己的 Windows 终端运行：<code>RevQuest.FirstSteps.exe</code>。</span></div><div class="download-step"><b>5</b><span>输入通行短语，程序会打印 flag。把 flag 粘贴到下方验证。</span></div><div class="win-warning">🛡️ 这是本项目自制的离线练习样本，源码和构建方法附在仓库 <code>challenges/</code>。仅用于本地教学，不要把未知来源程序用于日常设备。</div>` : '';
  app.innerHTML = `<div class="eyebrow"><button class="text-link" data-back>← 回到关卡地图</button> / ${challenge.category}</div><div class="section-header" style="margin-top:8px"><div><h1 style="margin:0;color:#4b4149;font-size:22px;font-weight:900">${challenge.title}</h1><p>${challenge.subtitle}</p></div><span class="tag ${challenge.difficulty === '毕业挑战' ? '' : 'easy'}">${challenge.difficulty}</span></div>${unlocked ? '' : `<div class="lock-banner">🔒 ${challenge.kind === 'exe' && !lessonsReady ? `点亮前 ${challenge.unlock} 座小岛后，再完成环境配置即可挑战。` : challenge.kind === 'exe' ? '先到工具补给站确认已安装 .NET 8 Runtime 和 ILSpy。' : `点亮前 ${challenge.unlock} 座小岛，就能挑战这个谜题啦。`} ${challenge.kind === 'exe' && lessonsReady ? '<button class="text-link" data-view="toolbox">前往工具补给站 →</button>' : ''}</div>`}<div class="challenge-grid"><section class="challenge-workspace animate-in"><div class="eyebrow">🧪 ${challenge.kind === 'exe' ? '本地样本挑战' : '教学谜题'} / AUTHORIZED PRACTICE</div><p class="challenge-body">${challenge.description}</p>${exeCard}<div class="code-window"><div class="code-titlebar"><span class="window-dot"></span><span class="window-dot"></span><span class="window-dot"></span><span class="code-title">${challenge.codeTitle}</span><span class="code-lang">${challenge.codeLang}</span></div><pre>${challenge.code}</pre></div><div class="callout"><span class="callout-mark">💡</span><span>${challenge.kind === 'exe' ? '网站不会替你运行 EXE。你会在自己的电脑上分析并运行样本，再把程序亲自打印出的 flag 带回来。' : '先试着独立推理。答对后会显示完整复盘，方便你检查自己的思路。'}</span></div><label class="checkpoint-question" for="challenge-answer">${challenge.answerLabel}</label><div class="submit-row"><input class="text-input" id="challenge-answer" placeholder="${challenge.answerPlaceholder}" value="${solved ? escapeHtml(challenge.expected) : ''}" ${solved ? 'disabled' : ''} /><button id="submit-challenge" class="button button-primary button-small" ${!unlocked || solved ? 'disabled' : ''}>${solved ? '已通关 ✓' : '提交答案'}</button></div><div id="challenge-feedback" class="challenge-feedback ${solved ? 'ok' : ''}">${solved ? '🎉 太棒啦！看下方复盘，给自己的解题方法盖个章。' : ''}</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><strong style="font-size:9px;font-weight:900">🪄 需要一点提示吗？</strong><button id="reveal-hint" class="hint-button" ${solved ? 'disabled' : ''}>${hintsUsed >= challenge.hints.length ? '提示已全部揭开' : `打开提示 ${hintsUsed + 1}/${challenge.hints.length}`}</button></div><div class="hint-stack">${challenge.hints.slice(0, hintsUsed).map((h,i) => `<div class="hint-card"><strong>✨ 提示 ${i + 1}</strong><p>${h}</p></div>`).join('')}</div>${solved ? `<div class="callout"><span class="callout-mark">🏆</span><span><strong>解谜复盘：</strong>${challenge.explanation}</span></div>` : ''}<div class="lesson-footer"><small>${hintsUsed === 0 ? '独立通关会额外得到成就感，XP 也更多！' : `已打开 ${hintsUsed} 条提示，继续沿着线索推理。`}</small><button class="button button-secondary button-small" data-back>回关卡地图</button></div></section><aside class="challenge-side"><section class="aside-card animate-in"><h3>📒 探险手记</h3><p class="hint-policy">写下观察、假设和验证结果，只保存在当前浏览器。</p><textarea class="note-area" id="challenge-note" placeholder="我发现了……\n我猜校验方式是……\n我会通过……验证。">${escapeHtml(state.notes[id] || '')}</textarea><div class="note-actions"><span>自动保存</span><span id="note-count">0 字</span></div></section><section class="aside-card animate-in"><h3>🧭 推荐分析顺序</h3><div class="objective-list"><div class="objective"><i>1</i><span>先找到输入从哪进入程序。</span></div><div class="objective"><i>2</i><span>跟进校验方法，圈出长度和数组。</span></div><div class="objective"><i>3</i><span>推导每个字节的变换并复核。</span></div><div class="objective"><i>4</i><span>运行样本验证自己的假设。</span></div></div></section></aside></div>`;
  document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => setView('challenges')));
  document.querySelectorAll('[data-view="toolbox"]').forEach(b => b.addEventListener('click', () => setView('toolbox')));
  const note = document.querySelector('#challenge-note');
  const updateCount = () => { document.querySelector('#note-count').textContent = `${note.value.length} 字`; };
  note.addEventListener('input', () => { state.notes[id] = note.value; saveState(); updateCount(); }); updateCount();
  document.querySelector('#reveal-hint').addEventListener('click', () => { if (hintsUsed >= challenge.hints.length) return; state.hints[id] = hintsUsed + 1; saveState(); renderChallenge(id); notify(`线索 ${hintsUsed + 1} 已加入探险手记！`); });
  document.querySelector('#submit-challenge').addEventListener('click', () => {
    const input = document.querySelector('#challenge-answer'), feedback = document.querySelector('#challenge-feedback');
    if (challenge.check(input.value)) {
      if (!state.completedChallenges.includes(id)) state.completedChallenges.push(id);
      saveState(); renderChallenge(id); celebrate(); notify(challenge.kind === 'exe' ? 'Boss 通关！+100 XP，flag 到手！' : '解谜成功！冒险 XP +35！');
    } else { feedback.textContent = challenge.kind === 'exe' ? '这个 flag 还不对。确认你运行了本地 EXE，并完整复制程序输出。' : '差一点！再对照线索检查一下。'; feedback.classList.remove('ok'); }
  });
}

function renderToolbox() {
  const tools = [
    { icon: '🔎', name: 'Detect It Easy (DIE)', kind: '样本侦察 · 静态分析', fit: '先判断文件格式、CPU 架构、编译器和是否可能经过加壳。识别结果是线索，仍要结合其他证据。', link: 'https://github.com/horsicq/DIE-engine/releases', action: '官方 GitHub 下载', steps: ['启动 DIE，把练习 EXE 拖进窗口。', '查看文件类型、Machine / Architecture 和 Compiler 等识别信息。', '记录判断，再用 HxD 或反编译器交叉确认。'] },
    { icon: '🧊', name: 'HxD', kind: '十六进制查看 · 字节观察', fit: '以十六进制和 ASCII 两种视图查看文件字节，也可以按偏移跳转、搜索文本或字节序列。', link: 'https://mh-nexus.de/en/hxd/', action: 'HxD 官方网站', steps: ['用 HxD 打开样本；左侧是偏移，中间是十六进制，右侧是可读字符。', '观察开头的 `4D 5A`（ASCII 为 `MZ`），这是常见 PE 文件的 DOS 标记。', '用搜索找可见字符串。教学样本只做观察，不要修改或保存覆盖原文件。'] },
    { icon: '🪞', name: 'ILSpy', kind: '.NET 反编译 · 当前 EXE 主力', fit: '当前 Boss 是 .NET 8 程序，ILSpy 能查看程序集结构并反编译为易读的 C#。', link: 'https://github.com/icsharpcode/ILSpy/releases', action: 'ILSpy 官方 Releases', steps: ['打开 ILSpy，将 `RevQuest.FirstSteps.exe` 拖入程序集树。', '展开程序集，找到 `Program` 类型和 `Main` 方法。', '跟进 `CheckPhrase`，记录长度条件、循环、XOR 公式与 Gate 数组。', '在纸上或计算器中逐字节还原通行短语，再运行样本验证。'] },
    { icon: '🐛', name: 'dnSpyEx', kind: '.NET 动态调试 · 社区维护版', fit: '适用于托管 .NET 程序的断点、单步、局部变量、Watch 和调用栈观察。项目是社区维护的非官方复活版。', link: 'https://github.com/dnSpyEx/dnSpy/releases', action: 'dnSpyEx Releases', steps: ['打开托管程序集，在校验方法中设置断点。', '启动调试并输入测试值，程序停在断点后逐步执行。', '用 Step Over / Step Into 观察分支，用 Locals 或 Watch 看变量。', '查看 Call Stack 理解程序如何到达当前方法。当前 Boss 用 ILSpy 静态分析即可完成，动态调试是加练。'] },
    { icon: '🏛️', name: 'Ghidra', kind: '原生程序 · 反汇编与反编译', fit: '适合原生 x86 / x64 等二进制样本：反汇编、伪 C 反编译、函数图、字符串与交叉引用。需要安装受支持的 JDK。', link: 'https://github.com/NationalSecurityAgency/ghidra/releases/latest', action: 'NSA 官方 Releases', steps: ['创建本地非共享项目，把原生 PE 导入项目并运行自动分析。', '在 Symbol Tree / Functions 中定位函数，双击后对照 Listing 与 Decompiler。', '用 Search → For Strings 找字符串，再查看引用（Xrefs）追踪使用位置。', '打开 Function Graph 看条件分支。当前 .NET Boss 优先用 ILSpy；把 Ghidra 留给后续原生关卡。'] },
    { icon: '🧭', name: 'x64dbg', kind: '原生程序 · Windows 动态调试', fit: '适合授权练习中的原生 Windows x86 / x64 用户态程序，提供断点、寄存器、栈和内存查看。', link: 'https://github.com/x64dbg/x64dbg/releases', action: 'x64dbg 官方 Releases', steps: ['按样本架构使用 x32dbg 或 x64dbg 打开原生练习程序。', '在目标函数地址或字符串引用处下断点，再运行到断点。', '用单步观察跳转，用 Registers、Stack、Dump 窗口看状态变化。', '仅调试自己有权分析的样本。当前 .NET Boss 不需要用 x64dbg。'] },
  ];
  const setupReady = Boolean(state.toolboxChecks.runtime && state.toolboxChecks.ilspy);
  app.innerHTML = `<div class="eyebrow">🧰 冒险装备屋 / TOOLBOX CAMP</div><div class="section-header toolbox-heading"><div><h1>先把工具包整理好！</h1><p>逆向工具各有分工：先识别文件，再选静态分析或动态调试。点开官方页面获取软件，跟着每张卡片试一遍。</p></div><span class="chip">🎒 当前 Boss：.NET EXE</span></div><section class="tool-setup-card animate-in"><div class="tool-setup-head"><div><h2>🎯 EXE Boss 必备环境</h2><p>完成新手课程后，确认这两项已经准备好，就能解锁本机 EXE 挑战。</p></div><span class="setup-status ${setupReady ? 'ready' : ''}">${setupReady ? '✨ 已就绪' : '还差一点'}</span></div><div class="setup-checks"><label class="setup-check"><input type="checkbox" data-tool-check="runtime" ${state.toolboxChecks.runtime ? 'checked' : ''}><span class="setup-check-icon">🪟</span><span><strong>Windows x64 + .NET 8 Runtime</strong><small>用于在本机运行教学 EXE 并领取程序输出的 flag。</small></span></label><label class="setup-check"><input type="checkbox" data-tool-check="ilspy" ${state.toolboxChecks.ilspy ? 'checked' : ''}><span class="setup-check-icon">🪞</span><span><strong>ILSpy</strong><small>用于打开 .NET 程序集，查看 Program.Main 和校验逻辑。</small></span></label></div><div class="setup-links"><a href="https://dotnet.microsoft.com/en-us/download/dotnet/8.0" target="_blank" rel="noopener noreferrer">.NET 8 官方下载 ↗</a><a href="https://github.com/icsharpcode/ILSpy/releases" target="_blank" rel="noopener noreferrer">ILSpy 官方 Releases ↗</a></div><div class="tool-setup-footer"><p>${setupReady ? '装备完成！记得先学完四座新手小岛。' : '勾选表示你已经安装并准备好；本站不会扫描或读取电脑上的软件。'}</p><button class="button button-primary button-small" data-action="toolbox-continue" ${setupReady ? '' : 'disabled'}>${setupReady ? '去挑战 EXE Boss →' : '准备好后继续'}</button></div></section><div class="tool-legend"><span class="tool-legend-dot static"></span>静态分析：不运行样本，先读结构和逻辑 <span class="tool-legend-dot dynamic"></span>动态调试：运行样本，观察执行过程</div><div class="tool-card-grid">${tools.map((tool, i) => `<article class="field-tool-card animate-in"><div class="field-tool-head"><span class="field-tool-icon tool-tone-${i}">${tool.icon}</span><span class="field-tool-type">${tool.kind}</span></div><h2>${tool.name}</h2><p>${tool.fit}</p><a class="button button-quiet button-small" href="${tool.link}" target="_blank" rel="noopener noreferrer">${tool.action} ↗</a><details class="tool-steps"><summary>展开常用操作</summary><ol>${tool.steps.map(step => `<li>${step}</li>`).join('')}</ol></details></article>`).join('')}</div><section class="aside-card toolbox-flow animate-in"><h2>🗺️ 一道题的工具选择路线</h2><div class="tool-flow"><div><b>1</b><strong>先侦察</strong><small>DIE 看格式和架构</small></div><span>→</span><div><b>2</b><strong>找线索</strong><small>HxD 看字节；按类型选 ILSpy 或 Ghidra</small></div><span>→</span><div><b>3</b><strong>追逻辑</strong><small>静态读分支；需要时用 dnSpyEx / x64dbg 动态验证</small></div><span>→</span><div><b>4</b><strong>做验证</strong><small>记录证据、推导输入、本地复核</small></div></div><p class="aside-note">小口诀：.NET 程序先试 ILSpy；原生程序用 Ghidra 看静态逻辑；需要看运行状态再选择匹配的调试器。</p></section>`;
  app.querySelectorAll('[data-tool-check]').forEach(input => input.addEventListener('change', () => {
    state.toolboxChecks[input.dataset.toolCheck] = input.checked;
    state.environmentReady = Boolean(state.toolboxChecks.runtime && state.toolboxChecks.ilspy);
    saveState(); renderToolbox();
  }));
  app.querySelector('[data-action="toolbox-continue"]').addEventListener('click', () => {
    if (!setupReady) return;
    if (state.completedLessons.length < lessons.length) { notify('先点亮四座新手小岛，再来挑战 EXE Boss！'); openLesson(Math.max(0, lessons.findIndex((_, index) => !state.completedLessons.includes(index)))); return; }
    activeChallenge = 'exe-first-quest'; setView('challenge-detail');
  });
}

function renderNotebook() {
  const notes = [...lessons.map((l,i) => ({ id: `lesson-${i}`, title: l.title, body: state.notes[`lesson-${i}`] || '' })), ...challenges.map(c => ({ id: c.id, title: c.title, body: state.notes[c.id] || '' }))];
  app.innerHTML = `<div class="eyebrow">📒 我的探险手册 / FIELD NOTES</div><div class="section-header" style="margin-top:8px"><div><h1 style="margin:0;color:#4b4149;font-size:23px;font-weight:900">我的探险手册</h1><p>把想法记下来，下一关还能接着看。笔记只存在自己的浏览器里。</p></div><span class="chip">✍️ 自动保存</span></div><div class="callout"><span class="callout-mark">✦</span><span>好用的小模板：我看到了什么？我猜程序在做什么？哪一步能证明或推翻这个猜测？</span></div><div class="notebook-grid">${notes.map(n => `<section class="notebook-card animate-in"><h3>${n.title}</h3><p>${n.id.startsWith('lesson-') ? '🏝️ 小岛笔记' : '🧩 关卡笔记'}</p><textarea class="note-area notebook-note" data-note-id="${n.id}" placeholder="记下你的观察和推理……">${escapeHtml(n.body)}</textarea><div class="note-actions"><span>仅保存在此浏览器</span><span class="note-count">${n.body.length} 字</span></div></section>`).join('')}</div>`;
  app.querySelectorAll('.notebook-note').forEach(textarea => textarea.addEventListener('input', () => { state.notes[textarea.dataset.noteId] = textarea.value; saveState(); textarea.nextElementSibling.querySelector('.note-count').textContent = `${textarea.value.length} 字`; }));
}

document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
document.querySelectorAll('.route-item').forEach(button => button.addEventListener('click', () => openLesson(Number(button.dataset.lesson))));
document.querySelector('#reset-progress').addEventListener('click', () => document.querySelector('#reset-dialog').showModal());
document.querySelector('#reset-dialog').addEventListener('close', event => { if (event.target.returnValue === 'confirm') { state = freshState(); saveState(); setView('home'); notify('探险路线重置，随时可以重新出发！'); } });
render();
