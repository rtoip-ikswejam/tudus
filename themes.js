window.TUDUS_THEMES = [
  {
    id: 'basic',
    name: {
      pl: 'Basic (Klasyczny)',
      en: 'Basic (Classic)'
    },
    description: {
      pl: 'Domyślny, spokojny styl z zaokrąglonymi przyciskami, automatycznym trybem jasnym/ciemnym oraz wzmocnionymi liniami oddzielającymi zadania i kroki.',
      en: 'Default calm look with rounded buttons, automatic light/dark mode, and enhanced dividers between tasks and steps.'
    },
    css: `
      :root {
        --bg: #f6f4ef; --base: #f6f4ef; --fg: #1a1e29; --mu: #525866;
        --cd: #ffffff; --ln: #c5bfb2; --div: #b8b1a2;
        --todo: #2b5b9e; --prog: #b86e0c; --done: #287247; --stat: #62469b; --bad: #b53826;
        --r-card: 10px; --r-btn: 10px; --r-pill: 20px; --r-chk: 6px; --r-dlg: 14px;
        --shadow-card: none;
        --font-main: system-ui, -apple-system, "Segoe UI", sans-serif;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #151820; --base: #151820; --fg: #f2f0ea; --mu: #a4aab8;
          --cd: #202531; --ln: #3f465c; --div: #4d556e;
          --todo: #7aa8eb; --prog: #f5ad42; --done: #66c78d; --stat: #b399eb; --bad: #f08978;
        }
      }
    `
  },
  {
    id: 'square',
    name: {
      pl: 'Kwadratowy (Precyzyjny)',
      en: 'Square (Crisp Grid)'
    },
    description: {
      pl: 'Geometryczny interfejs z prostokątnymi przyciskami, ostrymi narożnikami (2px) i wyraźnymi ramkami. Idealny dla osób preferujących uporządkowany, techniczny układ.',
      en: 'Geometric interface with rectangular buttons, sharp corners (2px), and crisp borders. Great if you prefer a structured, technical grid.'
    },
    css: `
      :root {
        --bg: #eef0f3; --base: #eef0f3; --fg: #111318; --mu: #49505e;
        --cd: #ffffff; --ln: #9aa3b2; --div: #8892a4;
        --todo: #1d4ed8; --prog: #b45309; --done: #15803d; --stat: #6d28d9; --bad: #b91c1c;
        --r-card: 2px; --r-btn: 2px; --r-pill: 2px; --r-chk: 0px; --r-dlg: 2px;
        --shadow-card: 2px 2px 0px rgba(17, 19, 24, 0.12);
        --font-main: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #111317; --base: #111317; --fg: #f3f4f6; --mu: #9ca3af;
          --cd: #1b1f26; --ln: #4b5563; --div: #6b7280;
          --todo: #60a5fa; --prog: #fbbf24; --done: #4ade80; --stat: #a78bfa; --bad: #f87171;
          --shadow-card: 2px 2px 0px rgba(0, 0, 0, 0.45);
        }
      }
      .fab { border-radius: 4px !important; }
      .c { border-width: 1px 1px 1px 6px; }
    `
  },
  {
    id: 'cyberpunk',
    name: {
      pl: 'Cyberpunk 2077 (Neon)',
      en: 'Cyberpunk 2077 (Neon)'
    },
    description: {
      pl: 'Mroczny, futurystyczny motyw w stylu Night City: głębokie tło, neonowy żółty i cyjan, ostre krawędzie, świecące linie podziału i wysoki kontrast WCAG.',
      en: 'Dark futuristic Night City style: deep background, neon yellow and cyan, sharp edges, glowing dividers, and high WCAG contrast.'
    },
    css: `
      :root {
        color-scheme: dark;
        --bg: #090a0f; --base: #090a0f; --fg: #f8f9fa; --mu: #9be7ff;
        --cd: #121521; --ln: #00e5ff; --div: #ff2a85;
        --todo: #00f0ff; --prog: #fcee09; --done: #00ff88; --stat: #d580ff; --bad: #ff3b6b;
        --ai: #090a0f; --di: #090a0f; --bi: #ffffff;
        --r-card: 0px; --r-btn: 0px; --r-pill: 0px; --r-chk: 0px; --r-dlg: 0px;
        --shadow-card: 0 0 10px rgba(0, 229, 255, 0.16);
        --font-main: ui-monospace, "Cascadia Code", "Fira Code", Consolas, monospace;
      }
      body { background-image: linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px); background-size: 100% 24px; }
      .c { border: 1px solid rgba(0, 229, 255, 0.55); border-left: 5px solid var(--ac); }
      .bt button, .sm { border: 1px solid var(--ln); text-transform: uppercase; letter-spacing: 0.4px; }
      .fab { border-radius: 0 !important; border: 2px solid var(--fg); box-shadow: 0 0 14px var(--ac); }
      .ar.on { color: #090a0f !important; font-weight: 700; }
      .stp { border-top: 1px dashed var(--div) !important; }
      .set h3 { border-top: 1px solid var(--div) !important; }
      header { border-bottom: 2px solid var(--div) !important; box-shadow: 0 2px 12px rgba(255, 42, 133, 0.25) !important; }
    `
  }
];
