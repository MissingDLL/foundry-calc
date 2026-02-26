const __DARK_VARS = {
  '--accent':'#a855f7','--accent2':'#ff453a','--accent3':'#30d158',
  '--bg':'#05000f','--bg2':'rgba(140,50,220,0.06)','--bg3':'rgba(140,50,220,0.10)',
  '--panel':'rgba(40,10,80,0.45)','--border':'rgba(160,60,255,0.20)',
  '--text':'#f5f5f7','--text-dim':'#98989f','--warn':'#ffd60a',
  '--highlight':'rgba(140,50,220,0.14)',
};

const THEMES = {
  default: { vars: __DARK_VARS, css: null /* filled below */ },

  dark: {
    vars: {
      '--accent':'#0a84ff','--accent2':'#ff453a','--accent3':'#30d158',
      '--bg':'#000000','--bg2':'#1c1c1e','--bg3':'#2c2c2e',
      '--panel':'#1c1c1e','--border':'rgba(255,255,255,0.10)',
      '--text':'#f5f5f7','--text-dim':'#8e8e93','--warn':'#ffd60a',
      '--highlight':'rgba(10,132,255,0.15)',
    },
    css: `
      body {
        background: #000000 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif !important;
        font-size: 14px !important;
        -webkit-font-smoothing: antialiased !important;
      }
      body, body * {
        font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif !important;
        letter-spacing: -0.01em !important;
      }
      header {
        background: rgba(28,28,30,0.85) !important;
        backdrop-filter: blur(40px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(40px) saturate(180%) !important;
        border-bottom: none !important;
        box-shadow: 0 1px 0 rgba(255,255,255,0.08) !important;
        padding: 14px 28px !important;
      }
      .logo {
        font-size: 18px !important; letter-spacing: 0.08em !important;
        text-shadow: none !important; font-weight: 700 !important; color: #ffffff !important;
      }
      .logo span { color: rgba(255,255,255,0.38) !important; }
      .subtitle {
        font-size: 11px !important; letter-spacing: 0.04em !important;
        color: #8e8e93 !important; text-transform: none !important;
      }
      .sidebar {
        background: #1c1c1e !important;
        backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
        border-right: 1px solid rgba(255,255,255,0.08) !important;
        padding: 16px 14px !important; gap: 10px !important;
      }
      .main { background: transparent !important; padding: 20px !important; }
      .panel {
        background:
          linear-gradient(150deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%),
          #1c1c1e !important;
        border: 1px solid rgba(255,255,255,0.10) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.08),
          0 4px 24px rgba(0,0,0,0.6),
          0 1px 4px rgba(0,0,0,0.4) !important;
        border-radius: 16px !important;
        backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
      }
      .sidebar .panel {
        background: #2c2c2e !important;
        border-color: rgba(255,255,255,0.08) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.4) !important;
      }
      .summary-box {
        background:
          linear-gradient(150deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%),
          #1c1c1e !important;
        border: 1px solid rgba(255,255,255,0.10) !important;
        border-radius: 14px !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.5) !important;
      }
      .summary-box::before { height: 1px !important; }
      .section-title {
        font-size: 10px !important; font-weight: 600 !important;
        letter-spacing: 0.06em !important;
        color: #8e8e93 !important;
        border-bottom: 1px solid rgba(255,255,255,0.07) !important;
        text-shadow: none !important;
      }
      .tabs { border-bottom: 1px solid rgba(255,255,255,0.08) !important; margin-bottom: 16px !important; }
      .tab { font-size: 12px !important; letter-spacing: 0 !important; text-transform: none !important; font-weight: 500 !important; }
      .tab.active { text-shadow: none !important; color: #0a84ff !important; border-bottom-color: #0a84ff !important; }
      .results-table th {
        background: #2c2c2e !important;
        font-size: 10px !important; letter-spacing: 0.05em !important;
        color: #8e8e93 !important;
        border-bottom: 1px solid rgba(255,255,255,0.08) !important;
      }
      .results-table td { border-bottom: 1px solid rgba(255,255,255,0.06) !important; font-size: 13px !important; }
      .results-table tr:hover td { background: rgba(10,132,255,0.10) !important; }
      input, select {
        background: #2c2c2e !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
        border-radius: 8px !important; color: #f5f5f7 !important; box-shadow: none !important;
      }
      input:focus, select:focus {
        border-color: rgba(10,132,255,0.6) !important;
        box-shadow: 0 0 0 3px rgba(10,132,255,0.22) !important; outline: none !important;
      }
      .calc-btn {
        background: #0a84ff !important; box-shadow: 0 2px 12px rgba(10,132,255,0.4) !important;
        border-radius: 10px !important; font-weight: 600 !important;
        letter-spacing: 0 !important; text-transform: none !important; font-size: 14px !important;
      }
      .calc-btn:hover { background: #409cff !important; }
      .reset-btn {
        background: #2c2c2e !important; border: 1px solid rgba(255,255,255,0.10) !important;
        border-radius: 10px !important; color: #8e8e93 !important;
        letter-spacing: 0 !important; text-transform: none !important; font-size: 13px !important;
      }
      .reset-btn:hover { border-color: rgba(255,69,58,0.5) !important; color: #ff453a !important; }
      .bot-item {
        background: #2c2c2e !important; border-radius: 8px !important; border: 1px solid transparent !important;
      }
      .bot-item:hover { border-color: rgba(10,132,255,0.4) !important; background: rgba(10,132,255,0.10) !important; }
      .bot-item.selected { border-color: rgba(10,132,255,0.5) !important; background: rgba(10,132,255,0.14) !important; }
      .badge { border-radius: 6px !important; font-size: 11px !important; background: rgba(10,132,255,0.18) !important; border-color: rgba(10,132,255,0.28) !important; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 99px; }
      .__theme-btn {
        font-size: 13px !important; font-weight: 500 !important;
        letter-spacing: 0 !important; text-transform: none !important;
        border-radius: 8px !important; padding: 5px 14px !important;
      }
      .__theme-btn.__theme-icon-btn {
        border-radius: 50% !important; padding: 0 !important;
      }
      /* ── SANKEY ──────────────────────────── */
      #sankeyWrap { background: #0a0a14 !important; }
      #sankeyTooltip {
        background: rgba(28,28,30,0.95) !important;
        border: 1px solid rgba(255,255,255,0.10) !important;
        border-radius: 10px !important;
      }
    `,
  },

  light: {
    vars: {
      '--accent':'#007aff','--accent2':'#ff3b30','--accent3':'#34c759',
      '--bg':'transparent','--bg2':'rgba(255,255,255,0.45)','--bg3':'rgba(255,255,255,0.30)',
      '--panel':'rgba(255,255,255,0.35)','--border':'rgba(255,255,255,0.70)',
      '--text':'#1d1d1f','--text-dim':'#6e6e73','--warn':'#ff9f0a',
      '--highlight':'rgba(0,122,255,0.08)',
    },
    css: `
      body {
        background:
          radial-gradient(ellipse 100% 80% at 0%   0%,   #c2dcff 0%, transparent 52%),
          radial-gradient(ellipse 80%  65% at 100%  5%,   #dfc2ff 0%, transparent 50%),
          radial-gradient(ellipse 65%  60% at 90%  95%,   #ffc2d8 0%, transparent 50%),
          radial-gradient(ellipse 70%  65% at 5%   100%,  #c2f0d8 0%, transparent 50%),
          #dce8ff !important;
        font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif !important;
        font-size: 14px !important;
        -webkit-font-smoothing: antialiased !important;
      }
      body, body * {
        font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif !important;
        letter-spacing: -0.01em !important;
        color: #1d1d1f;
      }
        .btn-picker{
        color: #6e6e737d !important;
        background: rgba(0,0,0,0.08) !important;
        border: 1px solid rgba(0,0,0,0.10) !important;
        border-radius: 10px !important;
        }
        .btn-picker:hover{
        color: #6e6e73 !important
        
        }
      header {
        background: rgba(255,255,255,0.38) !important;
        backdrop-filter: blur(60px) saturate(220%) brightness(1.04) !important;
        -webkit-backdrop-filter: blur(60px) saturate(220%) brightness(1.04) !important;
        border-bottom: none !important;
        box-shadow:
          0 1px 0 rgba(255,255,255,0.85),
          0 1px 0 rgba(0,0,0,0.06) !important;
        padding: 14px 28px !important;
      }
      #themePill {
        background: rgba(0,0,0,0.07) !important;
        border-color: rgba(0,0,0,0.12) !important;
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.12), inset 0 -1px 0 rgba(255,255,255,0.50) !important;
      }
      .__theme-icon-btn { color: rgba(20,20,60,0.50) !important; }
      .__theme-icon-btn:hover svg { color: #2563eb !important; stroke: #2563eb !important; filter: drop-shadow(0 0 5px rgba(37,99,235,0.6)) !important; }
      .__theme-icon-btn[data-theme="light"] {
        background: rgba(255,255,255,0.70) !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.90) !important;
        color: rgba(20,20,60,0.85) !important;
        border-radius: 50% !important;
      }
      .logo {
        font-size: 18px !important; font-weight: 700 !important;
        color: #1d1d1f !important; letter-spacing: 0.06em !important;
        text-shadow: none !important;
      }
      .logo span { color: rgba(0,0,0,0.30) !important; }
      .subtitle {
        font-size: 11px !important; letter-spacing: 0.04em !important;
        color: #6e6e73 !important; text-transform: none !important;
      }
      .sidebar {
        background: rgba(255,255,255,0.28) !important;
        backdrop-filter: blur(60px) saturate(200%) brightness(1.03) !important;
        -webkit-backdrop-filter: blur(60px) saturate(200%) brightness(1.03) !important;
        border-right: 1px solid rgba(255,255,255,0.65) !important;
        padding: 16px 14px !important; gap: 10px !important;
      }
      .main { background: transparent !important; padding: 20px !important; }
      .panel {
        background:
          linear-gradient(150deg, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.25) 100%),
          rgba(255,255,255,0.20) !important;
        backdrop-filter: blur(50px) saturate(200%) brightness(1.03) !important;
        -webkit-backdrop-filter: blur(50px) saturate(200%) brightness(1.03) !important;
        border: 1px solid rgba(255,255,255,0.75) !important;
        box-shadow:
          inset 0 1.5px 0 rgba(255,255,255,0.98),
          inset 0 -1px 0 rgba(0,0,0,0.04),
          0 8px 32px rgba(80,110,180,0.10),
          0 2px 8px rgba(0,0,0,0.05) !important;
        border-radius: 16px !important;
      }
        #toggleRecipeBtn {
        color: var(--text-dim) !important
        }
        #mainTabBtnVisualize {
        color: var(--text-dim) !important
        }
        #toggleSettingsBtn{
        color: var(--text-dim) !important
        }
        #toggleBotBtn {
        color: var(--text-dim) !important
        }
      .sidebar .panel {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        background: rgba(255,255,255,0.50) !important;
        border-color: rgba(255,255,255,0.80) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.98), 0 2px 12px rgba(0,0,0,0.05) !important;
      }
      .summary-box {
        background:
          linear-gradient(150deg, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.25) 100%),
          rgba(255,255,255,0.20) !important;
        border: 1px solid rgba(255,255,255,0.75) !important;
        border-radius: 14px !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.98), 0 4px 16px rgba(0,0,0,0.05) !important;
      }
        .summary-label {
  color: var(--text-dim) !important;
}

.summary-unit {
  color: #6e6e73 !important;
}
  .summary-value {
  color: var(--accent); !important;
}
  .collapsible-header { background: rgba(255,255,255,0.04) !important; border-bottom: 1px solid rgba(255,255,255,0.07) !important; }
      .collapsible-header:hover { background: rgba(255,255,255,0.07) !important; }
      .collapsible-header .ch-title { color: var(--text-dim) !important; letter-spacing: 0.05em !important; text-transform: uppercase !important; font-size: 10px !important; }
      .collapsible-header .ch-meta { color: var(--text-dim) !important; }
      .collapsible-section { border-color: rgba(255,255,255,0.09) !important; border-radius: 14px !important; }
      .summary-box::before { height: 1px !important; }
      .section-title {
        font-size: 10px !important; font-weight: 600 !important;
        letter-spacing: 0.06em !important;
        color: #aeaeb2 !important;
        border-bottom: 1px solid rgba(0,0,0,0.07) !important;
        text-shadow: none !important;
      }
      .summary-value { font-size: 20px !important; font-weight: 600 !important; }
      .tabs { border-bottom: 1px solid rgba(0,0,0,0.08) !important; margin-bottom: 16px !important; }
      .tab { font-size: 12px !important; letter-spacing: 0 !important; text-transform: none !important; font-weight: 500 !important; }
      .tab.active { text-shadow: none !important; color: #007aff !important; border-bottom-color: #007aff !important; }
      .results-table th {
        background: rgba(0,0,0,0.03) !important;
        font-size: 10px !important; letter-spacing: 0.05em !important;
        color: #6e6e73 !important;
        border-bottom: 1px solid rgba(0,0,0,0.08) !important;
      }
      .results-table td { border-bottom: 1px solid rgba(0,0,0,0.05) !important; font-size: 13px !important; color: #1d1d1f !important; }
      .results-table tr:hover td { background: rgba(0,122,255,0.06) !important; }
      .results-table td.num, .results-table td.num-warn { color: #007aff !important; }
      .results-table td.num-warn { color: #ff9f0a !important; }
      input, select {
        background: rgba(255,255,255,0.65) !important;
        border: 1px solid rgba(0,0,0,0.10) !important;
        border-radius: 8px !important;
        color: #1d1d1f !important;
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.05) !important;
      }
      input:focus, select:focus {
        border-color: rgba(0,122,255,0.5) !important;
        box-shadow: 0 0 0 3px rgba(0,122,255,0.15), inset 0 1px 2px rgba(0,0,0,0.03) !important;
        outline: none !important;
      }
      .calc-btn {
        background: #007aff !important;
        box-shadow: 0 4px 16px rgba(0,122,255,0.35) !important;
        border-radius: 10px !important;
        font-weight: 600 !important;
        letter-spacing: 0 !important; text-transform: none !important; font-size: 14px !important;
      }
      .calc-btn:hover { background: #3395ff !important; box-shadow: 0 6px 20px rgba(0,122,255,0.45) !important; }
      .reset-btn {
        background: rgba(0,0,0,0.05) !important;
        border: 1px solid rgba(0,0,0,0.10) !important;
        border-radius: 10px !important;
        color: #6e6e73 !important;
        letter-spacing: 0 !important; text-transform: none !important; font-size: 13px !important;
      }
      .reset-btn:hover { border-color: rgba(255,59,48,0.4) !important; color: #ff3b30 !important; }
      /* ── Tab bar ── */
      #mainTabBar {
        background: rgba(255,255,255,0.30) !important;
        border-bottom-color: rgba(0,0,0,0.10) !important;
      }
      /* Empty state & placeholder text */
      #selectedRecipes > div {
        color: #6e6e73 !important;
        background: rgba(0,0,0,0.04) !important;
        border-color: rgba(0,0,0,0.08) !important;
      }
      .bot-item {
        background: rgba(255,255,255,0.45) !important;
        border-radius: 8px !important; border: 1px solid rgba(255,255,255,0.70) !important;
      }
      .bot-item:hover { border-color: rgba(0,122,255,0.35) !important; background: rgba(0,122,255,0.07) !important; }
      .bot-item.selected { border-color: rgba(0,122,255,0.45) !important; background: rgba(0,122,255,0.09) !important; }
      .badge {
        border-radius: 6px !important; font-size: 11px !important;
        background: rgba(0,122,255,0.10) !important;
        color: #007aff !important;
        border-color: rgba(0,122,255,0.20) !important;
      }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 99px; }
      .__theme-btn {
        font-size: 13px !important; font-weight: 500 !important;
        letter-spacing: 0 !important; text-transform: none !important;
        border-radius: 8px !important; padding: 5px 14px !important;
      }
      .__theme-btn.__theme-icon-btn {
        border-radius: 50% !important; padding: 0 !important;
      }
      #__se-panel, #__se-panel * { color: #f5f5f7 !important; }
      /* ── Settings panel light theme ── */
      #__se-panel {
        background: rgba(240,240,248,0.97) !important;
        backdrop-filter: blur(40px) saturate(200%) !important;
        -webkit-backdrop-filter: blur(40px) saturate(200%) !important;
        border-left: 1px solid rgba(0,0,0,0.10) !important;
        box-shadow: -8px 0 40px rgba(0,0,0,0.12) !important;
      }
      #__se-panel * { color: #1d1d1f !important; }
      #__se-panel > div:first-child {
        background: rgba(255,255,255,0.70) !important;
        border-bottom: 1px solid rgba(0,0,0,0.08) !important;
      }
      #__se-panel span[style*="color:rgba(255,255,255,0.50)"],
      #__se-panel div[style*="color:rgba(255,255,255,0.35)"] {
        color: #6e6e73 !important;
      }
      #__se-panel div[style*="border-bottom:1px solid rgba(255,255,255,0.08)"],
      #__se-panel div[style*="border-bottom: 1px solid rgba(255,255,255,0.08)"] {
        border-bottom-color: rgba(0,0,0,0.08) !important;
      }
      #__se-panel [style*="color:#6a82a0"] { color: #6e6e73 !important; }
      #__se-panel [style*="color:#c8d8f0"] { color: #007aff !important; }
      #__se-panel input[type="range"] { accent-color: #007aff !important; }
      #__se-reset {
        background: rgba(0,0,0,0.05) !important;
        border: 1px solid rgba(0,0,0,0.10) !important;
        color: #6e6e73 !important;
      }
      #__se-css {
        background: rgba(0,0,0,0.05) !important;
        border: 1px solid rgba(0,0,0,0.10) !important;
        color: #3a3a4a !important;
      }
      #__se-copy {
        background: rgba(0,122,255,0.10) !important;
        border: 1px solid rgba(0,122,255,0.30) !important;
        color: #007aff !important;
      }
      #__se-close { color: #8e8e93 !important; }
      /* ── Modals light theme ── */
      #recipeSettingsModal,
      #recipePickerModal {
        background: rgba(225,225,235,0.72) !important;
        backdrop-filter: blur(60px) saturate(200%) brightness(1.08) !important;
        -webkit-backdrop-filter: blur(60px) saturate(200%) brightness(1.08) !important;
        border-color: rgba(255,255,255,0.75) !important;
        box-shadow: 0 20px 60px rgba(0,0,0,0.14), inset 0 1.5px 0 rgba(255,255,255,0.90) !important;
      }
      #recipeSettingsModal > div,
      #recipePickerModal > div {
        border-bottom-color: rgba(0,0,0,0.07) !important;
        border-top-color: rgba(0,0,0,0.07) !important;
      }
      /* All text inside settings/picker modals */
      #settingsContent * { color: #1d1d1f !important; }
      #settingsContent div[style*="color:rgba(255,255,255,0.50)"],
      #settingsContent div[style*="color:rgba(255,255,255,0.35)"] {
        color: #6e6e73 !important;
      }
      /* Separator lines */
      #settingsContent div[style*="border-top:1px solid rgba(255,255,255"] {
        border-top-color: rgba(0,0,0,0.08) !important;
      }
      /* Inactive buttons */
      #settingsContent button[style*="rgba(255,255,255,0.05)"] {
        background: rgba(0,0,0,0.05) !important;
        border-color: rgba(0,0,0,0.12) !important;
        color: #3a3a4a !important;
      }
      /* Active buttons */
      #settingsContent button[style*="rgba(10,132,255,0.18)"] {
        background: rgba(0,122,255,0.14) !important;
        border-color: rgba(0,122,255,0.45) !important;
        color: #004eb3 !important;
      }
      /* Recipe picker category tabs & content */
      #recipePickerModal * { color: #1d1d1f !important; }
      #recipePickerModal [style*="color:rgba(255,255,255"] { color: #6e6e73 !important; }
      #recipePickerModal [style*="background:rgba(255,255,255,0.05)"],
      #recipePickerModal [style*="background: rgba(255,255,255,0.05)"] {
        background: rgba(0,0,0,0.04) !important;
        border-color: rgba(0,0,0,0.10) !important;
      }
      #recipePickerModal [style*="background:rgba(10,132,255"],
      #recipePickerModal [style*="background: rgba(10,132,255"] {
        background: rgba(0,122,255,0.14) !important;
        border-color: rgba(0,122,255,0.45) !important;
      }
      #recipePickerModal [style*="border-bottom:1px solid rgba(255,255,255"],
      #recipePickerModal [style*="border-top:1px solid rgba(255,255,255"] {
        border-color: rgba(0,0,0,0.07) !important;
      }
      #sankeyWrap {
        background: rgba(255,255,255,0.25) !important;
        backdrop-filter: blur(40px) !important;
        -webkit-backdrop-filter: blur(40px) !important;
      }
      #sankeyTooltip {
        background: rgba(255,255,255,0.85) !important;
        border: 1px solid rgba(0,0,0,0.08) !important;
        border-radius: 10px !important;
        color: #1d1d1f !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.10) !important;
        backdrop-filter: blur(20px) !important;
      }
      #sankeyTooltip * { color: #1d1d1f !important; }
      /* Nodes: attribute-selector overrides (D3 sets fill as SVG attr) */
      #sankeySvg rect[fill="#122a12"] { fill: rgba(52,199,89,0.18)  !important; stroke: #34c759 !important; }
      #sankeySvg rect[fill="#0a1628"] { fill: rgba(0,122,255,0.14)  !important; stroke: #007aff !important; }
      #sankeySvg rect[fill="#2a1206"] { fill: rgba(255,159,10,0.18) !important; stroke: #ff9f0a !important; }
      /* Links */
      #sankeySvg path[stroke="#4a8adf"] { stroke: rgba(0,122,255,0.35) !important; }
      /* Info cards */
      #sankeySvg foreignObject > div {
        background: rgba(255,255,255,0.75) !important;
        border-color: rgba(0,0,0,0.09) !important;
        color: #1d1d1f !important;
        backdrop-filter: blur(12px);
      }
      #sankeySvg foreignObject > div * { color: #1d1d1f !important; }
      /* Legend */
      #sankeyLegend { font-family: -apple-system, sans-serif !important; }
      #sankeyLegend > span { color: #6e6e73 !important; }
      #sankeyLegend span > span {
        background: rgba(0,0,0,0.06) !important;
        border-color: rgba(0,0,0,0.12) !important;
      }
    `,
  },
};

// Default shares the dark CSS (defined after THEMES object)
THEMES.default.css = `
      body {
        background:
          radial-gradient(ellipse 100% 80% at 0% 0%,   #1e0a5e 0%, transparent 50%),
          radial-gradient(ellipse 80%  70% at 100% 0%,  #0a2d6e 0%, transparent 50%),
          radial-gradient(ellipse 70%  60% at 100% 100%,#2e0a5e 0%, transparent 50%),
          radial-gradient(ellipse 80%  70% at 0%   100%,#041230 0%, transparent 50%),
          #060612 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif !important;
        font-size: 14px !important;
        -webkit-font-smoothing: antialiased !important;
      }
      body, body * {
        font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif !important;
        letter-spacing: -0.01em !important;
      }
      header {
        background: rgba(255,255,255,0.06) !important;
        backdrop-filter: blur(60px) saturate(200%) !important;
        -webkit-backdrop-filter: blur(60px) saturate(200%) !important;
        border-bottom: none !important;
        box-shadow: 0 1px 0 rgba(255,255,255,0.10), inset 0 1px 0 rgba(255,255,255,0.08) !important;
        padding: 14px 28px !important;
      }
      .logo {
        font-size: 18px !important; letter-spacing: 0.08em !important;
        text-shadow: none !important; font-weight: 700 !important; color: #ffffff !important;
      }
      .logo span { color: rgba(255,255,255,0.45) !important; }
      .subtitle {
        font-size: 11px !important; letter-spacing: 0.04em !important;
        color: rgba(255,255,255,0.35) !important; text-transform: none !important;
      }
      .sidebar {
        background: rgba(255,255,255,0.04) !important;
        backdrop-filter: blur(60px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(60px) saturate(180%) !important;
        border-right: 1px solid rgba(255,255,255,0.08) !important;
        padding: 16px 14px !important; gap: 10px !important;
      }
      .main { background: transparent !important; padding: 20px !important; }
      .panel {
        background:
          linear-gradient(150deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%),
          rgba(255,255,255,0.05) !important;
        backdrop-filter: blur(40px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(40px) saturate(180%) !important;
        border: 1px solid rgba(255,255,255,0.10) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.18),
          inset 0 -1px 0 rgba(0,0,0,0.20),
          0 12px 40px rgba(0,0,0,0.5),
          0 2px 8px rgba(0,0,0,0.3) !important;
        border-radius: 20px !important;
        transition: box-shadow 0.2s ease !important;
      }
      .sidebar .panel {
        backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
        background: rgba(255,255,255,0.06) !important;
        border-color: rgba(255,255,255,0.09) !important;
        border-radius: 14px !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 4px 16px rgba(0,0,0,0.3) !important;
      }
      .summary-box {
        background:
          linear-gradient(150deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%),
          rgba(255,255,255,0.05) !important;
        border: 1px solid rgba(255,255,255,0.10) !important;
        border-radius: 14px !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 20px rgba(0,0,0,0.4) !important;
        transition: transform 0.2s ease, box-shadow 0.2s ease !important;
      }
      .summary-box:hover {
        transform: translateY(-1px) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), 0 8px 28px rgba(0,0,0,0.5) !important;
      }
      .summary-box::before { height: 1px !important; opacity: 0.7 !important; }
      
      .section-title {
        font-size: 10px !important; font-weight: 600 !important;
        letter-spacing: 0.06em !important;
        color: rgba(255,255,255,0.30) !important;
        border-bottom: 1px solid rgba(255,255,255,0.07) !important;
        text-shadow: none !important;
      }
      .tabs { border-bottom: 1px solid rgba(255,255,255,0.10) !important; margin-bottom: 16px !important; }
      .tab { font-size: 12px !important; letter-spacing: 0 !important; text-transform: none !important; font-weight: 500 !important; }
      .tab.active { text-shadow: none !important; color: #0a84ff !important; border-bottom-color: #0a84ff !important; }
      .results-table th {
        background: rgba(255,255,255,0.05) !important;
        font-size: 10px !important; letter-spacing: 0.05em !important;
        color: rgba(255,255,255,0.35) !important;
        border-bottom: 1px solid rgba(255,255,255,0.08) !important;
      }
      .results-table td { border-bottom: 1px solid rgba(255,255,255,0.06) !important; font-size: 13px !important; }
      .results-table tr:hover td { background: rgba(10,132,255,0.10) !important; }
      .recipe-main-row:hover td { background: rgba(10,132,255,0.08) !important; }
      .recipe-detail-row td { background: rgba(0,0,0,0.20) !important; }
      .collapsible-header { background: rgba(255,255,255,0.04) !important; border-bottom: 1px solid rgba(255,255,255,0.07) !important; }
      .collapsible-header:hover { background: rgba(255,255,255,0.07) !important; }
      .collapsible-header .ch-title { color: rgba(255,255,255,0.55) !important; letter-spacing: 0.05em !important; text-transform: uppercase !important; font-size: 10px !important; }
      .collapsible-section { border-color: rgba(255,255,255,0.09) !important; border-radius: 14px !important; }
      input, select {
        background: rgba(255,255,255,0.08) !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
        border-radius: 10px !important; color: #f5f5f7 !important; box-shadow: none !important;
      }
      input:focus, select:focus {
        border-color: rgba(10,132,255,0.6) !important;
        box-shadow: 0 0 0 3px rgba(10,132,255,0.22) !important; outline: none !important;
      }
      .calc-btn {
        background: #0a84ff !important; box-shadow: 0 4px 16px rgba(10,132,255,0.4) !important;
        border-radius: 10px !important; font-weight: 600 !important;
        letter-spacing: 0 !important; text-transform: none !important; font-size: 14px !important;
        transition: all 0.2s ease !important;
      }
      .calc-btn:hover { background: #409cff !important; box-shadow: 0 6px 20px rgba(10,132,255,0.5) !important; transform: translateY(-1px) !important; }
      .calc-btn:active { transform: scale(0.98) !important; }
      .reset-btn {
        background: rgba(255,255,255,0.07) !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
        border-radius: 10px !important; color: rgba(255,255,255,0.55) !important;
        letter-spacing: 0 !important; text-transform: none !important; font-size: 13px !important;
        transition: all 0.2s ease !important;
      }
      .reset-btn:hover { border-color: rgba(255,69,58,0.5) !important; color: #ff453a !important; background: rgba(255,69,58,0.08) !important; }
      .bot-item {
        background: rgba(255,255,255,0.05) !important;
        border-radius: 10px !important; border: 1px solid transparent !important;
        transition: all 0.18s ease !important;
      }
      .bot-item:hover { border-color: rgba(10,132,255,0.4) !important; background: rgba(10,132,255,0.10) !important; transform: scale(1.01) !important; }
      .bot-item.selected { border-color: rgba(10,132,255,0.5) !important; background: rgba(10,132,255,0.12) !important; }
      .badge { border-radius: 6px !important; font-size: 11px !important; background: rgba(10,132,255,0.15) !important; border-color: rgba(10,132,255,0.25) !important; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
      .__theme-btn {
        font-size: 13px !important; font-weight: 500 !important;
        letter-spacing: 0 !important; text-transform: none !important;
        border-radius: 8px !important; padding: 5px 14px !important;
        transition: all 0.18s ease !important;
      }
      .__theme-btn.__theme-icon-btn {
        border-radius: 50% !important; padding: 0 !important;
      }
      /* ── Inline icon fallback boxes ─── */
      div[title][style*="rgba(255,255,255,0.08)"] {
        background: rgba(255,255,255,0.08) !important;
        border-color: rgba(255,255,255,0.12) !important;
        border-radius: 6px !important;
      }
      /* ── SANKEY ──────────────────────────── */
      #sankeyWrap { background: rgba(4,4,20,0.85) !important; }
      #sankeyTooltip {
        background: rgba(16,14,36,0.92) !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
        border-radius: 12px !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
      }
    `;

function __applyTheme(name) {
  const theme = THEMES[name];
  if (!theme) return;

  // Mark body so the universal transition CSS is active during the swap
  document.body.classList.add('theme-switching');

  const root = document.documentElement;

  // Reset all vars from all themes first
  Object.values(THEMES).forEach(t => Object.keys(t.vars).forEach(k => root.style.removeProperty(k)));
  // Apply this theme's vars
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));

  // Inject/replace extra CSS
  let styleEl = document.getElementById('__theme-extra-css');
  if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = '__theme-extra-css'; document.head.appendChild(styleEl); }
  styleEl.textContent = theme.css;

  // Update buttons + move blob
  document.querySelectorAll('.__theme-btn').forEach(btn => {
    const active = btn.dataset.theme === name;
    if (btn.classList.contains('__theme-icon-btn')) {
      btn.classList.toggle('active-theme', active);
      btn.style.color = active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)';
    } else {
      btn.style.background = active ? 'rgba(255,255,255,0.15)' : 'transparent';
      btn.style.borderColor = active ? 'var(--accent)' : 'var(--border)';
      btn.style.color = active ? 'var(--accent)' : 'var(--text-dim)';
      btn.style.boxShadow = active ? 'inset 0 1px 0 rgba(255,255,255,0.2)' : 'none';
    }
  });

  // Slide blob to active button using transform
  const activeBtn = document.querySelector(`.__theme-icon-btn[data-theme="${name}"]`);
  const blob = document.getElementById('themeBlobIndicator');
  if (activeBtn && blob) {
    blob.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    blob.style.top = activeBtn.offsetTop + 'px';
  }


  // Fix modal dialogs for light theme
  const lightModal = name === 'light';
  const modalBg     = lightModal ? 'rgba(225,225,235,0.72)'         : 'linear-gradient(150deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)';
  const modalBorder = lightModal ? 'rgba(255,255,255,0.75)'          : 'rgba(255,255,255,0.15)';
  const modalShadow = lightModal ? '0 20px 60px rgba(0,0,0,0.14), inset 0 1.5px 0 rgba(255,255,255,0.90)' : '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.20)';
  ['recipeSettingsModal', 'recipePickerModal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.background = modalBg;
      el.style.border = `1px solid ${modalBorder}`;
      el.style.boxShadow = modalShadow;
    }
  });
  const isLight = name === 'light';
  const activeColor  = isLight ? '#007aff' : 'var(--accent)';
  const inactiveColor = isLight ? '#6e6e73' : 'rgba(255,255,255,0.40)';
  const btnR = document.getElementById('mainTabBtnRecipes');
  const btnS = document.getElementById('mainTabBtnVisualize');
  if (btnR && btnS) {
    // determine which is currently active by its border-bottom
    const rIsActive = btnR.style.borderBottomColor !== 'transparent' && btnR.style.borderBottomColor !== '';
    btnR.style.color = rIsActive ? activeColor : inactiveColor;
    btnR.style.borderBottomColor = rIsActive ? activeColor : 'transparent';
    btnS.style.color = !rIsActive ? activeColor : inactiveColor;
    btnS.style.borderBottomColor = !rIsActive ? activeColor : 'transparent';
  }

  // Set Sankey colors for this theme and re-render if visible
  const sankeyPalettes = {
    default: null, // use built-in dark palette
    dark:    null, // use built-in dark palette
    light: {
      raw:   { fill: 'rgba(52,199,89,0.14)',   stroke: '#34c759', text: '#1a6e35',  card: 'rgba(240,255,245,0.88)', cborder: 'rgba(52,199,89,0.30)'  },
      mid:   { fill: 'rgba(0,122,255,0.12)',    stroke: '#007aff', text: '#004eb3',  card: 'rgba(240,246,255,0.88)', cborder: 'rgba(0,122,255,0.25)'  },
      final: { fill: 'rgba(255,159,10,0.14)',   stroke: '#ff9f0a', text: '#7a4200',  card: 'rgba(255,248,235,0.88)', cborder: 'rgba(255,159,10,0.30)' },
      link:  'rgba(0,122,255,0.35)',
    },
  };
  window.__sankeyColors = sankeyPalettes[name] || null;

  // Update legend swatches to match the active palette
  const legendPalette = window.__sankeyColors || {
    raw:   { fill: '#1a4a1a', stroke: '#2a6a2a', text: '#6aaa6a' },
    mid:   { fill: '#1a2a4a', stroke: '#2a4a8a', text: '#6a9adf' },
    final: { fill: '#3a1a08', stroke: '#7a3a10', text: '#e08050' },
  };
  const legend = document.getElementById('sankeyLegend');
  if (legend) {
    const spans = legend.querySelectorAll(':scope > span');
    const keys = ['raw', 'mid', 'final'];
    spans.forEach((outerSpan, i) => {
      const key = keys[i];
      if (!key || !legendPalette[key]) return;
      outerSpan.style.color = legendPalette[key].text;
      const swatch = outerSpan.querySelector('span');
      if (swatch) {
        swatch.style.background = legendPalette[key].fill;
        swatch.style.borderColor = legendPalette[key].stroke;
      }
    });
  }

  if (typeof window.__renderSankey === 'function') {
    const sankeyTab = document.getElementById('tab-sankey');
    if (sankeyTab && sankeyTab.style.display !== 'none') {
      window.__renderSankey();
    }
  }

  // Remove switching class after transitions finish
  setTimeout(() => document.body.classList.remove('theme-switching'), 500);
}

// Apply default theme on load
__applyTheme('default');
