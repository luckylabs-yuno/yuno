// yuno-secure.js - Enhanced security version
'use strict';

(() => {
  // Better script detection - look for multiple possible names
  const SCRIPT_NAMES = ['yuno.js', 'yuno-secure.js', 'widget.js', 'yuno-modular.js'];
  const allScripts = Array.from(document.getElementsByTagName('script'));
  
  // Find the current script by checking multiple patterns
  const thisScript = allScripts.find(s => {
    if (!s.src) return false;
    return SCRIPT_NAMES.some(name => s.src.includes(name)) || s.hasAttribute('site_id');
  }) || document.currentScript;
  
  console.log('🔍 Script detection:', {
    foundScript: !!thisScript,
    scriptSrc: thisScript?.src,
    hasAttributes: thisScript ? Array.from(thisScript.attributes).map(a => a.name) : []
  });
  
  // Configuration from script attributes with fallbacks
  const CONFIG = {
    // Core settings
    siteId: thisScript?.getAttribute('site_id') || null,
    apiEndpoint: thisScript?.getAttribute('api_endpoint') || 'https://api.helloyuno.com',
    
    // Appearance
    theme: thisScript?.getAttribute('theme') || 'dark',
    position: thisScript?.getAttribute('position') || 'bottom-right',
    
    // Colors (can override theme defaults)
    primaryColor: thisScript?.getAttribute('primary_color') || null,
    accentColor: thisScript?.getAttribute('accent_color') || null,
    backgroundColor: thisScript?.getAttribute('background_color') || null,
    textColor: thisScript?.getAttribute('text_color') || null,
    
    // Messages
    welcomeMessage: thisScript?.getAttribute('welcome_message') || "Hi! I'm Yuno—how can I help you today?",
    teaserMessage: thisScript?.getAttribute('teaser_message') || "Let me know if you need help",
    triggerText: thisScript?.getAttribute('trigger_text') || "Ask Yuno",
    triggerIcon: thisScript?.getAttribute('trigger_icon') || "💬",
    headerTitle: thisScript?.getAttribute('header_title') || "Chat with Yuno",
    placeholder: thisScript?.getAttribute('placeholder') || "Type your message…",
    
    // Behavior
    autoShow: thisScript?.getAttribute('auto_show') !== 'false',
    autoShowDelay: parseInt(thisScript?.getAttribute('auto_show_delay') || '1000', 10),
    showTeaser: thisScript?.getAttribute('show_teaser') !== 'false',
    
    // Dimensions
    width: thisScript?.getAttribute('width') || '340px',
    height: thisScript?.getAttribute('height') || '450px',
    
    // Advanced
    borderRadius: thisScript?.getAttribute('border_radius') || '16px',
    blurEffect: thisScript?.getAttribute('blur_effect') !== 'false',
    animation: thisScript?.getAttribute('animation') || 'slide',
  };

  // Validate required configuration
  if (!CONFIG.siteId) {
    console.error('Yuno: site_id is required. Widget will not load.');
    return;
  }

  // Debug configuration
  console.log('🎨 Yuno Config:', CONFIG);

  // Session & user persistence
  const now = Date.now();
  let session_id = localStorage.getItem('yuno_session_id');
  let lastActive = parseInt(localStorage.getItem('yuno_last_active') || '0', 10);
  if (!session_id || now - lastActive > 30 * 60 * 1000) {
    session_id = crypto.randomUUID();
    localStorage.setItem('yuno_session_id', session_id);
  }
  localStorage.setItem('yuno_last_active', now);

  let user_id = localStorage.getItem('yuno_user_id');
  if (!user_id) {
    user_id = crypto.randomUUID();
    localStorage.setItem('yuno_user_id', user_id);
  }

  // Generate dynamic CSS based on config
  function generateDynamicCSS() {
    const position = CONFIG.position.split('-');
    const vertical = position[0]; // top or bottom
    const horizontal = position[1]; // left or right
    
    const positionCSS = `
      ${vertical}: 30px;
      ${horizontal}: 30px;
    `;

    // Enhanced color overrides that actually work
    let colorOverrides = '';
    
    if (CONFIG.primaryColor) {
      if (CONFIG.accentColor) {
        // If both primary and accent colors are set, create gradient
        colorOverrides += `
          --accent: linear-gradient(to right, ${CONFIG.primaryColor}, ${CONFIG.accentColor}) !important;
          --accent-solid: ${CONFIG.primaryColor} !important;
          --accent-hover: linear-gradient(to right, ${CONFIG.accentColor}, ${CONFIG.primaryColor}) !important;
        `;
      } else {
        // Just primary color
        colorOverrides += `
          --accent: ${CONFIG.primaryColor} !important;
          --accent-solid: ${CONFIG.primaryColor} !important;
          --accent-hover: ${CONFIG.primaryColor} !important;
        `;
      }
    }
    
    if (CONFIG.backgroundColor) {
      colorOverrides += `
        --panel-bg: ${CONFIG.backgroundColor} !important;
        --yuno-bg: ${CONFIG.backgroundColor} !important;
        --header-bg: ${CONFIG.backgroundColor} !important;
      `;
    }
    
    if (CONFIG.textColor) {
      colorOverrides += `
        --text-color: ${CONFIG.textColor} !important;
      `;
    }

    return `
      :host {
        ${positionCSS}
        ${colorOverrides}
      }
      
      .chatbox {
        width: ${CONFIG.width};
        max-height: ${CONFIG.height};
        border-radius: ${CONFIG.borderRadius};
        ${!CONFIG.blurEffect ? 'backdrop-filter: none;' : ''}
      }
      
      .teaser, .bubble {
        border-radius: ${CONFIG.borderRadius};
        ${!CONFIG.blurEffect ? 'backdrop-filter: none;' : ''}
      }
    `;
  }

  // Template with dynamic content and powered by message
  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      /* Base host styles */
      :host {
        position: fixed;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 9999;
        --radius: 24px;
      }

      /* Dark theme variables */
      :host([theme="dark"]) {
        --accent: linear-gradient(to right, #FF6B35, #FF8C42);
        --accent-solid: #FF6B35;
        --accent-hover: linear-gradient(to right, #E55A2B, #FF6B35);
        --panel-bg: rgba(0, 0, 0, 0.85);
        --yuno-bg: rgba(20, 20, 20, 0.95);
        --blur: blur(30px);
        --border-color: rgba(255, 107, 53, 0.2);
        --border-hover-color: rgba(255, 107, 53, 0.4);
        --text-color: #ffffff;
        --text-muted: #a0a0a0;
        --header-bg: rgba(0, 0, 0, 0.9);
        --close-bg: rgba(40, 40, 40, 0.8);
        --close-color: #a0a0a0;
        --close-hover-bg: rgba(60, 60, 60, 0.9);
        --close-hover-color: #ffffff;
      }

      /* Light theme variables */
      :host([theme="light"]) {
        --accent: linear-gradient(to right, #FF6B35, #FF8C42);
        --accent-solid: #FF6B35;
        --accent-hover: linear-gradient(to right, #E55A2B, #FF6B35);
        --panel-bg: rgba(255, 255, 255, 0.95);
        --yuno-bg: rgba(248, 248, 248, 0.98);
        --blur: blur(20px);
        --border-color: rgba(0, 0, 0, 0.1);
        --border-hover-color: rgba(0, 0, 0, 0.2);
        --text-color: #1a1a1a;
        --text-muted: #666666;
        --header-bg: rgba(255, 255, 255, 0.98);
        --close-bg: rgba(240, 240, 240, 0.8);
        --close-color: #666666;
        --close-hover-bg: rgba(220, 220, 220, 0.9);
        --close-hover-color: #1a1a1a;
      }

      /* Blue theme */
      :host([theme="blue"]) {
        --accent: linear-gradient(to right, #3B82F6, #1D4ED8);
        --accent-solid: #3B82F6;
        --accent-hover: linear-gradient(to right, #2563EB, #1E40AF);
        --panel-bg: rgba(0, 0, 0, 0.85);
        --yuno-bg: rgba(20, 20, 30, 0.95);
        --blur: blur(30px);
        --border-color: rgba(59, 130, 246, 0.2);
        --border-hover-color: rgba(59, 130, 246, 0.4);
        --text-color: #ffffff;
        --text-muted: #a0a0a0;
        --header-bg: rgba(0, 0, 0, 0.9);
        --close-bg: rgba(40, 40, 40, 0.8);
        --close-color: #a0a0a0;
        --close-hover-bg: rgba(60, 60, 60, 0.9);
        --close-hover-color: #ffffff;
      }

      /* Green theme */
      :host([theme="green"]) {
        --accent: linear-gradient(to right, #10B981, #059669);
        --accent-solid: #10B981;
        --accent-hover: linear-gradient(to right, #0D9488, #047857);
        --panel-bg: rgba(0, 0, 0, 0.85);
        --yuno-bg: rgba(20, 30, 20, 0.95);
        --blur: blur(30px);
        --border-color: rgba(16, 185, 129, 0.2);
        --border-hover-color: rgba(16, 185, 129, 0.4);
        --text-color: #ffffff;
        --text-muted: #a0a0a0;
        --header-bg: rgba(0, 0, 0, 0.9);
        --close-bg: rgba(40, 40, 40, 0.8);
        --close-color: #a0a0a0;
        --close-hover-bg: rgba(60, 60, 60, 0.9);
        --close-hover-color: #ffffff;
      }

      /* Dynamic CSS will be injected here */
      ${generateDynamicCSS()}

      /* Authentication failure message */
      .auth-error {
        display: none;
        position: fixed;
        bottom: 40px;
        right: 40px;
        background: #ff4444;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
      }

      /* Trigger pill */
      .bubble {
        display: inline-flex;
        align-items: center;
        background: var(--accent);
        color: #ffffff;
        padding: 0 18px;
        height: 44px;
        border-radius: 22px;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3);
        font-size: 14px;
        font-weight: 600;
        gap: 10px;
        transition: all 0.3s ease;
        border: 2px solid rgba(255, 255, 255, 0.1);
      }
      .bubble:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
        background: var(--accent-hover);
      }
      .bubble .icon { 
        font-size: 20px; 
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
      }

      /* Teaser input row */
      .teaser {
        display: none;
        align-items: center;
        background: var(--panel-bg);
        backdrop-filter: var(--blur);
        border-radius: var(--radius);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 4px;
        gap: 8px;
        animation: slideIn 0.5s ease-out;
      }
      
      /* Animation styles */
      @keyframes slideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      
      .teaser.fade { animation: fadeIn 0.5s ease-out; }
      .teaser.scale { animation: scaleIn 0.5s ease-out; }
      .chatbox.fade { animation: fadeIn 0.5s ease-out; }
      .chatbox.scale { animation: scaleIn 0.5s ease-out; }

      .teaser .close {
        width: 32px;
        height: 32px;
        background: var(--close-bg);
        color: var(--close-color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.2s ease, color 0.2s ease;
      }
      .teaser .close:hover {
        background: var(--close-hover-bg);
        color: var(--close-hover-color);
      }
      .teaser .input {
        flex: 1;
        background: var(--yuno-bg);
        border-radius: var(--radius);
        padding: 8px 12px;
        font-size: 14px;
        color: var(--text-color);
      }
      .teaser .ask-btn {
        background: var(--accent);
        color: #fff;
        border: none;
        border-radius: var(--radius);
        padding: 8px 14px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s ease;
      }
      .teaser .ask-btn:hover {
        background: var(--accent-hover);
      }

      /* Chat panel */
      .chatbox {
        display: none;
        flex-direction: column;
        background: var(--panel-bg);
        backdrop-filter: var(--blur);
        box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px var(--border-color);
        overflow: hidden;
        animation: slideIn 0.5s ease-out;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        font-size: 16px;
        font-weight: bold;
        color: var(--text-color);
        background: var(--header-bg);
        backdrop-filter: var(--blur);
      }
      .close-btn {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: var(--close-color);
        transition: color 0.2s ease;
      }
      .close-btn:hover {
        color: var(--close-hover-color);
      }

      /* Powered by Yuno message */
      .powered-by {
        padding: 6px 12px;
        text-align: center;
        font-size: 11px;
        color: var(--text-muted);
        background: rgba(0, 0, 0, 0.02);
        border-bottom: 1px solid var(--border-color);
      }
      .powered-by a {
        color: var(--accent-solid);
        text-decoration: none;
        font-weight: 500;
      }
      .powered-by a:hover {
        text-decoration: underline;
      }

      .messages {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .messages::-webkit-scrollbar {
        display: none;
      }
      .input-row {
        display: flex;
        border-top: 1px solid var(--border-color);
        background: var(--header-bg);
        backdrop-filter: var(--blur);
      }
      .input-row input {
        flex: 1;
        border: none;
        padding: 10px;
        font-size: 14px;
        outline: none;
        background: transparent;
        color: var(--text-color);
      }
      .input-row input::placeholder {
        color: var(--text-muted);
      }
      .input-row button {
        background: var(--accent);
        color: #fff;
        border: none;
        padding: 0 16px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s ease;
      }
      .input-row button:hover {
        background: var(--accent-hover);
      }
      .input-row button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Bot & User bubbles */
      .chatbot-bubble {
        position: relative;
        padding: 12px 16px;
        border-radius: 18px;
        max-width: 80%;
        line-height: 1.5;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        font-weight: 400;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        white-space: pre-wrap !important;
      }
      .msg.bot .chatbot-bubble {
        background: var(--yuno-bg);
        color: var(--text-color);
        align-self: flex-start;
        border: 1px solid var(--border-color);
        margin-right: auto;
      }
      .msg.bot .chatbot-bubble::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 20px;
        border-width: 8px 8px 0 8px;
        border-style: solid;
        border-color: var(--yuno-bg) transparent transparent transparent;
      }
      .msg.user .chatbot-bubble {
        background: var(--accent-solid);
        color: #ffffff !important;
        align-self: flex-end;
        font-weight: 500;
        margin-left: auto;
        margin-right: 0 !important;
      }
      .msg.user .chatbot-bubble::after {
        content: '';
        position: absolute;
        bottom: -8px;
        right: 20px;
        border-width: 8px 8px 0 8px;
        border-style: solid;
        border-color: var(--accent-solid) transparent transparent transparent;
      }

      .msg.user {
        align-self: flex-end !important;
        margin-left: auto !important;
        margin-right: 0 !important;
        width: 100%;
        display: flex !important;
        justify-content: flex-end !important;
      }
      
      .msg.user .chatbot-bubble {
        display: inline-block !important;
        max-width: 80%;
        text-align: left !important;
        margin-right: 0 !important;
        margin-left: auto !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
      }

      /* Typing indicator */
      .typing {
        display: inline-flex;
        gap: 4px;
        align-items: center;
      }
      .typing::before {
        content: '💭';
        font-size: 16px;
        margin-right: 6px;
        animation: pulse 1.5s infinite ease-in-out;
      }
      .typing .dot {
        width: 6px;
        height: 6px;
        background: var(--accent-solid);
        border-radius: 50%;
        animation: bounce 0.8s infinite ease-in-out;
      }
      .typing .dot:nth-child(2) { animation-delay: 0.1s; }
      .typing .dot:nth-child(3) { animation-delay: 0.2s; }
      .typing .dot:nth-child(4) { animation-delay: 0.3s; }

      @keyframes bounce {
        0%, 80%, 100% { 
          transform: scale(0.8);
          opacity: 0.5;
        }
        40% { 
          transform: scale(1.2);
          opacity: 1;
        }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }

      /* Hide elements based on config */
      .teaser.hide { display: none !important; }

      /* 🎨 ANIMATED WALLPAPER BACKGROUNDS + MOBILE FIXES */
      /* ADD THIS CSS TO YOUR YUNO.JS FILE */

      /* Animated Background Patterns - Dark Mode */
      :host([theme="dark"]) .messages {
        background: 
          /* Animated geometric pattern */
          radial-gradient(circle at 20% 80%, rgba(255, 107, 53, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 140, 66, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(255, 107, 53, 0.02) 0%, transparent 50%),
          /* Moving grid pattern */
          linear-gradient(90deg, rgba(255, 107, 53, 0.01) 1px, transparent 1px),
          linear-gradient(0deg, rgba(255, 107, 53, 0.01) 1px, transparent 1px),
          /* Base dark background */
          linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%) !important;
        background-size: 
          200px 200px,
          180px 180px, 
          220px 220px,
          20px 20px,
          20px 20px,
          100% 100% !important;
        background-position: 
          0 0,
          100% 100%, 
          50% 50%,
          0 0,
          0 0,
          0 0 !important;
        animation: darkModeFloat 60s ease-in-out infinite !important;
      }

      /* Animated Background Patterns - Light Mode */
      :host([theme="light"]) .messages {
        background: 
          /* Animated geometric pattern */
          radial-gradient(circle at 20% 80%, rgba(255, 107, 53, 0.04) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 140, 66, 0.04) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(255, 107, 53, 0.03) 0%, transparent 50%),
          /* Moving grid pattern */
          linear-gradient(90deg, rgba(255, 107, 53, 0.02) 1px, transparent 1px),
          linear-gradient(0deg, rgba(255, 107, 53, 0.02) 1px, transparent 1px),
          /* Base light background */
          linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%) !important;
        background-size: 
          200px 200px,
          180px 180px, 
          220px 220px,
          25px 25px,
          25px 25px,
          100% 100% !important;
        background-position: 
          0 0,
          100% 100%, 
          50% 50%,
          0 0,
          0 0,
          0 0 !important;
        animation: lightModeFloat 60s ease-in-out infinite !important;
      }

      /* Blue Theme Wallpaper */
      :host([theme="blue"]) .messages {
        background: 
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(29, 78, 216, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.02) 0%, transparent 50%),
          linear-gradient(90deg, rgba(59, 130, 246, 0.01) 1px, transparent 1px),
          linear-gradient(0deg, rgba(59, 130, 246, 0.01) 1px, transparent 1px),
          linear-gradient(135deg, #0a0a0f 0%, #1a1a2a 50%, #0f0f1a 100%) !important;
        background-size: 200px 200px, 180px 180px, 220px 220px, 20px 20px, 20px 20px, 100% 100% !important;
        animation: blueModeFloat 60s ease-in-out infinite !important;
      }

      /* Green Theme Wallpaper */
      :host([theme="green"]) .messages {
        background: 
          radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(5, 150, 105, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.02) 0%, transparent 50%),
          linear-gradient(90deg, rgba(16, 185, 129, 0.01) 1px, transparent 1px),
          linear-gradient(0deg, rgba(16, 185, 129, 0.01) 1px, transparent 1px),
          linear-gradient(135deg, #0a0f0a 0%, #1a2a1a 50%, #0f1a0f 100%) !important;
        background-size: 200px 200px, 180px 180px, 220px 220px, 20px 20px, 20px 20px, 100% 100% !important;
        animation: greenModeFloat 60s ease-in-out infinite !important;
      }

      /* Wallpaper Animations */
      @keyframes darkModeFloat {
        0%, 100% { 
          background-position: 0 0, 100% 100%, 50% 50%, 0 0, 0 0, 0 0;
          transform: scale(1);
        }
        25% { 
          background-position: 10px 10px, 90% 90%, 60% 40%, 5px 5px, 5px 5px, 0 0;
          transform: scale(1.002);
        }
        50% { 
          background-position: 20px 5px, 80% 95%, 40% 60%, 10px 2px, 10px 2px, 0 0;
          transform: scale(1);
        }
        75% { 
          background-position: 5px 15px, 95% 85%, 55% 45%, 3px 8px, 3px 8px, 0 0;
          transform: scale(1.001);
        }
      }

      @keyframes lightModeFloat {
        0%, 100% { 
          background-position: 0 0, 100% 100%, 50% 50%, 0 0, 0 0, 0 0;
        }
        33% { 
          background-position: 15px 10px, 85% 90%, 65% 35%, 7px 5px, 7px 5px, 0 0;
        }
        66% { 
          background-position: 25px 5px, 75% 95%, 35% 65%, 12px 3px, 12px 3px, 0 0;
        }
      }

      @keyframes blueModeFloat {
        0%, 100% { background-position: 0 0, 100% 100%, 50% 50%, 0 0, 0 0, 0 0; }
        50% { background-position: 20px 10px, 80% 90%, 40% 60%, 8px 4px, 8px 4px, 0 0; }
      }

      @keyframes greenModeFloat {
        0%, 100% { background-position: 0 0, 100% 100%, 50% 50%, 0 0, 0 0, 0 0; }
        50% { background-position: 15px 15px, 85% 85%, 45% 55%, 6px 6px, 6px 6px, 0 0; }
      }

      /* ENHANCED CONTRAST & MOBILE FIXES */

      /* Improved Message Bubble Contrast */
      :host([theme="dark"]) .msg.bot .chatbot-bubble {
        background: rgba(40, 40, 40, 0.95) !important;
        color: #ffffff !important;
        border: 1px solid rgba(255, 107, 53, 0.3) !important;
        backdrop-filter: blur(10px) !important;
      }

      :host([theme="light"]) .msg.bot .chatbot-bubble {
        background: rgba(255, 255, 255, 0.95) !important;
        color: #1a1a1a !important;
        border: 1px solid rgba(0, 0, 0, 0.15) !important;
        backdrop-filter: blur(10px) !important;
      }

      /* Enhanced User Message Contrast */
      :host([theme="dark"]) .msg.user .chatbot-bubble,
      :host([theme="light"]) .msg.user .chatbot-bubble {
        background: var(--accent-solid) !important;
        color: #ffffff !important;
        font-weight: 500 !important;
        box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3) !important;
      }

      /* CRITICAL MOBILE FIXES */
      @media screen and (max-width: 768px) {
        /* FIXED: Proper viewport handling for Safari */
        .chatbox {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          height: 100dvh !important; /* Dynamic viewport height for mobile browsers */
          max-width: 100vw !important;
          max-height: 100vh !important;
          max-height: 100dvh !important;
          border-radius: 0 !important;
          z-index: 10000 !important;
          margin: 0 !important;
          
          /* CRITICAL: Ensure proper layout */
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
        }

        /* Enhanced header for mobile */
        .header {
          padding: 16px 20px !important;
          font-size: 18px !important;
          font-weight: 600 !important;
          border-bottom: 2px solid var(--border-color) !important;
          background: var(--header-bg) !important;
          min-height: 60px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          position: relative !important;
          flex-shrink: 0 !important;
          z-index: 10 !important;
          
          /* Enhanced contrast */
          backdrop-filter: blur(20px) !important;
          border-bottom: 2px solid rgba(255, 107, 53, 0.2) !important;
        }

        /* Powered by section */
        .powered-by {
          padding: 8px 20px !important;
          font-size: 12px !important;
          background: rgba(0, 0, 0, 0.05) !important;
          border-bottom: 1px solid var(--border-color) !important;
          flex-shrink: 0 !important;
          backdrop-filter: blur(10px) !important;
        }

        /* CRITICAL: Messages container fix */
        .messages {
          flex: 1 !important;
          padding: 16px 20px !important;
          gap: 16px !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          display: flex !important;
          flex-direction: column !important;
          
          /* Ensure it takes available space */
          min-height: 0 !important;
          height: auto !important;
          
          /* Enhanced scrollbar */
          scrollbar-width: thin !important;
          scrollbar-color: var(--accent-solid) transparent !important;
        }

        /* CRITICAL: Input row positioning */
        .input-row {
          padding: 16px 20px !important;
          background: var(--header-bg) !important;
          border-top: 2px solid var(--border-color) !important;
          position: relative !important;
          min-height: 70px !important;
          flex-shrink: 0 !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          
          /* Enhanced background */
          backdrop-filter: blur(20px) !important;
          border-top: 2px solid rgba(255, 107, 53, 0.2) !important;
          
          /* Ensure it stays at bottom */
          margin-top: 0 !important;
        }

        /* CRITICAL: Input field fixes */
        .input-row input {
          flex: 1 !important;
          padding: 16px 20px !important;
          font-size: 16px !important; /* Prevents iOS zoom */
          border-radius: 25px !important;
          background: var(--yuno-bg) !important;
          border: 2px solid var(--border-color) !important;
          min-height: 50px !important;
          color: var(--text-color) !important;
          
          /* iOS Safari fixes */
          -webkit-appearance: none !important;
          -webkit-border-radius: 25px !important;
          touch-action: manipulation !important;
          outline: none !important;
          
          /* Enhanced contrast */
          backdrop-filter: blur(10px) !important;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }

        .input-row input::placeholder {
          color: var(--text-muted) !important;
          opacity: 0.8 !important;
        }

        .input-row input:focus {
          border-color: var(--accent-solid) !important;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.3) !important;
          transform: scale(1) !important;
          background: var(--yuno-bg) !important;
        }

        /* Enhanced send button */
        .input-row button {
          padding: 16px 24px !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          border-radius: 25px !important;
          min-height: 50px !important;
          min-width: 80px !important;
          background: var(--accent) !important;
          color: #ffffff !important;
          border: none !important;
          cursor: pointer !important;
          
          /* Enhanced styling */
          box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3) !important;
          touch-action: manipulation !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.2s ease !important;
        }

        .input-row button:hover {
          background: var(--accent-hover) !important;
          box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4) !important;
        }

        .input-row button:disabled {
          opacity: 0.6 !important;
          cursor: not-allowed !important;
          box-shadow: none !important;
        }

        /* Enhanced message bubbles */
        .chatbot-bubble {
          padding: 16px 20px !important;
          border-radius: 20px !important;
          max-width: 85% !important;
          font-size: 16px !important;
          line-height: 1.6 !important;
          word-break: break-word !important;
          display: block !important;
          
          /* Enhanced shadows */
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
        }

        /* Safe areas for iPhone */
        .chatbox {
          padding-top: env(safe-area-inset-top) !important;
        }

        .input-row {
          padding-bottom: calc(16px + env(safe-area-inset-bottom)) !important;
        }
      }

      /* Force proper initialization */
      .chatbox {
        display: none !important;
      }

      .chatbox[style*="flex"] {
        display: flex !important;
      }
    </style>

    <div class="auth-error">Authentication failed. Please refresh the page.</div>
    <div class="bubble">
      <span class="icon">${CONFIG.triggerIcon}</span>
      <span>${CONFIG.triggerText}</span>
    </div>
    <div class="teaser ${CONFIG.animation} ${!CONFIG.showTeaser ? 'hide' : ''}">
      <div class="close">×</div>
      <div class="input">${CONFIG.teaserMessage}</div>
      <button class="ask-btn">${CONFIG.triggerText}</button>
    </div>
    <div class="chatbox ${CONFIG.animation}">
      <div class="header">${CONFIG.headerTitle} <button class="close-btn">×</button></div>
      <div class="powered-by">Powered by <a href="https://helloyuno.com" target="_blank">HelloYuno</a></div>
      <div class="messages"></div>
      <div class="input-row">
        <input type="text" placeholder="${CONFIG.placeholder}" aria-label="${CONFIG.placeholder}" />
        <button>Send</button>
      </div>
    </div>
  `;

  class YunoChat extends HTMLElement {
    static get observedAttributes() { return ['theme']; }
    attributeChangedCallback(name, oldValue, newValue) {
      // CSS handles theme switching automatically
    }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.appendChild(template.content.cloneNode(true));
      
      // Widget elements
      this._bubble = root.querySelector('.bubble');
      this._teaser = root.querySelector('.teaser');
      this._closeTeaser = root.querySelector('.teaser .close');
      this._askTeaser = root.querySelector('.teaser .ask-btn');
      this._box = root.querySelector('.chatbox');
      this._closeBox = root.querySelector('.close-btn');
      this._msgs = root.querySelector('.messages');
      this._input = root.querySelector('input');
      this._sendBtn = root.querySelector('.input-row button');
      this._authError = root.querySelector('.auth-error');
      
      // State
      this._history = [{ role: 'system', content: 'You are Yuno, a friendly assistant.' }];
      this._first = true;
      this._teaserShown = false;
      this._token = null;
      this._tokenExpiry = null;
      this._retryCount = 0;
      this._maxRetries = 2;
      this._authenticated = false;
    }

    async connectedCallback() {
      // Apply initial theme
      if (!this.hasAttribute('theme')) {
        this.setAttribute('theme', CONFIG.theme);
      }

      // Authenticate widget before showing
      try {
        await this._authenticateWidget();
        this._setupEventListeners();
        this._initializeWidget();
      } catch (error) {
        console.error('Yuno: Failed to authenticate widget', error);
        this._showAuthError();
      }
    }

    async _authenticateWidget() {
      try {
        const response = await fetch(`${CONFIG.apiEndpoint}/widget/authenticate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            site_id: CONFIG.siteId,
            domain: window.location.hostname,
            nonce: crypto.randomUUID(),
            timestamp: Date.now()
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Authentication failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        this._token = data.token;
        this._tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1min buffer
        this._rateLimits = data.rate_limits;
        this._authenticated = true;
        
        console.log('🔐 Yuno: Authentication successful');
        return true;
      } catch (error) {
        console.error('🚨 Yuno: Authentication failed:', error);
        throw error;
      }
    }

    async _ensureValidToken() {
      // Check if token exists and is not expired
      if (this._token && this._tokenExpiry > Date.now()) {
        return this._token;
      }

      // Try to authenticate again
      try {
        await this._authenticateWidget();
        return this._token;
      } catch (error) {
        console.error('Yuno: Token refresh failed', error);
        this._showAuthError();
        return null;
      }
    }

    _setupEventListeners() {
      this._bubble.addEventListener('click', () => this._openChat());
      this._closeTeaser.addEventListener('click', () => this._hideTeaser());
      this._askTeaser.addEventListener('click', () => this._openChat());
      this._closeBox.addEventListener('click', () => this._toggleChat(false));
      this._sendBtn.addEventListener('click', () => this._send());
      this._input.addEventListener('keydown', e => e.key === 'Enter' && this._send());
    }

    _initializeWidget() {
      // Auto-show teaser based on config
      if (CONFIG.autoShow && CONFIG.showTeaser) {
        setTimeout(() => {
          if (!this._teaserShown) {
            this._bubble.style.display = 'none';
            this._teaser.style.display = 'inline-flex';
            this._teaserShown = true;
          }
        }, CONFIG.autoShowDelay);
      }
    }

    _showAuthError() {
      this._authError.style.display = 'block';
      this._bubble.style.display = 'none';
      this._teaser.style.display = 'none';
      this._box.style.display = 'none';
      
      // Hide error after 5 seconds
      setTimeout(() => {
        this._authError.style.display = 'none';
      }, 5000);
    }

    _openChat() {
      if (!this._authenticated) {
        this._showAuthError();
        return;
      }
      
      this._teaser.style.display = 'none';
      this._bubble.style.display = 'none';
      this._toggleChat(true);
    }

    _hideTeaser() {
      this._teaser.style.display = 'none';
      this._bubble.style.display = 'inline-flex';
      this._teaserShown = false;
    }

        // Mobile body scroll prevention
    _preventMobileBodyScroll(prevent = true) {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        if (prevent) {
          document.body.classList.add('yuno-mobile-chat-open');
          const scrollY = window.scrollY;
          document.body.style.top = `-${scrollY}px`;
        } else {
          document.body.classList.remove('yuno-mobile-chat-open');
          const scrollY = document.body.style.top;
          document.body.style.top = '';
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      }
    }


    _toggleChat(open) {
      this._box.style.display = open ? 'flex' : 'none';
      if (!open) this._bubble.style.display = 'inline-flex';
      if (open && this._first) {
        this._addBotMessage(CONFIG.welcomeMessage);
        this._first = false;
      }
      
      // Mobile enhancements
      this._preventMobileBodyScroll(open);
      
      // Only auto-focus input on desktop
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (open && !isMobile) {
        this._input.focus();
      }
    }

    _addBotMessage(text) {
      const msg = document.createElement('div'); 
      msg.className = 'msg bot';
      const bubble = document.createElement('div'); 
      bubble.className = 'chatbot-bubble';
      bubble.textContent = text;
      msg.appendChild(bubble);
      this._msgs.appendChild(msg);
      this._msgs.scrollTop = this._msgs.scrollHeight;
      this._history.push({ role: 'assistant', content: text });
    }

    _addUserMessage(text) {
      const msg = document.createElement('div'); 
      msg.className = 'msg user';
      const bubble = document.createElement('div'); 
      bubble.className = 'chatbot-bubble';
      bubble.textContent = text;
      msg.appendChild(bubble);
      this._msgs.appendChild(msg);
      this._msgs.scrollTop = this._msgs.scrollHeight;
      this._history.push({ role: 'user', content: text });
    }

    _showTyping() {
      const tip = document.createElement('div'); 
      tip.className = 'msg bot';
      tip.id = 'typing-indicator';
      const typing = document.createElement('div'); 
      typing.className = 'chatbot-bubble typing';
      for (let i = 0; i < 4; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        typing.appendChild(dot);
      }
      tip.appendChild(typing);
      this._msgs.appendChild(tip);
      this._msgs.scrollTop = this._msgs.scrollHeight;
    }

    _hideTyping() {
      const typingIndicator = this._msgs.querySelector('#typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
    }

    async _send() {
      const text = this._input.value.trim();
      if (!text) return;

      // Disable input during request
      this._input.disabled = true;
      this._sendBtn.disabled = true;

      // Ensure we have a valid token
      const token = await this._ensureValidToken();
      if (!token) {
        this._addBotMessage('Authentication failed. Please refresh the page.');
        this._input.disabled = false;
        this._sendBtn.disabled = false;
        return;
      }

      this._addUserMessage(text);
      this._input.value = '';
      this._showTyping();

      try {
        const response = await fetch(`${CONFIG.apiEndpoint}/ask`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            site_id: CONFIG.siteId,
            page_url: window.location.href,
            session_id,
            user_id,
            messages: this._history
          })
        });

        this._hideTyping();

        if (response.status === 401) {
          // Token expired, retry once with new token
          this._token = null;
          if (this._retryCount < this._maxRetries) {
            this._retryCount++;
            this._input.value = text; // Restore message
            this._history.pop(); // Remove the user message we just added
            this._msgs.removeChild(this._msgs.lastChild); // Remove user bubble
            await this._send();
            return;
          } else {
            this._addBotMessage('Session expired. Please refresh the page.');
          }
        } else if (response.status === 429) {
          this._addBotMessage('Too many requests. Please wait a moment before trying again.');
        } else if (response.status === 403) {
          this._addBotMessage('Access denied. Please contact support.');
        } else if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        } else {
          const data = await response.json();
          this._addBotMessage(data.content || "Sorry, I couldn't find anything.");
          this._retryCount = 0; // Reset retry count on success
        }
        
      } catch (error) {
        this._hideTyping();
        this._addBotMessage('Something went wrong. Please try again.');
        console.error('Yuno Error:', error);

      } finally {
        this._input.disabled = false;
        this._sendBtn.disabled = false;
        
        // Only auto-focus on desktop
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) {
          this._input.focus();
        }
      }
    }
  }

  // Widget initialization with authentication check
  async function initializeYunoWidget() {
    try {
      // Pre-authenticate before creating widget element
      const response = await fetch(`${CONFIG.apiEndpoint}/widget/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: CONFIG.siteId,
          domain: window.location.hostname,
          nonce: crypto.randomUUID(),
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        console.error(`Yuno: Widget not authorized for this domain (${response.status})`);
        return;
      }

      // Only create widget if authentication succeeds
      customElements.define('yuno-chat', YunoChat);

      const widget = document.createElement('yuno-chat');
      widget.setAttribute('theme', CONFIG.theme);
      document.body.appendChild(widget);
      
      console.log('✅ Yuno: Widget initialized successfully');
      
    } catch (error) {
      console.error('🚨 Yuno: Widget initialization failed:', error);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeYunoWidget);
  } else {
    initializeYunoWidget();
  }
})();