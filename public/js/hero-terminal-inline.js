(function() {
  'use strict';

  // Wait for DOM
  function init() {
    const terminal = document.querySelector('.terminal-content');
    if (!terminal) return;

    // Prevent double init
    if (terminal.dataset.initialized) return;
    terminal.dataset.initialized = 'true';

    // Store original static content then clear
    terminal.innerHTML = '';

    // Create output area
    const output = document.createElement('div');
    output.id = 'term-output';
    output.style.cssText = 'margin-bottom:8px;white-space:pre-wrap;line-height:1.6;';
    terminal.appendChild(output);

    // Create input line
    const inputLine = document.createElement('div');
    inputLine.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;';
    inputLine.innerHTML = `
      <span style="color:#4ade80;font-weight:600;">theophilus</span>
      <span style="color:rgba(255,255,255,0.5)">@</span>
      <span style="color:#60a5fa;font-weight:600;">TheoInCodeLand</span>
      <span style="color:#c084fc">~</span>
      <span style="color:rgba(255,255,255,0.9)">%</span>
      <input type="text" id="term-input" autocomplete="off" spellcheck="false" placeholder="type 'help'..." 
        style="background:transparent;border:none;outline:none;color:rgba(255,255,255,0.95);font-family:inherit;font-size:inherit;flex:1;min-width:60px;caret-color:transparent;">
      <span style="color:#4ade80;animation:blink 1s step-end infinite;">▋</span>
    `;
    terminal.appendChild(inputLine);

    // Add blink animation
    if (!document.getElementById('term-anim')) {
      const style = document.createElement('style');
      style.id = 'term-anim';
      style.textContent = '@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}';
      document.head.appendChild(style);
    }

    const input = document.getElementById('term-input');
    const history = [];
    let historyIdx = -1;

    // Data
    const data = {
      skills: [
        '<span style="color:#fbbf24">JavaScript / TypeScript / Node.js</span>',
        '<span style="color:#4ade80">Python / FastAPI / Django</span>',
        '<span style="color:#22d3ee">PostgreSQL / MongoDB / Redis</span>',
        '<span style="color:#e879f9">AI/ML / LangChain / OpenAI</span>'
      ],
      projects: [
        {n:'Axiora AI', d:'RAG chatbot with 94% accuracy', s:'shipped'},
        {n:'Happy Deliveries', d:'Real-time geospatial platform', s:'shipped'},
        {n:'JobTrack', d:'AI job application tracker', s:'beta'}
      ]
    };

    // Print functions
    function print(html) {
      const div = document.createElement('div');
      div.style.cssText = 'margin:3px 0;';
      div.innerHTML = html;
      output.appendChild(div);
      terminal.scrollTop = terminal.scrollHeight;
    }

    function printPrompt() {
      print(`<span style="color:#4ade80">theophilus</span><span style="color:rgba(255,255,255,0.5)">@</span><span style="color:#60a5fa">TheoInCodeLand</span> <span style="color:#c084fc">~</span> <span style="color:rgba(255,255,255,0.9)">%</span>`);
    }

    function printCmd(cmd) {
      print(`<span style="color:#4ade80">theophilus</span><span style="color:rgba(255,255,255,0.5)">@</span><span style="color:#60a5fa">TheoInCodeLand</span> <span style="color:#c084fc">~</span> <span style="color:rgba(255,255,255,0.9)">%</span> <span style="color:rgba(255,255,255,0.95)">${cmd}</span>`);
    }

    // Commands
    const cmds = {
      help: () => {
        print(`<span style="color:#fbbf24">Available commands:</span>`);
        print(`  <span style="color:#22d3ee">help</span>     <span style="color:rgba(255,255,255,0.5)">-</span> Show this menu`);
        print(`  <span style="color:#22d3ee">whoami</span>   <span style="color:rgba(255,255,255,0.5)">-</span> Who is Theo?`);
        print(`  <span style="color:#22d3ee">skills</span>   <span style="color:rgba(255,255,255,0.5)">-</span> Technical skills`);
        print(`  <span style="color:#22d3ee">projects</span> <span style="color:rgba(255,255,255,0.5)">-</span> Recent work`);
        print(`  <span style="color:#22d3ee">contact</span>  <span style="color:rgba(255,255,255,0.5)">-</span> Get in touch`);
        print(`  <span style="color:#22d3ee">clear</span>    <span style="color:rgba(255,255,255,0.5)">-</span> Clear terminal`);
      },
      whoami: () => {
        print(`<span style="color:#4ade80;font-weight:600;">Theo Thobejane</span> <span style="color:rgba(255,255,255,0.5)">-</span> <span style="color:#fbbf24">Backend Engineer & AI Developer</span>`);
        print(`<span style="color:rgba(255,255,255,0.7)">Full-stack developer & AI engineer building tools and open-source projects.</span>`);
      },
      skills: () => {
        print(`<span style="color:#fbbf24">Technical Skills:</span>`);
        data.skills.forEach(s => print(`  <span style="color:rgba(255,255,255,0.5)">▸</span> ${s}`));
      },
      projects: () => {
        print(`<span style="color:#fbbf24">Recent Projects:</span>`);
        data.projects.forEach(p => {
          const color = p.s === 'shipped' ? '#4ade80' : '#fbbf24';
          print(`<div style="margin:6px 0;padding:8px 12px;background:rgba(255,255,255,0.05);border-radius:4px;border-left:2px solid ${color};">
            <span style="color:#4ade80;font-weight:600;">${p.n}</span> <span style="color:${color};font-size:0.75rem;">[${p.s}]</span><br>
            <span style="color:rgba(255,255,255,0.6);font-size:0.8rem;">${p.d}</span>
          </div>`);
        });
      },
      contact: () => {
        print(`<span style="color:#fbbf24">Get in touch:</span>`);
        print(`  <span style="color:#22d3ee">Email:</span>    <span style="color:rgba(255,255,255,0.9)">theo@example.com</span>`);
        print(`  <span style="color:#22d3ee">GitHub:</span>   <span style="color:rgba(255,255,255,0.9)">github.com/theophilus</span>`);
        print(`  <span style="color:#22d3ee">LinkedIn:</span> <span style="color:rgba(255,255,255,0.9)">linkedin.com/in/theophilus</span>`);
      },
      clear: () => { output.innerHTML = ''; printWelcome(); },
      hello: () => print(`<span style="color:#4ade80">Hello!</span> Nice to meet you. Type <span style="color:#fbbf24">'help'</span> to see what I can do.`),
      hi: () => cmds.hello(),
      ls: () => print(`<span style="color:#22d3ee">projects</span>  <span style="color:#22d3ee">skills</span>  <span style="color:#22d3ee">contact.txt</span>  <span style="color:#22d3ee">about.md</span>`)
    };

    function printWelcome() {
      print(`<span style="color:#4ade80">Welcome to TheoInCode Terminal v2.0.0</span>`);
      print(`<span style="color:rgba(255,255,255,0.5)">Type 'help' to see available commands.</span>`);
      print('');
    }

    // Event handlers
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = input.value.trim();
        if (cmd) {
          history.push(cmd);
          historyIdx = -1;
          printCmd(cmd);

          const fn = cmds[cmd.toLowerCase()];
          if (fn) fn();
          else {
            print(`<span style="color:#fb7185">bash: ${cmd}: command not found</span>`);
            print(`Type <span style="color:#fbbf24">'help'</span> to see available commands.`);
          }
        } else {
          printPrompt();
        }
        input.value = '';
        terminal.scrollTop = terminal.scrollHeight;
      }
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length === 0) return;
        historyIdx = Math.min(historyIdx + 1, history.length - 1);
        input.value = history[history.length - 1 - historyIdx];
      }
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        historyIdx = Math.max(historyIdx - 1, -1);
        input.value = historyIdx === -1 ? '' : history[history.length - 1 - historyIdx];
      }
      else if (e.key === 'Tab') {
        e.preventDefault();
        const val = input.value.toLowerCase();
        const matches = Object.keys(cmds).filter(c => c.startsWith(val));
        if (matches.length === 1) input.value = matches[0];
      }
      else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        cmds.clear();
      }
    });

    // Focus handling
    input.focus();
    terminal.closest('.terminal-card').addEventListener('click', (e) => {
      if (e.target.tagName !== 'A') input.focus();
    });

    // Start
    printWelcome();
    console.log('[Terminal] Initialized');
  }

  // Multiple init attempts
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  setTimeout(init, 500);
  setTimeout(init, 1500);
})();