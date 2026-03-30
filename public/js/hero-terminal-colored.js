(function() {
  'use strict';

  class HeroTerminal {
    constructor() {
      this.initialized = false;
      this.terminalContent = null;
      this.output = null;
      this.input = null;

      // Command history
      this.history = [];
      this.historyIndex = -1;

      // Portfolio data
      this.data = {
        name: 'Theo Thobejane',
        role: 'Backend Engineer & AI Developer',
        location: 'South Africa',
        skills: [
          { name: 'JavaScript / TypeScript', level: 'expert', color: 'yellow' },
          { name: 'Node.js / Express / NestJS', level: 'expert', color: 'green' },
          { name: 'Python / FastAPI / Django', level: 'expert', color: 'yellow' },
          { name: 'PostgreSQL / MongoDB / Redis', level: 'advanced', color: 'cyan' },
          { name: 'Docker / AWS / Vercel', level: 'advanced', color: 'cyan' },
          { name: 'AI/ML / LangChain / OpenAI', level: 'intermediate', color: 'magenta' }
        ],
        projects: [
          { name: 'Axiora AI', desc: 'RAG chatbot with 94% relevance accuracy', status: 'shipped' },
          { name: 'Happy Deliveries', desc: 'Real-time geospatial delivery platform', status: 'shipped' },
          { name: 'JobTrack', desc: 'AI-powered job application tracker', status: 'beta' },
          { name: 'Portfolio V2', desc: 'Interactive terminal portfolio', status: 'live' }
        ],
        contact: {
          email: 'theo@example.com',
          github: 'github.com/theophilus',
          linkedin: 'linkedin.com/in/theophilus',
          twitter: '@theophilus'
        }
      };
    }

    init() {
      console.log('[Terminal] Initializing...');

      this.terminalContent = document.getElementById('terminalContent') || 
                            document.querySelector('.terminal-content');

      if (!this.terminalContent) {
        console.error('[Terminal] .terminal-content not found');
        return;
      }

      if (this.terminalContent.classList.contains('interactive')) {
        console.log('[Terminal] Already initialized');
        return;
      }

      this.buildInteractiveTerminal();
      this.initialized = true;
      console.log('[Terminal] Initialized successfully');
    }

    buildInteractiveTerminal() {
      this.terminalContent.classList.add('interactive');

      // Check if structure already exists
      const existingOutput = this.terminalContent.querySelector('.terminal-output');
      const existingInput = this.terminalContent.querySelector('.terminal-input');

      if (existingOutput && existingInput) {
        this.output = existingOutput;
        this.input = existingInput;
        this.bindEvents();
        this.printWelcome();
        return;
      }

      // Build structure
      this.terminalContent.innerHTML = `
        <div class="terminal-output" id="terminalOutput"></div>
        <div class="terminal-input-line">
          <span class="terminal-prompt">
            <span class="prompt-user">theophilus</span><span class="prompt-at">@</span><span class="prompt-host">TheoInCodeLand</span> <span class="prompt-path">~</span> <span class="prompt-symbol">%</span>
          </span>
          <input type="text" class="terminal-input" id="terminalInput" autocomplete="off" spellcheck="false" placeholder="type here..." />
          <span class="terminal-cursor">▋</span>
        </div>
      `;

      this.output = document.getElementById('terminalOutput');
      this.input = document.getElementById('terminalInput');

      this.bindEvents();
      this.printWelcome();
    }

    bindEvents() {
      if (!this.input) {
        console.error('[Terminal] Input element not found');
        return;
      }

      this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));

      const terminalCard = this.terminalContent.closest('.terminal-card') || this.terminalContent;
      terminalCard.addEventListener('click', (e) => {
        if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') {
          this.input.focus();
        }
      });

      // Auto-focus
      setTimeout(() => this.input.focus(), 100);
    }

    handleKeyDown(e) {
      console.log('[Terminal] Key pressed:', e.key);

      switch(e.key) {
        case 'Enter':
          e.preventDefault();
          const cmd = this.input.value.trim();
          console.log('[Terminal] Executing command:', cmd);
          this.executeCommand(cmd);
          break;

        case 'ArrowUp':
          e.preventDefault();
          this.navigateHistory(-1);
          break;

        case 'ArrowDown':
          e.preventDefault();
          this.navigateHistory(1);
          break;

        case 'Tab':
          e.preventDefault();
          this.autocomplete();
          break;

        case 'l':
        case 'L':
          if (e.ctrlKey) {
            e.preventDefault();
            this.clear();
          }
          break;
      }
    }

    navigateHistory(direction) {
      if (this.history.length === 0) return;
      this.historyIndex += direction;
      if (this.historyIndex < -1) this.historyIndex = -1;
      else if (this.historyIndex >= this.history.length) this.historyIndex = this.history.length - 1;

      this.input.value = this.historyIndex === -1 ? '' : this.history[this.history.length - 1 - this.historyIndex];
    }

    autocomplete() {
      const commands = ['help', 'whoami', 'skills', 'projects', 'contact', 'clear'];
      const input = this.input.value.toLowerCase().trim();
      if (!input) return;

      const matches = commands.filter(cmd => cmd.startsWith(input));
      if (matches.length === 1 && matches[0] !== input) {
        this.input.value = matches[0];
      } else if (matches.length > 1) {
        this.printCommand(input);
        this.printLine(matches.map(m => `<span class="cmd-cyan">${m}</span>`).join('  '), 'raw');
      }
    }

    executeCommand(cmd) {
      if (!cmd) {
        this.printPrompt();
        return;
      }

      this.history.push(cmd);
      this.historyIndex = -1;
      this.printCommand(cmd);
      this.input.value = '';

      const cmdLower = cmd.toLowerCase().trim();

      switch(cmdLower) {
        case 'help':
          this.cmdHelp();
          break;
        case 'whoami':
          this.cmdWhoami();
          break;
        case 'skills':
          this.cmdSkills();
          break;
        case 'projects':
          this.cmdProjects();
          break;
        case 'contact':
          this.cmdContact();
          break;
        case 'clear':
        case 'cls':
          this.clear();
          break;
        case 'hello':
        case 'hi':
          this.printLine(`<span class="cmd-green">Hello!</span> Nice to meet you. Type <span class="cmd-yellow">'help'</span> to see what I can do.`, 'raw');
          break;
        case 'ls':
          this.printLine(`<span class="cmd-cyan">projects</span>  <span class="cmd-cyan">skills</span>  <span class="cmd-cyan">contact.txt</span>  <span class="cmd-cyan">about.md</span>`, 'raw');
          break;
        case 'pwd':
          this.printLine(`/home/theophilus/portfolio`, 'output');
          break;
        case 'date':
          this.printLine(new Date().toString(), 'output');
          break;
        default:
          this.printLine(`<span class="cmd-red">bash: ${cmd}: command not found</span>`, 'raw');
          this.printLine(`Type <span class="cmd-yellow">'help'</span> to see available commands.`, 'raw');
      }

      this.scrollToBottom();
    }

    printPrompt() {
      const promptHtml = `<span class="prompt-user">theophilus</span><span class="prompt-at">@</span><span class="prompt-host">TheoInCodeLand</span> <span class="prompt-path">~</span> <span class="prompt-symbol">%</span>`;
      this.printLine(`<div class="terminal-prompt-line">${promptHtml}</div>`, 'raw');
    }

    printCommand(cmd) {
      const promptHtml = `<span class="prompt-user">theophilus</span><span class="prompt-at">@</span><span class="prompt-host">TheoInCodeLand</span> <span class="prompt-path">~</span> <span class="prompt-symbol">%</span>`;
      this.printLine(`<div class="terminal-prompt-line">${promptHtml} <span class="cmd-white">${this.escapeHtml(cmd)}</span></div>`, 'raw');
    }

    printWelcome() {
      this.printLine(`<span class="cmd-green">Welcome to TheoInCode Terminal v2.0.0</span>`, 'raw');
      this.printLine(`<span class="cmd-gray">Type 'help' to see available commands.</span>`, 'raw');
      this.printLine('');
    }

    cmdHelp() {
      const helpText = `<span class="cmd-yellow">Available commands:</span>

  <span class="cmd-cyan">help</span>      <span class="cmd-gray">-</span> <span class="cmd-white">Show this menu</span>
  <span class="cmd-cyan">whoami</span>    <span class="cmd-gray">-</span> <span class="cmd-white">Who is Theo?</span>
  <span class="cmd-cyan">skills</span>    <span class="cmd-gray">-</span> <span class="cmd-white">Technical skills & stack</span>
  <span class="cmd-cyan">projects</span>  <span class="cmd-gray">-</span> <span class="cmd-white">Recent work & shipped projects</span>
  <span class="cmd-cyan">contact</span>   <span class="cmd-gray">-</span> <span class="cmd-white">Get in touch</span>
  <span class="cmd-cyan">clear</span>     <span class="cmd-gray">-</span> <span class="cmd-white">Clear terminal</span>
  <span class="cmd-cyan">ls</span>        <span class="cmd-gray">-</span> <span class="cmd-white">List directory contents</span>`;
      this.printLine(helpText, 'raw');
    }

    cmdWhoami() {
      const whoamiText = `<span class="cmd-green">${this.data.name}</span> <span class="cmd-gray">-</span> <span class="cmd-yellow">${this.data.role}</span>
<span class="cmd-gray">Location: ${this.data.location}</span>

<span class="cmd-white">Full-stack developer & AI engineer with a passion for building</span>
<span class="cmd-white">tools, experiments, and open-source projects.</span>

<span class="cmd-green">4 production apps</span> <span class="cmd-gray">— from enterprise RAG chatbots to real-time</span>
<span class="cmd-gray">geospatial platforms. I don't just write code; I build systems</span>
<span class="cmd-gray">that solve real problems.</span>`;
      this.printLine(whoamiText, 'raw');
    }

    cmdSkills() {
      let skillsText = '<span class="cmd-yellow">Technical Skills:</span>\n';
      this.data.skills.forEach(skill => {
        const colorClass = `cmd-${skill.color}`;
        skillsText += `\n  <span class="cmd-gray">▸</span> <span class="${colorClass}">${skill.name}</span> <span class="cmd-gray">(${skill.level})</span>`;
      });
      this.printLine(skillsText, 'raw');
    }

    cmdProjects() {
      this.printLine('<span class="cmd-yellow">Recent Projects:</span>', 'raw');
      this.data.projects.forEach(proj => {
        const statusColor = proj.status === 'shipped' ? 'cmd-green' : proj.status === 'beta' ? 'cmd-yellow' : 'cmd-cyan';
        const projHtml = `<div class="terminal-project-item">
  <span class="cmd-cyan">┌─</span> <span class="cmd-green">${proj.name}</span> <span class="${statusColor}">[${proj.status}]</span>
  <span class="cmd-gray">│ ${proj.desc}</span>
</div>`;
        this.printLine(projHtml, 'raw');
      });
      this.printLine(`\n<span class="cmd-gray">Type</span> <span class="cmd-yellow">"contact"</span> <span class="cmd-gray">to discuss collaboration opportunities.</span>`, 'raw');
    }

    cmdContact() {
      const contactText = `<span class="cmd-yellow">Get in touch:</span>

  <span class="cmd-cyan">📧  Email:</span>    <span class="cmd-white">${this.data.contact.email}</span>
  <span class="cmd-cyan">💻  GitHub:</span>   <span class="cmd-white">${this.data.contact.github}</span>
  <span class="cmd-cyan">💼  LinkedIn:</span> <span class="cmd-white">${this.data.contact.linkedin}</span>
  <span class="cmd-cyan">🐦  Twitter:</span>  <span class="cmd-white">${this.data.contact.twitter}</span>

<span class="cmd-gray">Feel free to reach out for collaborations, opportunities,</span>
<span class="cmd-gray">or just to say hello!</span>`;
      this.printLine(contactText, 'raw');
    }

    clear() {
      if (this.output) {
        this.output.innerHTML = '';
      }
      this.printWelcome();
    }

    printLine(text, type = 'output') {
      if (!this.output) return;

      const line = document.createElement('div');
      line.className = 'terminal-line';

      if (type === 'raw') {
        line.innerHTML = text.replace(/\n/g, '<br>');
      } else if (type === 'output') {
        line.textContent = text;
      }

      this.output.appendChild(line);
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    scrollToBottom() {
      if (this.terminalContent) {
        this.terminalContent.scrollTop = this.terminalContent.scrollHeight;
      }
    }
  }

  function initTerminal() {
    console.log('[Terminal] DOM ready, checking for terminal...');
    const terminalContent = document.getElementById('terminalContent') || 
                           document.querySelector('.terminal-content');
    if (!terminalContent) {
      console.log('[Terminal] No terminal found on this page');
      return;
    }
    window.heroTerminal = new HeroTerminal();
    window.heroTerminal.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTerminal);
  } else {
    initTerminal();
  }
  setTimeout(initTerminal, 500);
  setTimeout(initTerminal, 1500);

  window.HeroTerminal = HeroTerminal;
})();