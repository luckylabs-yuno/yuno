// yuno-secure.js - Enhanced security version with Unified Message Contract support
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
  
   // — try data-attribute first, then query-param
   let siteId = thisScript?.getAttribute('site_id') || null;
   if (!siteId && thisScript?.src) {
     try {
       const url = new URL(thisScript.src, window.location.href);
       siteId = url.searchParams.get('site_id');
     } catch (e) {
       console.error('Yuno: could not parse site_id from script src', e);
     }
   }

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
    width: thisScript?.getAttribute('width') || '400px',
    height: thisScript?.getAttribute('height') || '700px',
    
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

  // Template with dynamic content, powered by message, and new unified contract features
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
        min-width: 380px; /* Ensure minimum width */
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
        padding: 16px; /* Increased from 12px */
        display: flex;
        flex-direction: column;
        gap: 16px; /* Increased from 12px */
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .messages::-webkit-scrollbar {
        display: none;
      }

      /* Quick Replies - NEW FEATURE */

    /* Update these CSS rules in the template */
      .quick-replies {
        display: flex;
        gap: 8px;
        padding: 8px 12px 8px;
        flex-wrap: wrap;
        justify-content: flex-start;
        background: var(--header-bg);
        border-bottom: 1px solid var(--border-color);
        min-height: 40px; /* Ensure minimum height */
      }
      .quick-reply-btn {
        background: var(--yuno-bg);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        border-radius: 16px;
        padding: 8px 12px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .quick-reply-btn:hover {
        background: var(--accent);
        color: #ffffff;
        border-color: var(--accent-solid);
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

      /* Product Carousel - NEW FEATURE */
      .product-carousel {
        display: flex;
        gap: 16px; /* Increased from 12px */
        overflow-x: auto;
        padding: 12px 0; /* Increased from 8px */
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .product-carousel::-webkit-scrollbar {
        display: none;
      }
      .product-card {
        min-width: 160px;
        background: var(--yuno-bg);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 12px;
        scroll-snap-align: start;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .product-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .product-image {
        width: 120px;
        height: 120px;
        background: #f0f0f0;
        border-radius: 8px;
        object-fit: cover;
        margin-bottom: 8px;
      }
      .product-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-color);
        margin-bottom: 4px;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .product-price {
        font-size: 14px;
        font-weight: bold;
        color: var(--accent-solid);
        margin-bottom: 8px;
      }
      .product-price .compare-price {
        font-size: 12px;
        color: var(--text-muted);
        text-decoration: line-through;
        margin-left: 4px;
        font-weight: normal;
      }
      .add-to-cart-btn {
        width: 100%;
        background: var(--accent);
        color: #ffffff;
        border: none;
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      .add-to-cart-btn:hover {
        background: var(--accent-hover);
      }
      .add-to-cart-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: var(--text-muted);
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
      <div class="quick-replies" style="display: none;"></div>
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
      this._quickReplies = root.querySelector('.quick-replies');
      
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
      this._setupQuickReplyAutoHide(); // ADD THIS LINE
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

  // Replace the existing _addToCart method
  _addToCart(product) {
    if (!product.id) {
      console.error('🛒 Product ID missing for add to cart', product);
      this._addBotMessage('❌ Product information is incomplete.');
      return;
    }
    
    console.log('🛒 Adding to cart:', product);
    this._updateCart(product.id, 1, product.title);
  }

  // Add this new method
  async _updateCart(merchandise_id, quantity, productTitle = '') {
    try {
      // Show loading state
      const action = quantity > 0 ? 'Adding to' : 'Removing from';
      this._addBotMessage(`⏳ ${action} cart...`);
      
      // Ensure we have a valid token
      const token = await this._ensureValidToken();
      if (!token) {
        this._removeLastBotMessage();
        this._addBotMessage('❌ Authentication failed. Please refresh the page.');
        return;
      }
      
      // Call our cart endpoint (uses same MCP service as product search)
      const cartResponse = await fetch(`${CONFIG.apiEndpoint}/shopify/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          merchandise_id: merchandise_id,
          quantity: quantity
        })
      });
      
      console.log('🛒 Cart Response Status:', cartResponse.status);
      
      if (cartResponse.ok) {
        const result = await cartResponse.json();
        console.log('🛒 Cart Success:', result);
        
        // Remove loading message
        this._removeLastBotMessage();
        
        // Show success message based on quantity
        if (quantity > 0) {
          // Added to cart
          if (result.checkout_url) {
            this._addBotMessage(`✅ Added "${productTitle}" to your cart!<br><br><a href="${result.checkout_url}" target="_blank" style="background: var(--accent); color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600; margin-top: 8px;">🛒 View Cart & Checkout</a>`);
          } else {
            this._addBotMessage(`✅ Added "${productTitle}" to your cart!`);
          }
        } else {
          // Removed from cart
          this._addBotMessage(`✅ Removed "${productTitle}" from your cart!`);
        }
        
        // Trigger cart update events for Shopify theme
        this._triggerCartUpdate();
        
      } else {
        // Handle error response
        const errorData = await cartResponse.json().catch(() => ({}));
        console.error('🛒 Cart Failed:', cartResponse.status, errorData);
        
        this._removeLastBotMessage();
        
        const errorMsg = errorData.message || 'Unable to update cart';
        this._addBotMessage(`❌ ${errorMsg}`);
      }
      
    } catch (error) {
      console.error('🛒 Cart Error:', error);
      this._removeLastBotMessage();
      this._addBotMessage('❌ Unable to update cart. Please try again.');
    }
  }

  // Add this helper method
  _triggerCartUpdate() {
    try {
      // Standard Shopify cart events
      window.dispatchEvent(new CustomEvent('cart:updated'));
      window.dispatchEvent(new CustomEvent('cart:build'));
      
      // Dawn theme and other modern themes
      if (window.CartDrawer && window.CartDrawer.renderContents) {
        window.CartDrawer.renderContents();
      }
      
      console.log('🛒 Cart update events triggered');
      
    } catch (error) {
      console.log('🛒 Theme cart update failed:', error);
    }
  }

    // Helper method to remove the last bot message (for loading states)
    _removeLastBotMessage() {
      const messages = this._msgs.querySelectorAll('.msg.bot');
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        lastMessage.remove();
      }
    }

    // Update _buildProductUrl to use the real URL from API
    _buildProductUrl(product) {
      // First try the full URL from the API response
      if (product.product_url) {
        return product.product_url;
      }
      
      // Fallback to constructing URL from handle
      if (product.handle) {
        const currentDomain = window.location.hostname;
        return `https://${currentDomain}/products/${product.handle}`;
      }
      
      return null;
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

    _toggleChat(open) {
      this._box.style.display = open ? 'flex' : 'none';
      if (!open) this._bubble.style.display = 'inline-flex';
      if (open && this._first) {
        this._addBotMessage(CONFIG.welcomeMessage);
        this._first = false;
      }
      if (open) this._input.focus();
    }

    // Enhanced message rendering with unified contract support
    _addBotMessage(content, messageData = null) {
      const msg = document.createElement('div'); 
      msg.className = 'msg bot';
      
      // Support both legacy string content and new unified contract
      if (typeof content === 'string') {
        // Legacy format - just text
        const bubble = document.createElement('div'); 
        bubble.className = 'chatbot-bubble';
        bubble.textContent = content;
        msg.appendChild(bubble);
        this._history.push({ role: 'assistant', content: content });
      } else if (messageData && messageData.content) {
        // New unified contract format
        const bubble = document.createElement('div'); 
        bubble.className = 'chatbot-bubble';
        
        // Sanitize and render HTML content
        bubble.innerHTML = this._sanitizeHTML(messageData.content);
        msg.appendChild(bubble);
        
        // Add product carousel if present
        if (messageData.product_carousel && messageData.product_carousel.length > 0) {
          const carousel = this._createProductCarousel(messageData.product_carousel);
          msg.appendChild(carousel);
        }
        
        this._history.push({ role: 'assistant', content: messageData.content });
      }
      
      this._msgs.appendChild(msg);
      this._msgs.scrollTop = this._msgs.scrollHeight;
      
      // Handle quick replies
      if (messageData && messageData.quick_replies && messageData.quick_replies.length > 0) {
        this._showQuickReplies(messageData.quick_replies);
      } else {
        this._hideQuickReplies();
      }
      
      // Handle follow-up
      if (messageData && messageData.follow_up && messageData.follow_up_prompt) {
        setTimeout(() => {
          this._addBotMessage(messageData.follow_up_prompt);
        }, 400);
      }
    }

    // HTML sanitizer for rich content
    _sanitizeHTML(html) {
      const allowedTags = ['b', 'i', 'u', 'a', 'ul', 'li', 'br'];
      const div = document.createElement('div');
      div.innerHTML = html;
      
      // Remove any script tags or dangerous elements
      const scripts = div.querySelectorAll('script');
      scripts.forEach(script => script.remove());
      
      // Only allow specific tags
      const allElements = div.querySelectorAll('*');
      allElements.forEach(el => {
        if (!allowedTags.includes(el.tagName.toLowerCase())) {
          el.replaceWith(document.createTextNode(el.textContent));
        }
      });
      
      return div.innerHTML;
    }

    // Update the _createProductCarousel method
    _createProductCarousel(products) {
      const carousel = document.createElement('div');
      carousel.className = 'product-carousel';
      
      products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Make the entire card clickable
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          this._navigateToProduct(product);
        });
        
        const image = document.createElement('img');
        image.className = 'product-image';
        image.src = product.image || '';
        image.alt = product.title || 'Product';
        image.onerror = () => {
          image.style.background = '#f0f0f0';
          image.style.display = 'flex';
          image.style.alignItems = 'center';
          image.style.justifyContent = 'center';
          image.innerHTML = '📦';
        };
        
        const title = document.createElement('div');
        title.className = 'product-title';
        title.textContent = product.title || 'Product';
        
        const priceContainer = document.createElement('div');
        priceContainer.className = 'product-price';
        priceContainer.textContent = product.price || '';
        
        if (product.compare_at_price) {
          const comparePrice = document.createElement('span');
          comparePrice.className = 'compare-price';
          comparePrice.textContent = product.compare_at_price;
          priceContainer.appendChild(comparePrice);
        }
        
        const button = document.createElement('button');
        button.className = 'add-to-cart-btn';
        button.textContent = product.available !== false ? 'Add to Cart' : 'Out of Stock';
        button.disabled = product.available === false;
        
        if (product.available !== false) {
          button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            this._addToCart(product);
          });
        }
        
        card.appendChild(image);
        card.appendChild(title);
        card.appendChild(priceContainer);
        card.appendChild(button);
        carousel.appendChild(card);
      });
      
      return carousel;
    }

    // Add navigation method
    _navigateToProduct(product) {
      const productUrl = this._buildProductUrl(product);
      if (productUrl) {
        window.open(productUrl, '_blank');
      }
    }

    _buildProductUrl(product) {
      // Try different URL construction methods
      if (product.url) {
        return product.url;
      }
      
      if (product.handle) {
        // Construct Shopify product URL
        const currentDomain = window.location.hostname;
        return `https://${currentDomain}/products/${product.handle}`;
      }
      
      // Fallback: try to construct from current page
      const currentUrl = window.location.href;
      const baseUrl = currentUrl.split('/products/')[0];
      if (product.handle) {
        return `${baseUrl}/products/${product.handle}`;
      }
      
      return null;
    }

    // Add to cart functionality
    _addToCart(product) {
      if (!product.id) {
        console.error('Product ID missing for add to cart');
        return;
      }
      
      // For Shopify integration
      fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: product.id,
          quantity: 1
        })
      }).then(response => {
        if (response.ok) {
          // Show success feedback
          this._addBotMessage(`✅ Added "${product.title}" to your cart!`);
        } else {
          this._addBotMessage('❌ Sorry, there was an issue adding that to your cart.');
        }
      }).catch(error => {
        console.error('Add to cart error:', error);
        this._addBotMessage('❌ Sorry, there was an issue adding that to your cart.');
      });
    }

    // Quick replies functionality
    _showQuickReplies(replies) {
      this._quickReplies.innerHTML = '';
      this._quickReplies.style.display = 'flex';
      
      replies.forEach(reply => {
        const btn = document.createElement('button');
        btn.className = 'quick-reply-btn';
        btn.textContent = reply;
        btn.addEventListener('click', () => {
          this._sendQuickReply(reply);
        });
        this._quickReplies.appendChild(btn);
      });
    }

    _hideQuickReplies() {
      this._quickReplies.style.display = 'none';
      this._quickReplies.innerHTML = '';
    }

    _sendQuickReply(text) {
      this._hideQuickReplies();
      this._input.value = text;
      this._send();
    }


    // Update the auto-hide method to be more gentle
    _setupQuickReplyAutoHide() {
      this._input.addEventListener('focus', () => {
        // Delay hiding to allow quick reply clicks
        setTimeout(() => {
          if (this._input.value.trim()) {
            this._hideQuickReplies();
          }
        }, 200);
      });
      
      this._input.addEventListener('input', () => {
        if (this._input.value.trim()) {
          this._hideQuickReplies();
        }
      });
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

      // Hide quick replies when sending
      this._hideQuickReplies();

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
        const response = await fetch(`${CONFIG.apiEndpoint}/shopify/ask`, {
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
          

          if (data.content || data.product_carousel || data.quick_replies) {
            this._addBotMessage(null, data);
          } else {
            // Fallback
            this._addBotMessage(data.content || "I'm here to help!");
          }

          this._retryCount = 0; // Reset retry count on success
        }
        
      } catch (error) {
        this._hideTyping();
        this._addBotMessage('Something went wrong. Please try again.');
        console.error('Yuno Error:', error);
      } finally {
        this._input.disabled = false;
        this._sendBtn.disabled = false;
        this._input.focus();
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
      
      console.log('✅ Yuno: Widget initialized successfully with unified contract support');
      
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