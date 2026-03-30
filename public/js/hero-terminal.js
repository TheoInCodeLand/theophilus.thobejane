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

      // Portfolio data - customize these
      this.data = {
        name: 'Theo Thobejane',
        role: 'AI/Software Developer',
        location: 'South Africa',
        skills: [
          'JavaScript / TypeScript / Node.js',
          'Python / FastAPI / Django',
          'React / Next.js / Vue.js',
          'PostgreSQL / MongoDB / Redis',
          'Docker / AWS / Vercel',
          'AI/ML / LangChain / OpenAI API'
        ],
        projects: [
          { name: 'Axiora AI', desc: 'RAG chatbot with 94% relevance accuracy' },
          { name: 'Happy Deliveries', desc: 'Real-time geospatial delivery platform' },
          { name: 'JobTrack', desc: 'AI-powered job application tracker' },
          { name: 'Portfolio V2', desc: 'This interactive terminal portfolio' }
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

      // Find terminal content container
      this.terminalContent = document.getElementById('terminalContent') || 
                            document.querySelector('.terminal-content');

      if (!this.terminalContent) {
        console.error('[Terminal] .terminal-content not found');
        return;
      }

      // Check if already initialized
      if (this.terminalContent.classList.contains('interactive')) {
        console.log('[Terminal] Already initialized');
        return;
      }

      this.buildInteractiveTerminal();
      this.initialized = true;
      console.log('[Terminal] Initialized successfully');
    }

    buildInteractiveTerminal() {
      // Mark as interactive
      this.terminalContent.classList.add('interactive');

      // Clear existing content but preserve structure
      const existingOutput = this.terminalContent.querySelector('.terminal-output');
      const existingInput = this.terminalContent.querySelector('.terminal-input');

      if (existingOutput && existingInput) {
        // Already has interactive structure, just bind events
        this.output = existingOutput;
        this.input = existingInput;
        this.bindEvents();
        this.printWelcome();
        return;
      }

      // Build fresh structure
      this.terminalContent.innerHTML = `
        <div class="terminal-output" id="terminalOutput"></div>
        <div class="terminal-input-line">
          <span class="terminal-prompt">theophilus@lab:~$</span>
          <input type="text" class="terminal-input" id="terminalInput" autocomplete="off" spellcheck="false" placeholder="Type 'help'..." />
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

      // Input handling
      this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));

      // Focus handling - click anywhere in terminal
      const terminalCard = this.terminalContent.closest('.terminal-card') || this.terminalContent;
      terminalCard.addEventListener('click', (e) => {
        if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') {
          this.input.focus();
        }
      });

      // Keep focus
      this.input.addEventListener('blur', (e) => {
        // Small delay to allow clicks to process
        setTimeout(() => {
          if (document.activeElement !== this.input) {
            this.input.focus();
          }
        }, 100);
      });

      // Initial focus
      setTimeout(() => this.input.focus(), 100);
    }

    handleKeyDown(e) {
      // Debug logging
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

      if (this.historyIndex < -1) {
        this.historyIndex = -1;
      } else if (this.historyIndex >= this.history.length) {
        this.historyIndex = this.history.length - 1;
      }

      if (this.historyIndex === -1) {
        this.input.value = '';
      } else {
        this.input.value = this.history[this.history.length - 1 - this.historyIndex];
      }
    }

    autocomplete() {
      const commands = ['help', 'whoami', 'skills', 'projects', 'contact', 'clear'];
      const input = this.input.value.toLowerCase().trim();

      if (!input) return;

      const matches = commands.filter(cmd => cmd.startsWith(input));
      if (matches.length === 1 && matches[0] !== input) {
        this.input.value = matches[0];
      } else if (matches.length > 1) {
        // Show possible completions
        this.printLine(`theophilus@lab:~$ ${input}`, 'prompt');
        this.printLine(matches.join('  '), 'output');
      }
    }

    executeCommand(cmd) {
      if (!cmd) {
        this.printLine('theophilus@lab:~$', 'prompt');
        return;
      }

      // Save to history
      this.history.push(cmd);
      this.historyIndex = -1;

      // Print command line
      this.printLine(`theophilus@lab:~$ ${cmd}`, 'prompt');

      // Clear input
      this.input.value = '';

      // Execute
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
          this.printLine(`Hello! Nice to meet you. Type 'help' to see what I can do.`, 'success');
          break;
        case '':
          // Empty command, just show prompt
          break;
        default:
          this.printLine(`bash: ${cmd}: command not found`, 'error');
          this.printLine(`Type 'help' to see available commands.`, 'info');
      }

      // Scroll to bottom
      this.scrollToBottom();
    }

    printWelcome() {
      const welcomeText = `Welcome to TheoInCode Terminal v2.0.0
Type 'help' to see available commands.`;
      this.printLine(welcomeText, 'info');
      this.printLine('');
    }

    cmdHelp() {
      const helpText = `Available commands:

  help      - Show this menu
  whoami    - Who is Theo?
  skills    - Technical skills & stack
  projects  - Recent work & shipped projects
  contact   - Get in touch
  clear     - Clear terminal`;
      this.printLine(helpText, 'output');
    }

    cmdWhoami() {
      const whoamiText = `Backend Engineer & AI Developer`;
      this.printLine(whoamiText, 'output');
    }

    cmdSkills() {
      let skillsText = 'Technical Skills:';
      this.data.skills.forEach(skill => {
        skillsText += `\n  ▸ ${skill}`;
      });
      this.printLine(skillsText, 'output');
    }

    cmdProjects() {
      this.printLine('Recent Projects:', 'output');
      this.data.projects.forEach(proj => {
        const projHtml = `<div class="project-item"><div class="project-name">${proj.name}</div><div class="project-desc">${proj.desc}</div></div>`;
        this.printRaw(projHtml);
      });
      this.printLine('\nType "contact" to discuss collaboration opportunities.', 'info');
    }

    cmdContact() {
      const contactText = `Get in touch:

  Email:    ${this.data.contact.email}
  GitHub:   ${this.data.contact.github}
  LinkedIn: ${this.data.contact.linkedin}
  Twitter:  ${this.data.contact.twitter}

Feel free to reach out for collaborations, opportunities,
or just to say hello!`;
      this.printLine(contactText, 'output');
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
      line.className = `terminal-line cmd-${type}`;

      if (type === 'prompt') {
        line.innerHTML = `<span class="terminal-prompt">theophilus@lab:~$</span> <span style="color: rgba(255,255,255,0.9)">${this.escapeHtml(text.split('$')[1] || '').trim()}</span>`;
      } else {
        // Handle newlines
        const lines = text.split('\n');
        if (lines.length > 1) {
          line.innerHTML = lines.map(l => `<div>${this.escapeHtml(l)}</div>`).join('');
        } else {
          line.textContent = text;
        }
      }

      this.output.appendChild(line);
    }

    printRaw(html) {
      if (!this.output) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'terminal-line';
      wrapper.innerHTML = html;
      this.output.appendChild(wrapper);
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

  // Initialize when DOM is ready
  function initTerminal() {
    console.log('[Terminal] DOM ready, checking for terminal...');

    // Check if terminal exists
    const terminalContent = document.getElementById('terminalContent') || 
                           document.querySelector('.terminal-content');

    if (!terminalContent) {
      console.log('[Terminal] No terminal found on this page');
      return;
    }

    // Create and init
    window.heroTerminal = new HeroTerminal();
    window.heroTerminal.init();
  }

  // Multiple initialization attempts for reliability
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTerminal);
  } else {
    // DOM already loaded
    initTerminal();
  }

  // Backup initialization after a short delay (in case of conflicts)
  setTimeout(initTerminal, 500);
  setTimeout(initTerminal, 1500);

  // Expose globally
  window.HeroTerminal = HeroTerminal;
})();