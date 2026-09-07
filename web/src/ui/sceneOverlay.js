// Dynamic visual scene overlay for Transylvania (1982).
// Renders vector assets, interactive props, and dynamic environmental changes
// directly on top of the 1024x1024 background scene artwork.

/**
 * Common SVG filters and gradients used across scene overlays.
 */
const OVERLAY_DEFS = `
  <defs>
    <!-- Paper drop shadow -->
    <filter id="paperShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="3" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.85"/>
    </filter>

    <!-- Acid rune mystic glow -->
    <filter id="runeGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Metal / Key sparkle -->
    <filter id="goldGlint" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#fbbf24" flood-opacity="0.9"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Extraterrestrial cyan saucer aura -->
    <filter id="saucerGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Blood / Werewolf / Vampire threat glow -->
    <filter id="bloodGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#ef4444" flood-opacity="0.85"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Smoldering embers glow -->
    <filter id="emberGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#f97316" flood-opacity="0.9"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Parchment paper gradient -->
    <linearGradient id="parchmentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#faebd7"/>
      <stop offset="60%" stop-color="#e9d3ac"/>
      <stop offset="100%" stop-color="#cfb07e"/>
    </linearGradient>

    <!-- Wood cross gradient -->
    <linearGradient id="woodCrossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5a3d28"/>
      <stop offset="50%" stop-color="#3b2617"/>
      <stop offset="100%" stop-color="#23140a"/>
    </linearGradient>

    <!-- Gold key gradient -->
    <linearGradient id="goldKeyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>

    <!-- Silver bullet gradient -->
    <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#e2e8f0"/>
      <stop offset="80%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
  </defs>
`;

/** Outer placement group for each interactive prop, keyed by its content group. */
const PROP_ROOTS = new WeakMap();

/**
 * Positions a prop. Placement always lands on the outer group so that the CSS
 * hover transform on the inner group has nothing to collide with.
 * @param {SVGGElement} g
 * @param {string} transform
 */
function placeProp(g, transform) {
  (PROP_ROOTS.get(g) ?? g).setAttribute("transform", transform);
}

/**
 * The element to insert into the overlay for a prop -- its outer placement
 * group, or the element itself for plain decorative groups.
 * @param {SVGGElement} g
 */
function propRoot(g) {
  return PROP_ROOTS.get(g) ?? g;
}

/**
 * Creates an interactive SVG group with hover styling and click handler.
 * @param {string} label
 * @param {() => void} [onClick]
 * @returns {SVGGElement}
 */
function createInteractiveGroup(label, onClick) {
  // Two nested groups on purpose. The OUTER one carries the prop's position as
  // a `transform` presentation attribute; the INNER one carries the class whose
  // :hover rule applies a CSS `transform`.
  //
  // They must not be the same element. A CSS `transform` declaration overrides
  // the `transform` presentation attribute outright (presentation attributes
  // lose to every CSS rule), so hovering a prop that carried both replaced
  // `translate(530, 770)` with `scale(1.03)` and flung it to the SVG origin.
  // Once it moved out from under the pointer the hover ended, it snapped back,
  // and the 0.18s transition made it strobe between the two positions.
  const root = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  root.appendChild(g);
  PROP_ROOTS.set(g, root);
  g.setAttribute("class", "scene-prop-interactive");
  g.setAttribute("tabindex", "0");
  g.setAttribute("role", "button");
  g.setAttribute("aria-label", label);

  const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
  title.textContent = `${label} (Click to interact)`;
  g.appendChild(title);

  if (onClick) {
    g.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }
    });
  }
  return g;
}

/**
 * Room 1: Ancient Stump
 * Displays acid-burned glowing runes when SM flag is set.
 */
function renderRoom1(overlay, state, onAction) {
  if (state.flags.SM) {
    const g = createInteractiveGroup("Glowing Rune Inscription", () => onAction?.("read stump"));
    g.innerHTML += `
      <!-- Burned moss patch -->
      <ellipse cx="512" cy="710" rx="160" ry="60" fill="rgba(10, 15, 8, 0.75)" filter="url(#runeGlow)" />

      <!-- Glowing ancient runes -->
      <g filter="url(#runeGlow)">
        <!-- Outer decorative runic brackets -->
        <path d="M 330 690 L 355 710 L 330 730" fill="none" stroke="#86efac" stroke-width="3" stroke-linecap="round" />
        <path d="M 694 690 L 669 710 L 694 730" fill="none" stroke="#86efac" stroke-width="3" stroke-linecap="round" />
        
        <text x="512" y="718" text-anchor="middle" class="rune-text">KNOCK HERE</text>
        <circle cx="512" cy="670" r="4" fill="#4ade80" />
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 3: Dark Forest
 * Displays the wrinkled note on the forest floor if Object 18 is present.
 */
function renderRoom3(overlay, state, onAction) {
  if (state.objectLoc[18] === 3) {
    const g = createInteractiveGroup("Wrinkled Note", () => onAction?.("get note"));
    placeProp(g, "translate(530, 770) rotate(-6)");
    g.innerHTML += `
      <!-- Ground shadow -->
      <ellipse cx="6" cy="18" rx="72" ry="32" fill="rgba(0, 0, 0, 0.65)" filter="url(#paperShadow)" />

      <!-- Crumpled paper body with folded corners -->
      <polygon points="-58,-28 42,-34 68,14 46,38 -48,32 -66,4" 
               fill="url(#parchmentGrad)" 
               stroke="#6b4e2e" 
               stroke-width="1.8" 
               filter="url(#paperShadow)" />

      <!-- Crease lines -->
      <line x1="-58" y1="-28" x2="6" y2="4" stroke="#a27c52" stroke-width="1.2" stroke-opacity="0.8"/>
      <line x1="42" y1="-34" x2="-14" y2="18" stroke="#a27c52" stroke-width="1.2" stroke-opacity="0.8"/>
      <line x1="-48" y1="32" x2="18" y2="-12" stroke="#a27c52" stroke-width="1" stroke-opacity="0.7"/>

      <!-- Faint cursive handwritten lines -->
      <path d="M -40 -12 Q -20 -15 0 -11 Q 20 -7 38 -12" fill="none" stroke="#4a3724" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M -36 4 Q -10 1 12 6 Q 24 8 36 3" fill="none" stroke="#4a3724" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M -30 18 Q -8 16 14 19 Q 20 20 28 17" fill="none" stroke="#4a3724" stroke-width="1.2" stroke-linecap="round"/>

      <!-- Interactive floating callout pill -->
      <g class="prop-badge">
        <rect x="-42" y="-56" width="84" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#38bdf8" stroke-width="1.2"/>
        <text x="0" y="-42" text-anchor="middle" class="prop-badge-text">📜 NOTE</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 4: Forest Clearing
 * Displays alien statue, smoking shattered pedestal, or crashed extraterrestrial saucer.
 */
function renderRoom4(overlay, state, onAction) {
  // 1. Saucer crash (Obj 28)
  if (state.objectLoc[28] === 4) {
    const g = createInteractiveGroup("Glowing Extraterrestrial Saucer", () => onAction?.("look saucer"));
    placeProp(g, "translate(512, 690)");
    g.innerHTML += `
      <!-- Crash impact crater & smoke -->
      <ellipse cx="0" cy="40" rx="190" ry="60" fill="#030712" opacity="0.85" />
      
      <!-- Pulsating cyan aura -->
      <ellipse cx="0" cy="0" rx="150" ry="46" fill="none" stroke="#38bdf8" stroke-width="6" opacity="0.6" filter="url(#saucerGlow)"/>

      <!-- Metallic saucer hull -->
      <ellipse cx="0" cy="6" rx="140" ry="40" fill="#1e293b" stroke="#0ea5e9" stroke-width="2.5"/>
      <ellipse cx="0" cy="-14" rx="75" ry="32" fill="#0284c7" stroke="#e0f2fe" stroke-width="2" opacity="0.85" filter="url(#saucerGlow)"/>
      <ellipse cx="0" cy="-20" rx="42" ry="18" fill="#ffffff" opacity="0.75"/>

      <!-- Navigation lights -->
      <circle cx="-100" cy="6" r="5" fill="#f43f5e"/>
      <circle cx="-50" cy="18" r="5" fill="#eab308"/>
      <circle cx="0" cy="22" r="6" fill="#38bdf8"/>
      <circle cx="50" cy="18" r="5" fill="#eab308"/>
      <circle cx="100" cy="6" r="5" fill="#f43f5e"/>

      <g class="prop-badge">
        <rect x="-56" y="-76" width="112" height="22" rx="11" fill="rgba(6, 9, 18, 0.92)" stroke="#38bdf8" stroke-width="1.2"/>
        <text x="0" y="-61" text-anchor="middle" class="prop-badge-text">🛸 GLOWING SAUCER</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
    return;
  }

  // 2. Alien Creature Statue (Obj 2)
  if (state.objectLoc[2] === 4) {
    const g = createInteractiveGroup("Alien Creature Statue", () => onAction?.("look statue"));
    placeProp(g, "translate(512, 650)");
    g.innerHTML += `
      <!-- Pedestal shadow -->
      <ellipse cx="0" cy="85" rx="80" ry="26" fill="rgba(0,0,0,0.7)" filter="url(#paperShadow)"/>

      <!-- Carved stone pedestal base -->
      <polygon points="-65,40 65,40 80,85 -80,85" fill="#1e293b" stroke="#0f172a" stroke-width="2.5"/>
      <rect x="-55" y="-5" width="110" height="48" rx="3" fill="#334155" stroke="#1e293b" stroke-width="2"/>
      <!-- Carved alien glyph lines on pedestal -->
      <line x1="-35" y1="18" x2="35" y2="18" stroke="#0ea5e9" stroke-width="1.5" stroke-dasharray="6,4"/>

      <!-- Folded gargoyle/alien wings -->
      <path d="M -25 -20 Q -95 -80 -65 15 Q -40 25 -25 10 Z" fill="#1e293b" stroke="#334155" stroke-width="2" filter="url(#paperShadow)"/>
      <path d="M 25 -20 Q 95 -80 65 15 Q 40 25 25 10 Z" fill="#1e293b" stroke="#334155" stroke-width="2" filter="url(#paperShadow)"/>

      <!-- Crouched alien body & clawed limbs -->
      <ellipse cx="0" cy="5" rx="32" ry="24" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
      <path d="M -30 20 L -45 42 L -35 44" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
      <path d="M 30 20 L 45 42 L 35 44" stroke="#475569" stroke-width="3" stroke-linecap="round"/>

      <!-- Horned alien head & spines -->
      <polygon points="-16,-45 -28,-75 -10,-55" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <polygon points="16,-45 28,-75 10,-55" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <ellipse cx="0" cy="-35" rx="24" ry="20" fill="#1e293b" stroke="#334155" stroke-width="2"/>

      <!-- Glowing green alien eyes -->
      <ellipse cx="-10" cy="-35" rx="5" ry="3" fill="#4ade80" filter="url(#runeGlow)"/>
      <circle cx="-10" cy="-35" r="1.5" fill="#14532d"/>
      <ellipse cx="10" cy="-35" rx="5" ry="3" fill="#4ade80" filter="url(#runeGlow)"/>
      <circle cx="10" cy="-35" r="1.5" fill="#14532d"/>

      <g class="prop-badge">
        <rect x="-65" y="-85" width="130" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#38bdf8" stroke-width="1.2"/>
        <text x="0" y="-70" text-anchor="middle" class="prop-badge-text">🗿 ALIEN STATUE</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
    return;
  }

  // 3. Smoking shattered pedestal (statue destroyed, saucer not yet arrived)
  if (state.objectLoc[2] === -1 && state.timers.R > 0) {
    const g = createInteractiveGroup("Smoking Shattered Pedestal", () => onAction?.("look pedestal"));
    placeProp(g, "translate(512, 700)");
    g.innerHTML += `
      <!-- Scorch mark & shadow -->
      <ellipse cx="0" cy="30" rx="90" ry="28" fill="rgba(0,0,0,0.7)" filter="url(#paperShadow)"/>
      
      <!-- Cracked fractured pedestal stump -->
      <polygon points="-65,10 65,10 75,35 -75,35" fill="#18181b" stroke="#09090b" stroke-width="2"/>
      <polygon points="-45,-15 10,-5 45,-18 35,10 -40,10" fill="#27272a" stroke="#3f3f46" stroke-width="2"/>

      <!-- Glowing fracture lines & embers -->
      <line x1="-20" y1="-10" x2="-5" y2="8" stroke="#ef4444" stroke-width="2" filter="url(#runeGlow)"/>
      <line x1="5" y1="-8" x2="25" y2="5" stroke="#f97316" stroke-width="2" filter="url(#runeGlow)"/>
      <circle cx="-10" cy="2" r="3" fill="#f97316" filter="url(#runeGlow)" class="ember-particle"/>
      <circle cx="15" cy="-2" r="2.5" fill="#ef4444" filter="url(#runeGlow)"/>

      <!-- Rising wisps of smoke -->
      <path d="M -10 -15 Q -25 -40 -10 -60 Q 5 -80 -5 -100" fill="none" stroke="#64748b" stroke-width="2" opacity="0.45" stroke-linecap="round"/>
      <path d="M 15 -12 Q 5 -35 20 -55 Q 30 -75 15 -95" fill="none" stroke="#94a3b8" stroke-width="2.5" opacity="0.4" stroke-linecap="round"/>

      <g class="prop-badge">
        <rect x="-70" y="-85" width="140" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#f97316" stroke-width="1.2"/>
        <text x="0" y="-70" text-anchor="middle" class="prop-badge-text">💨 SMOKING PEDESTAL</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 5: Cemetery
 * Displays wooden cross, moved gravestone, and iron grate (closed vs open shaft).
 */
function renderRoom5(overlay, state, onAction) {
  // 1. Wooden Cross (Obj 6)
  if (state.objectLoc[6] === 5) {
    const g = createInteractiveGroup("Wooden Cross", () => onAction?.("get cross"));
    placeProp(g, "translate(310, 680)");
    g.innerHTML += `
      <!-- Cross shadow -->
      <polygon points="10,65 140,80 160,95 20,80" fill="rgba(0,0,0,0.55)" filter="url(#paperShadow)"/>

      <!-- Vertical timber beam -->
      <rect x="-9" y="-80" width="18" height="150" rx="3" fill="url(#woodCrossGrad)" stroke="#1a0f08" stroke-width="1.8" filter="url(#paperShadow)"/>
      
      <!-- Horizontal crossbar -->
      <rect x="-48" y="-54" width="96" height="16" rx="3" fill="url(#woodCrossGrad)" stroke="#1a0f08" stroke-width="1.8" filter="url(#paperShadow)"/>

      <!-- Wood grain & iron nail in center -->
      <circle cx="0" cy="-46" r="3.5" fill="#0f172a" stroke="#475569" stroke-width="1"/>
      <line x1="-38" y1="-46" x2="38" y2="-46" stroke="#2a180e" stroke-width="1"/>

      <g class="prop-badge">
        <rect x="-42" y="-110" width="84" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#cbd5e1" stroke-width="1"/>
        <text x="0" y="-96" text-anchor="middle" class="prop-badge-text">✝️ CROSS</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }

  // 2. Grate behind gravestone (Obj 13)
  if (state.objectLoc[13] === 5) {
    const isOpen = state.flags.GT === 1;
    const g = createInteractiveGroup(
      isOpen ? "Open Shaft Down to Catacombs" : "Locked Rusty Iron Grate",
      () => onAction?.(isOpen ? "go down" : "unlock grate"),
    );
    placeProp(g, "translate(660, 750)");

    if (isOpen) {
      // Open grate: dark vertical pit with ladder descending
      g.innerHTML += `
        <!-- Earth opening & pit -->
        <polygon points="-85,-35 85,-35 95,45 -95,45" fill="#020617" stroke="#475569" stroke-width="3"/>
        <rect x="-70" y="-25" width="140" height="60" fill="#000000"/>

        <!-- Descending ladder rungs -->
        <line x1="-30" y1="-20" x2="-30" y2="35" stroke="#64748b" stroke-width="3"/>
        <line x1="30" y1="-20" x2="30" y2="35" stroke="#64748b" stroke-width="3"/>
        <line x1="-30" y1="-10" x2="30" y2="-10" stroke="#94a3b8" stroke-width="2.5"/>
        <line x1="-30" y1="5" x2="30" y2="5" stroke="#94a3b8" stroke-width="2.5"/>
        <line x1="-30" y1="20" x2="30" y2="20" stroke="#94a3b8" stroke-width="2.5"/>

        <!-- Swung-open grate door leaning back -->
        <polygon points="-80,-35 -85,-110 5,-105 10,-35" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-dasharray="8,4"/>

        <g class="prop-badge">
          <rect x="-60" y="-80" width="120" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#38bdf8" stroke-width="1.2"/>
          <text x="0" y="-65" text-anchor="middle" class="prop-badge-text">🪜 LADDER DOWN</text>
        </g>
      `;
    } else {
      // Closed locked iron grate
      g.innerHTML += `
        <polygon points="-85,-35 85,-35 95,45 -95,45" fill="#18181b" stroke="#52525b" stroke-width="3.5"/>
        <!-- Grate grid bars -->
        <line x1="-60" y1="-30" x2="-70" y2="40" stroke="#71717a" stroke-width="3"/>
        <line x1="-30" y1="-32" x2="-35" y2="42" stroke="#71717a" stroke-width="3"/>
        <line x1="0" y1="-33" x2="0" y2="43" stroke="#71717a" stroke-width="3"/>
        <line x1="30" y1="-32" x2="35" y2="42" stroke="#71717a" stroke-width="3"/>
        <line x1="60" y1="-30" x2="70" y2="40" stroke="#71717a" stroke-width="3"/>
        <line x1="-80" y1="-10" x2="80" y2="-10" stroke="#71717a" stroke-width="3"/>
        <line x1="-85" y1="18" x2="85" y2="18" stroke="#71717a" stroke-width="3"/>

        <!-- Padlock in center -->
        <rect x="-12" y="0" width="24" height="20" rx="3" fill="#b45309" stroke="#fbbf24" stroke-width="1.5"/>
        <path d="M -7 0 L -7 -8 A 7 7 0 0 1 7 -8 L 7 0" fill="none" stroke="#e2e8f0" stroke-width="2.2"/>

        <g class="prop-badge">
          <rect x="-64" y="-70" width="128" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#fbbf24" stroke-width="1.2"/>
          <text x="0" y="-55" text-anchor="middle" class="prop-badge-text">🔒 LOCKED GRATE</text>
        </g>
      `;
    }
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 7: Clay Hut Interior
 * Displays weak acid vial, broom, and black cat.
 */
function renderRoom7(overlay, state, onAction) {
  // 1. Weak Acid (Obj 1)
  if (state.objectLoc[1] === 7) {
    const g = createInteractiveGroup("Bottle of Weak Acid", () => onAction?.("get acid"));
    placeProp(g, "translate(280, 520)");
    g.innerHTML += `
      <!-- Glass vial with glowing green acid -->
      <rect x="-14" y="-28" width="28" height="46" rx="6" fill="#14532d" stroke="#4ade80" stroke-width="1.8" filter="url(#runeGlow)"/>
      <rect x="-8" y="-40" width="16" height="14" fill="#1e293b" stroke="#4ade80" stroke-width="1.5"/>
      <polygon points="-7,-40 7,-40 5,-48 -5,-48" fill="#a16207"/>
      <!-- Acid fluid level -->
      <rect x="-10" y="-12" width="20" height="26" rx="4" fill="#22c55e" opacity="0.85"/>
      <circle cx="-3" cy="2" r="2" fill="#86efac"/>
      <circle cx="4" cy="-4" r="1.5" fill="#86efac"/>

      <g class="prop-badge">
        <rect x="-38" y="-72" width="76" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#4ade80" stroke-width="1"/>
        <text x="0" y="-58" text-anchor="middle" class="prop-badge-text">🧪 ACID</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }

  // 2. Witch's Broom (Obj 25)
  if (state.objectLoc[25] === 7) {
    const g = createInteractiveGroup("Witch's Broom", () => onAction?.("get broom"));
    placeProp(g, "translate(790, 620) rotate(14)");
    g.innerHTML += `
      <!-- Broom handle -->
      <rect x="-5" y="-140" width="10" height="150" rx="3" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
      <!-- Straw bristles -->
      <polygon points="-24,10 24,10 32,80 -32,80" fill="#ca8a04" stroke="#713f12" stroke-width="1.5"/>
      <line x1="-16" y1="35" x2="16" y2="35" stroke="#451a03" stroke-width="3"/>

      <g class="prop-badge" transform="rotate(-14)">
        <rect x="-42" y="-170" width="84" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#ca8a04" stroke-width="1"/>
        <text x="0" y="-156" text-anchor="middle" class="prop-badge-text">🧹 BROOM</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }

  // 3. Black Cat (Obj 24)
  if (state.objectLoc[24] === 7) {
    const g = createInteractiveGroup("Black Cat", () => onAction?.("look cat"));
    placeProp(g, "translate(530, 640)");
    g.innerHTML += `
      <!-- Cat body & arched tail -->
      <ellipse cx="0" cy="10" rx="26" ry="18" fill="#09090b" stroke="#18181b" stroke-width="1.5" filter="url(#paperShadow)"/>
      <path d="M 18 10 Q 38 4 34 -18 Q 30 -30 24 -24" fill="none" stroke="#09090b" stroke-width="5" stroke-linecap="round"/>
      <!-- Cat head & ears -->
      <circle cx="-16" cy="-4" r="14" fill="#09090b"/>
      <polygon points="-26,-10 -22,-26 -14,-14" fill="#09090b"/>
      <polygon points="-16,-14 -10,-26 -6,-10" fill="#09090b"/>
      <!-- Glowing yellow slit eyes -->
      <ellipse cx="-20" cy="-6" rx="3.5" ry="5" fill="#facc15"/>
      <line x1="-20" y1="-10" x2="-20" y2="-2" stroke="#000000" stroke-width="1.5"/>
      <ellipse cx="-11" cy="-6" rx="3.5" ry="5" fill="#facc15"/>
      <line x1="-11" y1="-10" x2="-11" y2="-2" stroke="#000000" stroke-width="1.5"/>

      <g class="prop-badge">
        <rect x="-42" y="-55" width="84" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#eab308" stroke-width="1"/>
        <text x="0" y="-41" text-anchor="middle" class="prop-badge-text">🐈‍⬛ BLACK CAT</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 9: Dark Cave
 * Displays buzzing fly swarm (Obj 7) and magic book (Obj 33).
 */
function renderRoom9(overlay, state, onAction) {
  // 1. Swarm of Buzzing Flies (Obj 7)
  if (state.objectLoc[7] === 9) {
    const g = createInteractiveGroup("Swarm of Buzzing Flies", () => onAction?.("get flies"));
    placeProp(g, "translate(420, 480)");
    g.innerHTML += `
      <!-- Animated buzzing fly particle cloud -->
      <circle cx="-20" cy="-15" r="3.5" fill="#000" stroke="#64748b" stroke-width="1" class="fly-particle"/>
      <circle cx="15" cy="-25" r="3" fill="#000" stroke="#64748b" stroke-width="1" class="fly-particle"/>
      <circle cx="30" cy="10" r="3.5" fill="#000" stroke="#64748b" stroke-width="1" class="fly-particle"/>
      <circle cx="-10" cy="20" r="4" fill="#000" stroke="#64748b" stroke-width="1" class="fly-particle"/>
      <circle cx="-35" cy="5" r="2.5" fill="#000" stroke="#64748b" stroke-width="1" class="fly-particle"/>
      <circle cx="5" cy="-5" r="3.5" fill="#000" stroke="#64748b" stroke-width="1" class="fly-particle"/>

      <g class="prop-badge">
        <rect x="-40" y="-55" width="80" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#94a3b8" stroke-width="1"/>
        <text x="0" y="-41" text-anchor="middle" class="prop-badge-text">🪰 FLIES</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }

  // 2. Magic Book (Obj 33)
  if (state.objectLoc[33] === 9) {
    const g = createInteractiveGroup("Magic Book", () => onAction?.("read book"));
    placeProp(g, "translate(680, 680)");
    g.innerHTML += `
      <!-- Pedestal shadow -->
      <ellipse cx="0" cy="30" rx="55" ry="18" fill="rgba(0,0,0,0.7)" filter="url(#paperShadow)"/>
      <!-- Ancient stone pedestal -->
      <polygon points="-38,28 38,28 48,60 -48,60" fill="#27272a" stroke="#52525b" stroke-width="2"/>
      <rect x="-44" y="20" width="88" height="10" fill="#3f3f46" stroke="#71717a" stroke-width="1.5"/>
      <!-- Open leather-bound grimoire -->
      <polygon points="-52,-15 0,-8 52,-15 48,15 0,22 -48,15" fill="#78350f" stroke="#451a03" stroke-width="2" filter="url(#paperShadow)"/>
      <!-- Parchment pages -->
      <polygon points="-48,-12 -2,-6 -2,18 -44,12" fill="#fef3c7"/>
      <polygon points="2,-6 48,-12 44,12 2,18" fill="#fef3c7"/>
      <!-- Runic spell text -->
      <line x1="-40" y1="-4" x2="-8" y2="-4" stroke="#78350f" stroke-width="1.5"/>
      <line x1="-38" y1="4" x2="-10" y2="4" stroke="#78350f" stroke-width="1.5"/>
      <line x1="10" y1="-4" x2="42" y2="-4" stroke="#78350f" stroke-width="1.5"/>
      <line x1="12" y1="4" x2="38" y2="4" stroke="#78350f" stroke-width="1.5"/>
      <!-- Arcane seal glowing on left page -->
      <circle cx="-25" cy="0" r="6" fill="none" stroke="#dc2626" stroke-width="1.2"/>

      <g class="prop-badge">
        <rect x="-56" y="-45" width="112" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#f59e0b" stroke-width="1.2"/>
        <text x="0" y="-31" text-anchor="middle" class="prop-badge-text">📖 MAGIC BOOK</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }

  // 3. Iron Door to North
  renderCaveIronDoor(overlay, state, onAction, 9);
}

/**
 * Shared iron door between Room 9 (Dark Cave) and Room 10 (Crystal Cavern).
 */
function renderCaveIronDoor(overlay, state, onAction, roomId) {
  const isOpen = state.flags.DR === 1;
  const g = createInteractiveGroup(
    isOpen ? "Open Iron Doorway" : "Locked Heavy Iron Door",
    () => onAction?.(isOpen ? "go door" : "unlock door"),
  );
  placeProp(g, "translate(512, 420)");

  if (isOpen) {
    g.innerHTML += `
      <!-- Deep cavern archway shadow -->
      <path d="M -75 90 L -75 -40 A 75 75 0 0 1 75 -40 L 75 90 Z" fill="#020617" stroke="#334155" stroke-width="4"/>
      <!-- Glowing passage beyond doorway -->
      <path d="M -60 85 L -60 -30 A 60 60 0 0 1 60 -30 L 60 85 Z" fill="#0369a1" opacity="0.35" filter="url(#runeGlow)"/>
      <ellipse cx="0" cy="50" rx="45" ry="20" fill="#38bdf8" opacity="0.4" filter="url(#runeGlow)"/>

      <!-- Swung-open iron door leaf in perspective -->
      <polygon points="75,-40 120,-30 115,85 75,90" fill="#18181b" stroke="#52525b" stroke-width="2.5"/>
      <line x1="75" y1="20" x2="118" y2="22" stroke="#71717a" stroke-width="2"/>

      <g class="prop-badge">
        <rect x="-60" y="-85" width="120" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#38bdf8" stroke-width="1.2"/>
        <text x="0" y="-70" text-anchor="middle" class="prop-badge-text">🚪 OPEN DOORWAY</text>
      </g>
    `;
  } else {
    g.innerHTML += `
      <!-- Arched stone frame -->
      <path d="M -85 95 L -85 -45 A 85 85 0 0 1 85 -45 L 85 95 Z" fill="#18181b" stroke="#334155" stroke-width="5" filter="url(#paperShadow)"/>
      <path d="M -72 90 L -72 -38 A 72 72 0 0 1 72 -38 L 72 90 Z" fill="#27272a" stroke="#52525b" stroke-width="2"/>

      <!-- Iron door panels and rivets -->
      <line x1="0" y1="-38" x2="0" y2="90" stroke="#09090b" stroke-width="3"/>
      <line x1="-72" y1="5" x2="72" y2="5" stroke="#3f3f46" stroke-width="4"/>
      <line x1="-72" y1="50" x2="72" y2="50" stroke="#3f3f46" stroke-width="4"/>

      <!-- Iron rivets -->
      <circle cx="-35" cy="5" r="3" fill="#a1a1aa"/>
      <circle cx="35" cy="5" r="3" fill="#a1a1aa"/>
      <circle cx="-35" cy="50" r="3" fill="#a1a1aa"/>
      <circle cx="35" cy="50" r="3" fill="#a1a1aa"/>
      <circle cx="-35" cy="-15" r="3" fill="#a1a1aa"/>
      <circle cx="35" cy="-15" r="3" fill="#a1a1aa"/>

      <!-- Heavy lock escutcheon and keyhole -->
      <rect x="-14" y="20" width="28" height="24" rx="4" fill="#b45309" stroke="#fbbf24" stroke-width="1.5"/>
      <circle cx="0" cy="29" r="3.5" fill="#000000"/>
      <polygon points="-2,29 2,29 3,38 -3,38" fill="#000000"/>

      <g class="prop-badge">
        <rect x="-62" y="-90" width="124" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#fbbf24" stroke-width="1.2"/>
        <text x="0" y="-75" text-anchor="middle" class="prop-badge-text">🔒 LOCKED DOOR</text>
      </g>
    `;
  }
  overlay.appendChild(propRoot(g));
}

/**
 * Room 10: Crystal Cavern
 * Displays the iron door leading back south to Room 9.
 */
function renderRoom10(overlay, state, onAction) {
  renderCaveIronDoor(overlay, state, onAction, 10);
}

/**
 * Room 16: Lake Shore
 * Displays the bullfrog on the rock (Obj 8) or water ripples when fed.
 */
function renderRoom16(overlay, state, onAction) {
  if (state.objectLoc[8] === 16) {
    const g = createInteractiveGroup("Plump Bullfrog", () => onAction?.("feed frog"));
    placeProp(g, "translate(340, 770)");
    g.innerHTML += `
      <!-- Frog body sitting on rock -->
      <ellipse cx="0" cy="8" rx="38" ry="24" fill="#15803d" stroke="#14532d" stroke-width="2"/>
      <ellipse cx="-12" cy="-14" rx="14" ry="14" fill="#22c55e" stroke="#14532d" stroke-width="1.8"/>
      <ellipse cx="12" cy="-14" rx="14" ry="14" fill="#22c55e" stroke="#14532d" stroke-width="1.8"/>
      <!-- Bulging yellow frog eyes -->
      <circle cx="-12" cy="-16" r="6" fill="#facc15"/>
      <circle cx="-12" cy="-16" r="2.5" fill="#000000"/>
      <circle cx="12" cy="-16" r="6" fill="#facc15"/>
      <circle cx="12" cy="-16" r="2.5" fill="#000000"/>
      <!-- Belly -->
      <ellipse cx="0" cy="12" rx="24" ry="12" fill="#86efac" opacity="0.8"/>

      <g class="prop-badge">
        <rect x="-48" y="-50" width="96" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#22c55e" stroke-width="1.2"/>
        <text x="0" y="-36" text-anchor="middle" class="prop-badge-text">🐸 BULLFROG</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  } else {
    // Water ripples where frog jumped in
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    placeProp(g, "translate(340, 770)");
    g.innerHTML = `
      <ellipse cx="0" cy="8" rx="48" ry="16" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.5" class="water-ripple"/>
      <ellipse cx="0" cy="8" rx="28" ry="9" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.7"/>
    `;
    overlay.appendChild(propRoot(g));
  }

  // 2. Small Sailboat (Obj 30)
  if (state.objectLoc[30] === 16) {
    const g = createInteractiveGroup("Small Sailboat", () => onAction?.("sail boat"));
    placeProp(g, "translate(720, 680)");
    g.innerHTML += `
      <!-- Boat hull shadow on water -->
      <ellipse cx="0" cy="24" rx="75" ry="18" fill="rgba(2, 6, 23, 0.6)" filter="url(#paperShadow)"/>
      <!-- Wooden hull -->
      <path d="M -70 10 Q -40 32 0 32 Q 40 32 75 10 Q 30 18 -70 10 Z" fill="#78350f" stroke="#451a03" stroke-width="2.5"/>
      <line x1="-60" y1="12" x2="65" y2="12" stroke="#b45309" stroke-width="1.8"/>
      <!-- Mast & furled white sail -->
      <line x1="-5" y1="12" x2="-5" y2="-75" stroke="#3b2617" stroke-width="3"/>
      <path d="M -5 -70 Q 25 -35 -2 0" fill="none" stroke="#f1f5f9" stroke-width="8" stroke-linecap="round" opacity="0.9"/>
      <!-- Mooring rope to wooden post -->
      <rect x="75" y="0" width="8" height="28" rx="2" fill="#451a03"/>
      <path d="M 60 12 Q 72 8 76 10" fill="none" stroke="#ca8a04" stroke-width="2"/>

      <g class="prop-badge">
        <rect x="-48" y="-95" width="96" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#38bdf8" stroke-width="1.2"/>
        <text x="0" y="-81" text-anchor="middle" class="prop-badge-text">⛵ SAILBOAT</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 11: Secret Chamber (Under Cemetery)
 * Displays glowing sapphire bottle of magic elixir on stone altar (Obj 36).
 */
function renderRoom11(overlay, state, onAction) {
  if (state.objectLoc[36] === 11) {
    const g = createInteractiveGroup("Magic Elixir", () => onAction?.("get elixir"));
    placeProp(g, "translate(512, 650)");
    g.innerHTML += `
      <!-- Altar shadow -->
      <ellipse cx="0" cy="30" rx="60" ry="18" fill="rgba(0,0,0,0.6)" filter="url(#paperShadow)"/>
      <!-- Glowing sapphire crystal potion bottle -->
      <polygon points="-16,-20 16,-20 22,20 -22,20" fill="#0284c7" stroke="#38bdf8" stroke-width="2" filter="url(#saucerGlow)"/>
      <rect x="-8" y="-32" width="16" height="12" fill="#0369a1" stroke="#38bdf8" stroke-width="1.5"/>
      <polygon points="-6,-32 6,-32 4,-40 -4,-40" fill="#ca8a04"/>
      <!-- Swirling magical liquid inside -->
      <ellipse cx="0" cy="6" rx="14" ry="10" fill="#67e8f9" opacity="0.9"/>
      <circle cx="-4" cy="2" r="2.5" fill="#ffffff"/>
      <circle cx="5" cy="8" r="2" fill="#ffffff"/>

      <g class="prop-badge">
        <rect x="-52" y="-68" width="104" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#38bdf8" stroke-width="1.2"/>
        <text x="0" y="-53" text-anchor="middle" class="prop-badge-text">🧪 MAGIC ELIXIR</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 15: Willow Tree
 * Displays carved wooden warning sign on trunk.
 */
function renderRoom15(overlay, state, onAction) {
  const g = createInteractiveGroup("Wooden Warning Sign", () => onAction?.("read sign"));
  placeProp(g, "translate(450, 620) rotate(-4)");
  g.innerHTML += `
    <!-- Sign board nailed to tree trunk -->
    <rect x="-70" y="-35" width="140" height="70" rx="4" fill="url(#woodCrossGrad)" stroke="#1a0f08" stroke-width="2.2" filter="url(#paperShadow)"/>
    <circle cx="-55" cy="-22" r="3" fill="#475569"/>
    <circle cx="55" cy="-22" r="3" fill="#475569"/>
    <!-- Carved warning text lines -->
    <text x="0" y="-12" text-anchor="middle" fill="#fcd34d" font-size="9" font-weight="800" font-family="monospace">WARNING</text>
    <line x1="-50" y1="4" x2="50" y2="4" stroke="#a16207" stroke-width="1.5"/>
    <line x1="-44" y1="14" x2="44" y2="14" stroke="#a16207" stroke-width="1.5"/>
    <line x1="-36" y1="24" x2="36" y2="24" stroke="#a16207" stroke-width="1.5"/>

    <g class="prop-badge" transform="rotate(4)">
      <rect x="-42" y="-62" width="84" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#f59e0b" stroke-width="1"/>
      <text x="0" y="-48" text-anchor="middle" class="prop-badge-text">🪧 SIGN</text>
    </g>
  `;
  overlay.appendChild(propRoot(g));
}

/**
 * Room 20: Grim Shack
 * Displays braided clove of garlic hanging on wall (Obj 32).
 */
function renderRoom20(overlay, state, onAction) {
  if (state.objectLoc[32] === 20) {
    const g = createInteractiveGroup("Garlic Clove", () => onAction?.("get garlic"));
    placeProp(g, "translate(490, 520)");
    g.innerHTML += `
      <!-- Hanging hemp string -->
      <line x1="0" y1="-70" x2="0" y2="-22" stroke="#a16207" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="0" cy="-22" rx="5" ry="3" fill="#78350f"/>

      <!-- Braided garlic cluster shadow -->
      <ellipse cx="6" cy="10" rx="28" ry="32" fill="rgba(0,0,0,0.55)" filter="url(#paperShadow)"/>

      <!-- Plump garlic bulb with cloves and root filaments -->
      <ellipse cx="-8" cy="-2" rx="14" ry="18" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <ellipse cx="8" cy="-2" rx="14" ry="18" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <ellipse cx="0" cy="6" rx="18" ry="22" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.8" filter="url(#paperShadow)"/>
      <path d="M -6 -16 Q 0 -6 -6 24" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M 6 -16 Q 0 -6 6 24" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M 0 24 L -4 34 M 0 24 L 0 36 M 0 24 L 4 33" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/>

      <g class="prop-badge">
        <rect x="-48" y="-62" width="96" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#cbd5e1" stroke-width="1.2"/>
        <text x="0" y="-48" text-anchor="middle" class="prop-badge-text">🧄 GARLIC CLOVE</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 21: Log Cabin
 * Displays mounted elk antlers that rotate the secret wall (Noun 46).
 */
function renderRoom21(overlay, state, onAction) {
  const g = createInteractiveGroup("Mounted Elk Antlers", () => onAction?.("pull antlers"));
  placeProp(g, "translate(512, 380)");
  g.innerHTML += `
    <!-- Wall mount wooden plaque -->
    <ellipse cx="0" cy="10" rx="28" ry="36" fill="#3b2617" stroke="#78350f" stroke-width="3" filter="url(#paperShadow)"/>
    <ellipse cx="0" cy="10" rx="20" ry="28" fill="#5a3d28"/>
    <ellipse cx="0" cy="6" rx="12" ry="10" fill="#1c0f06"/>

    <!-- Left antler branched beam -->
    <path d="M -8 4 Q -35 -15 -55 -45 Q -65 -65 -85 -85 M -55 -45 Q -75 -40 -95 -45 M -40 -30 Q -60 -20 -75 -15" 
          fill="none" stroke="#fef3c7" stroke-width="6" stroke-linecap="round" filter="url(#paperShadow)"/>
    
    <!-- Right antler branched beam -->
    <path d="M 8 4 Q 35 -15 55 -45 Q 65 -65 85 -85 M 55 -45 Q 75 -40 95 -45 M 40 -30 Q 60 -20 75 -15" 
          fill="none" stroke="#fef3c7" stroke-width="6" stroke-linecap="round" filter="url(#paperShadow)"/>

    <g class="prop-badge">
      <rect x="-48" y="-115" width="96" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#fef3c7" stroke-width="1"/>
      <text x="0" y="-101" text-anchor="middle" class="prop-badge-text">🦌 ANTLERS</text>
    </g>
  `;
  overlay.appendChild(propRoot(g));
}

/**
 * Room 22: Secret Annex
 * Displays Wizard's Cloak (Obj 3), discovered Lock Pick (Obj 26), and Revolving Wall Mechanism.
 */
function renderRoom22(overlay, state, onAction) {
  // 1. Revolving Secret Wall mechanism (back to Room 21)
  const wallGroup = createInteractiveGroup("Revolving Secret Wall", () => onAction?.("pull antlers"));
  placeProp(wallGroup, "translate(180, 520)");
  wallGroup.innerHTML += `
    <!-- Stone wall seam & rotating pivot mechanism -->
    <path d="M 0 -150 L 0 160" stroke="#475569" stroke-width="3" stroke-dasharray="8,6" opacity="0.8"/>
    <!-- Iron bracket & lever -->
    <rect x="-10" y="-20" width="20" height="40" rx="4" fill="#1e293b" stroke="#64748b" stroke-width="1.5" filter="url(#paperShadow)"/>
    <circle cx="0" cy="0" r="6" fill="#ca8a04"/>
    <line x1="0" y1="0" x2="18" y2="-24" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="18" cy="-24" r="4.5" fill="#e2e8f0"/>

    <g class="prop-badge">
      <rect x="-68" y="-55" width="136" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#38bdf8" stroke-width="1.2"/>
      <text x="0" y="-40" text-anchor="middle" class="prop-badge-text">🔄 REVOLVING WALL</text>
    </g>
  `;
  overlay.appendChild(propRoot(wallGroup));

  // 2. Dusty Wizard's Cloak (Obj 3)
  if (state.objectLoc[3] === 22) {
    const g = createInteractiveGroup("Dusty Wizard's Cloak", () => onAction?.("get cloak"));
    placeProp(g, "translate(420, 520)");
    g.innerHTML += `
      <!-- Wall peg -->
      <rect x="-6" y="-120" width="12" height="18" rx="3" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
      <!-- Cloak body hanging -->
      <path d="M -15 -110 Q 0 -115 15 -110 Q 50 -30 65 90 Q 0 105 -65 90 Q -50 -30 -15 -110 Z" 
            fill="#1e1b4b" stroke="#312e81" stroke-width="3" filter="url(#paperShadow)"/>
      <path d="M -5 -110 Q 0 20 0 95" fill="none" stroke="#3730a3" stroke-width="2.5"/>
      <!-- Celestial golden stars & crescent runes on cloak -->
      <path d="M -25 -40 L -23 -34 L -17 -34 L -22 -30 L -20 -24 L -25 -28 L -30 -24 L -28 -30 L -33 -34 L -27 -34 Z" fill="#fbbf24"/>
      <path d="M 25 20 L 27 25 L 32 25 L 28 29 L 30 34 L 25 31 L 20 34 L 22 29 L 18 25 L 23 25 Z" fill="#fbbf24"/>
      <path d="M 18 -60 A 10 10 0 1 0 32 -48 A 8 8 0 1 1 18 -60" fill="#fde047"/>

      <g class="prop-badge">
        <rect x="-60" y="-148" width="120" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#6366f1" stroke-width="1.2"/>
        <text x="0" y="-133" text-anchor="middle" class="prop-badge-text">✨ WIZARD CLOAK</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }

  // 2. Lock Pick (Obj 26) - revealed after looking in cloak
  if (state.objectLoc[26] === 22) {
    const g = createInteractiveGroup("Slender Lock Pick", () => onAction?.("get pick"));
    placeProp(g, "translate(640, 720) rotate(20)");
    g.innerHTML += `
      <!-- Table surface shadow -->
      <ellipse cx="2" cy="8" rx="34" ry="8" fill="rgba(0,0,0,0.6)" filter="url(#paperShadow)"/>
      <!-- Slender tempered steel pick -->
      <rect x="-24" y="-3" width="48" height="6" rx="2" fill="url(#silverGrad)" stroke="#475569" stroke-width="1" filter="url(#goldGlint)"/>
      <path d="M 24 -3 L 34 -8 L 36 -6 L 27 2 Z" fill="url(#silverGrad)" stroke="#475569" stroke-width="1"/>
      <circle cx="-16" cy="0" r="2.5" fill="#0f172a"/>

      <g class="prop-badge" transform="rotate(-20)">
        <rect x="-44" y="-45" width="88" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#94a3b8" stroke-width="1.2"/>
        <text x="0" y="-31" text-anchor="middle" class="prop-badge-text">🗝️ LOCK PICK</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 24: Inside Frame House
 * Displays Loaf of Stale Bread on table (Obj 9).
 */
function renderRoom24(overlay, state, onAction) {
  if (state.objectLoc[9] === 24) {
    const g = createInteractiveGroup("Loaf of Stale Bread", () => onAction?.("get bread"));
    placeProp(g, "translate(512, 680)");
    g.innerHTML += `
      <!-- Table cutting board -->
      <ellipse cx="0" cy="20" rx="60" ry="24" fill="#3b2617" stroke="#5a3d28" stroke-width="2" filter="url(#paperShadow)"/>
      <!-- Crusty bread loaf -->
      <ellipse cx="0" cy="0" rx="42" ry="24" fill="#d97706" stroke="#92400e" stroke-width="2" filter="url(#paperShadow)"/>
      <ellipse cx="0" cy="-6" rx="32" ry="16" fill="#f59e0b"/>
      <!-- Baker's scoring slashes -->
      <line x1="-20" y1="-14" x2="-10" y2="4" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
      <line x1="-5" y1="-16" x2="5" y2="4" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
      <line x1="10" y1="-14" x2="20" y2="4" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>

      <g class="prop-badge">
        <rect x="-44" y="-55" width="88" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#d97706" stroke-width="1.2"/>
        <text x="0" y="-41" text-anchor="middle" class="prop-badge-text">🍞 STALE BREAD</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 25: House Attic
 * Displays antique Flintlock Pistol on floorboards (Obj 17).
 */
function renderRoom25(overlay, state, onAction) {
  if (state.objectLoc[17] === 25) {
    const g = createInteractiveGroup("Flintlock Pistol", () => onAction?.("get pistol"));
    placeProp(g, "translate(512, 720) rotate(-8)");
    g.innerHTML += `
      <!-- Shadow on attic floorboards -->
      <ellipse cx="0" cy="18" rx="60" ry="16" fill="rgba(0,0,0,0.6)" filter="url(#paperShadow)"/>
      <!-- Wooden pistol stock -->
      <path d="M -45 28 Q -20 15 0 8 L 45 4 L 45 -4 L -5 -6 Q -35 -8 -45 28 Z" fill="#451a03" stroke="#2a1005" stroke-width="2"/>
      <circle cx="-42" cy="24" r="8" fill="#ca8a04" stroke="#78350f" stroke-width="1.5"/>
      <!-- Steel barrel -->
      <rect x="0" y="-4" width="55" height="7" rx="2" fill="url(#silverGrad)" stroke="#475569" stroke-width="1.5"/>
      <!-- Brass side plate and flint cock mechanism -->
      <rect x="-12" y="-12" width="16" height="12" rx="2" fill="#ca8a04" stroke="#854d0e" stroke-width="1"/>
      <path d="M -8 -12 L -6 -22 L 2 -18" fill="none" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
      <path d="M -15 8 Q -8 20 0 10" fill="none" stroke="#ca8a04" stroke-width="2"/>

      <g class="prop-badge" transform="rotate(8)">
        <rect x="-50" y="-62" width="100" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#cbd5e1" stroke-width="1.2"/>
        <text x="0" y="-47" text-anchor="middle" class="prop-badge-text">🔫 FLINTLOCK</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 26: Sandy Field
 * Displays Sneering Goblin holding key (Obj 10) or tiny gleaming golden key (Obj 11) on the sand.
 */
function renderRoom26(overlay, state, onAction) {
  // 1. Sneering Goblin with key (Obj 10)
  if (state.objectLoc[10] === 26) {
    const g = createInteractiveGroup("Sneering Goblin with Key", () => onAction?.("say ijnid"));
    placeProp(g, "translate(512, 650)");
    g.innerHTML += `
      <!-- Sand shadow -->
      <ellipse cx="0" cy="85" rx="70" ry="24" fill="rgba(0,0,0,0.5)" filter="url(#paperShadow)"/>

      <!-- Goblin legs & feet -->
      <ellipse cx="-24" cy="72" rx="16" ry="10" fill="#451a03"/>
      <ellipse cx="24" cy="72" rx="16" ry="10" fill="#451a03"/>
      <polygon points="-30,45 -18,45 -22,70 -26,70" fill="#3f6212"/>
      <polygon points="18,45 30,45 26,70 22,70" fill="#3f6212"/>

      <!-- Tattered leather vest & goblin torso -->
      <polygon points="-28,15 28,15 32,50 -32,50" fill="#78350f" stroke="#451a03" stroke-width="2" filter="url(#paperShadow)"/>
      <polygon points="-12,15 12,15 8,45 -8,45" fill="#4d7c0f"/>

      <!-- Pointed goblin ears -->
      <polygon points="-25,-12 -65,-28 -32,-2" fill="#65a30d" stroke="#3f6212" stroke-width="1.5"/>
      <polygon points="25,-12 65,-28 32,-2" fill="#65a30d" stroke="#3f6212" stroke-width="1.5"/>

      <!-- Goblin head -->
      <ellipse cx="0" cy="-10" rx="28" ry="24" fill="#65a30d" stroke="#3f6212" stroke-width="2"/>
      <!-- Beady yellow squinting eyes -->
      <ellipse cx="-11" cy="-14" rx="5" ry="3" fill="#facc15"/>
      <circle cx="-11" cy="-14" r="1.8" fill="#000"/>
      <ellipse cx="11" cy="-14" rx="5" ry="3" fill="#facc15"/>
      <circle cx="11" cy="-14" r="1.8" fill="#000"/>
      <!-- Bulbous warty nose -->
      <circle cx="0" cy="-7" r="5" fill="#4d7c0f"/>

      <!-- Crooked sneering mouth with fangs -->
      <path d="M -16 2 Q 0 12 16 2" fill="#1e293b" stroke="#3f6212" stroke-width="2"/>
      <polygon points="-10,2 -7,8 -4,2" fill="#ffffff"/>
      <polygon points="4,2 7,8 10,2" fill="#ffffff"/>

      <!-- Left arm resting on hip -->
      <path d="M -26 22 Q -45 32 -30 46" fill="none" stroke="#65a30d" stroke-width="6" stroke-linecap="round"/>
      <!-- Right arm raised high twirling key -->
      <path d="M 26 22 Q 52 0 54 -28" fill="none" stroke="#65a30d" stroke-width="6" stroke-linecap="round"/>
      <circle cx="54" cy="-30" r="5" fill="#65a30d"/>

      <!-- Twirled tiny golden key with glint -->
      <g filter="url(#goldGlint)" transform="translate(58, -42) rotate(35)">
        <circle cx="0" cy="0" r="10" fill="url(#goldKeyGrad)" stroke="#78350f" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="5" fill="#65a30d"/>
        <rect x="8" y="-2.5" width="22" height="5" rx="1.5" fill="url(#goldKeyGrad)" stroke="#78350f" stroke-width="1.2"/>
        <rect x="22" y="2.5" width="3.5" height="6" fill="url(#goldKeyGrad)"/>
        <rect x="27" y="2.5" width="3.5" height="4" fill="url(#goldKeyGrad)"/>
        <polygon points="-8,-8 -5,-12 -2,-8 -5,-4" fill="#ffffff"/>
      </g>

      <g class="prop-badge">
        <rect x="-65" y="-72" width="130" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#65a30d" stroke-width="1.2"/>
        <text x="0" y="-57" text-anchor="middle" class="prop-badge-text">👺 SNEERING GOBLIN</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
    return;
  }

  // 2. Tiny gleaming key on sand (Obj 11)
  if (state.objectLoc[11] === 26) {
    const g = createInteractiveGroup("Tiny Gleaming Key", () => onAction?.("get key"));
    placeProp(g, "translate(512, 750) rotate(-24)");
    g.innerHTML += `
      <!-- Sand shadow -->
      <ellipse cx="4" cy="8" rx="26" ry="10" fill="rgba(0,0,0,0.5)" filter="url(#paperShadow)"/>

      <!-- Golden key bow & shaft -->
      <circle cx="-16" cy="0" r="14" fill="url(#goldKeyGrad)" stroke="#78350f" stroke-width="1.8" filter="url(#goldGlint)"/>
      <circle cx="-16" cy="0" r="7" fill="#451a03"/>
      <rect x="-4" y="-3.5" width="34" height="7" rx="2" fill="url(#goldKeyGrad)" stroke="#78350f" stroke-width="1.5" filter="url(#goldGlint)"/>
      <!-- Key teeth -->
      <rect x="18" y="3.5" width="5" height="10" fill="url(#goldKeyGrad)" stroke="#78350f" stroke-width="1.2"/>
      <rect x="25" y="3.5" width="5" height="7" fill="url(#goldKeyGrad)" stroke="#78350f" stroke-width="1.2"/>

      <!-- Sparkle stars -->
      <path d="M 32 -10 L 34 -5 L 39 -3 L 34 -1 L 32 4 L 30 -1 L 25 -3 L 30 -5 Z" fill="#fef08a" filter="url(#goldGlint)"/>
      <path d="M -30 -16 L -29 -12 L -25 -11 L -29 -10 L -30 -6 L -31 -10 L -35 -11 L -31 -12 Z" fill="#fef08a" filter="url(#goldGlint)"/>

      <g class="prop-badge" transform="rotate(24)">
        <rect x="-40" y="-55" width="80" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#f59e0b" stroke-width="1.2"/>
        <text x="0" y="-41" text-anchor="middle" class="prop-badge-text">🔑 TINY KEY</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 27: Castle Entrance
 * Displays smoking pile of werewolf ashes when WF flag is set.
 */
function renderRoom27(overlay, state, onAction) {
  if (state.flags.WF === 1) {
    const g = createInteractiveGroup("Pile of Werewolf Ashes", () => onAction?.("look ash"));
    placeProp(g, "translate(512, 750)");
    g.innerHTML += `
      <!-- Ash mound shadow -->
      <ellipse cx="0" cy="18" rx="80" ry="24" fill="rgba(0,0,0,0.6)" filter="url(#paperShadow)"/>
      <!-- Gray ash mound -->
      <ellipse cx="0" cy="0" rx="72" ry="20" fill="#27272a" stroke="#18181b" stroke-width="2"/>
      <ellipse cx="-15" cy="-4" rx="40" ry="14" fill="#3f3f46"/>
      <ellipse cx="20" cy="2" rx="35" ry="12" fill="#18181b"/>

      <!-- Smoldering red embers scattered in ash -->
      <circle cx="-30" cy="2" r="3" fill="#ef4444" filter="url(#runeGlow)" class="ember-particle"/>
      <circle cx="-10" cy="-6" r="2.5" fill="#f97316" filter="url(#runeGlow)"/>
      <circle cx="15" cy="-2" r="3" fill="#ef4444" filter="url(#runeGlow)" class="ember-particle"/>
      <circle cx="35" cy="4" r="2" fill="#f97316"/>

      <!-- Faint wisps of rising gray smoke -->
      <path d="M -15 -10 Q -25 -30 -15 -45 Q -5 -60 -15 -75" fill="none" stroke="#71717a" stroke-width="2.5" opacity="0.4" stroke-linecap="round"/>
      <path d="M 15 -8 Q 5 -25 20 -40 Q 30 -55 20 -70" fill="none" stroke="#94a3b8" stroke-width="2" opacity="0.35" stroke-linecap="round"/>

      <g class="prop-badge">
        <rect x="-65" y="-70" width="130" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#71717a" stroke-width="1.2"/>
        <text x="0" y="-55" text-anchor="middle" class="prop-badge-text">⚱️ WEREWOLF ASHES</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 29: East Parlor
 * Displays sticky ribbon of flypaper hanging from ceiling (Obj 31).
 */
function renderRoom29(overlay, state, onAction) {
  if (state.objectLoc[31] === 29) {
    const g = createInteractiveGroup("Piece of Flypaper", () => onAction?.("get flypaper"));
    placeProp(g, "translate(660, 480)");
    g.innerHTML += `
      <!-- Ceiling thumbtack -->
      <circle cx="0" cy="-80" r="4" fill="#b91c1c" stroke="#450a0a" stroke-width="1"/>
      <!-- Sticky amber coiled fly ribbon -->
      <path d="M 0 -80 Q 12 -40 -8 0 Q 15 40 -6 80 Q 8 110 0 130" fill="none" stroke="#d97706" stroke-width="10" stroke-linecap="round" opacity="0.85" filter="url(#paperShadow)"/>
      <path d="M 0 -80 Q 12 -40 -8 0 Q 15 40 -6 80 Q 8 110 0 130" fill="none" stroke="#fde68a" stroke-width="6" stroke-linecap="round" opacity="0.6"/>
      <!-- Trapped fly specks -->
      <circle cx="-3" cy="-20" r="2.5" fill="#000"/>
      <circle cx="5" cy="25" r="2" fill="#000"/>
      <circle cx="-2" cy="70" r="2.5" fill="#000"/>

      <g class="prop-badge">
        <rect x="-50" y="-115" width="100" height="20" rx="10" fill="rgba(6, 9, 18, 0.9)" stroke="#d97706" stroke-width="1"/>
        <text x="0" y="-101" text-anchor="middle" class="prop-badge-text">🪰 FLYPAPER</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 30: Grand Chamber
 * Displays smoldering vampire embers when VR flag is set.
 */
function renderRoom30(overlay, state, onAction) {
  if (state.flags.VR === 1) {
    const g = createInteractiveGroup("Smoldering Vampire Embers", () => onAction?.("look embers"));
    placeProp(g, "translate(512, 740)");
    g.innerHTML += `
      <!-- Scorch mark on floor -->
      <ellipse cx="0" cy="18" rx="85" ry="26" fill="rgba(0,0,0,0.65)" filter="url(#paperShadow)"/>
      <ellipse cx="0" cy="0" rx="78" ry="22" fill="#450a0a" stroke="#7f1d1d" stroke-width="2" filter="url(#emberGlow)"/>

      <!-- Burnt cloak shreds -->
      <polygon points="-50,5 -35,-15 -20,10" fill="#09090b" stroke="#18181b"/>
      <polygon points="25,8 45,-12 38,12" fill="#09090b" stroke="#18181b"/>

      <!-- Glowing burning dust and fiery embers -->
      <ellipse cx="0" cy="-2" rx="45" ry="14" fill="#991b1b" opacity="0.85"/>
      <circle cx="-25" cy="-2" r="3.5" fill="#f97316" filter="url(#runeGlow)" class="ember-particle"/>
      <circle cx="-5" cy="4" r="4" fill="#ef4444" filter="url(#runeGlow)"/>
      <circle cx="10" cy="-4" r="3.5" fill="#fbbf24" filter="url(#runeGlow)" class="ember-particle"/>
      <circle cx="28" cy="2" r="3" fill="#f97316" filter="url(#runeGlow)"/>

      <!-- Rising crimson sparks and smoke -->
      <path d="M 0 -12 Q -15 -35 0 -55 Q 10 -75 0 -95" fill="none" stroke="#ef4444" stroke-width="2" opacity="0.5" stroke-linecap="round"/>
      <circle cx="-8" cy="-40" r="1.5" fill="#fde047" opacity="0.8"/>
      <circle cx="12" cy="-60" r="1.5" fill="#fde047" opacity="0.7"/>

      <g class="prop-badge">
        <rect x="-65" y="-75" width="130" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#ef4444" stroke-width="1.2"/>
        <text x="0" y="-60" text-anchor="middle" class="prop-badge-text">🔥 VAMPIRE EMBERS</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 35: Royal Treasure Vault
 * Displays treasure coffer: closed vs open with gold coins & shiny gemstone ring.
 */
function renderRoom35(overlay, state, onAction) {
  const isOpen = state.objectLoc[4] === 35;
  const hasRing = state.objectLoc[5] === 35;

  const g = createInteractiveGroup(
    isOpen ? (hasRing ? "Open Coffer with Shiny Ring" : "Open Coffer") : "Locked Treasure Coffer",
    () => onAction?.(isOpen ? (hasRing ? "get ring" : "look coffer") : "open coffer"),
  );
  placeProp(g, "translate(512, 720)");

  if (isOpen) {
    g.innerHTML += `
      <!-- Open coffer chest base -->
      <rect x="-90" y="-10" width="180" height="85" rx="6" fill="#3b2617" stroke="#b45309" stroke-width="3" filter="url(#paperShadow)"/>
      
      <!-- Open lid tilted upward -->
      <polygon points="-94,-10 94,-10 80,-65 -80,-65" fill="#451a03" stroke="#b45309" stroke-width="2.5"/>
      <rect x="-82" y="-62" width="164" height="48" fill="#1c0f06"/>

      <!-- Mound of glowing gold coins -->
      <ellipse cx="0" cy="18" rx="72" ry="24" fill="#eab308" stroke="#713f12" stroke-width="1.5"/>
      <circle cx="-35" cy="12" r="7" fill="#facc15" stroke="#713f12" stroke-width="1"/>
      <circle cx="-15" cy="8" r="8" fill="#fef08a" stroke="#713f12" stroke-width="1"/>
      <circle cx="20" cy="14" r="7" fill="#facc15" stroke="#713f12" stroke-width="1"/>
      <circle cx="38" cy="18" r="8" fill="#fef08a" stroke="#713f12" stroke-width="1"/>

      ${
        hasRing
          ? `
        <!-- Shiny Ring resting on top of gold -->
        <g filter="url(#goldGlint)" transform="translate(0, 4)">
          <ellipse cx="0" cy="0" rx="14" ry="9" fill="none" stroke="#fef08a" stroke-width="3.5"/>
          <!-- Gemstone sparkle -->
          <polygon points="0,-12 6,-6 0,0 -6,-6" fill="#38bdf8" stroke="#ffffff" stroke-width="1"/>
          <circle cx="0" cy="-6" r="3" fill="#ffffff"/>
        </g>
        <g class="prop-badge">
          <rect x="-50" y="-95" width="100" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#38bdf8" stroke-width="1.2"/>
          <text x="0" y="-80" text-anchor="middle" class="prop-badge-text">💍 SHINY RING</text>
        </g>
      `
          : `
        <g class="prop-badge">
          <rect x="-56" y="-95" width="112" height="22" rx="11" fill="rgba(6, 9, 18, 0.9)" stroke="#eab308" stroke-width="1.2"/>
          <text x="0" y="-80" text-anchor="middle" class="prop-badge-text">🪙 OPEN COFFER</text>
        </g>
      `
      }
    `;
  } else {
    // Closed coffer
    g.innerHTML += `
      <rect x="-85" y="-30" width="170" height="90" rx="8" fill="#3b2617" stroke="#78350f" stroke-width="3" filter="url(#paperShadow)"/>
      <rect x="-85" y="-12" width="170" height="8" fill="#b45309"/>
      <!-- Iron bands -->
      <line x1="-50" y1="-30" x2="-50" y2="60" stroke="#71717a" stroke-width="4"/>
      <line x1="50" y1="-30" x2="50" y2="60" stroke="#71717a" stroke-width="4"/>
      <!-- Lock clasp -->
      <rect x="-14" y="-8" width="28" height="22" rx="3" fill="#ca8a04" stroke="#713f12" stroke-width="1.5"/>

      <g class="prop-badge">
        <rect x="-56" y="-62" width="112" height="22" rx="11" fill="rgba(6, 9, 18, 0.9)" stroke="#ca8a04" stroke-width="1.2"/>
        <text x="0" y="-47" text-anchor="middle" class="prop-badge-text">📦 COFFER</text>
      </g>
    `;
  }
  overlay.appendChild(propRoot(g));
}

/**
 * Room 37: Moonlit Tower
 * Tangled vines, sarcophagus, sleeping Sabrina, or wide awake Princess Sabrina!
 */
function renderRoom37(overlay, state, onAction) {
  // 1. Tangled Creeping Vines covering alcove (Obj 14)
  if (state.objectLoc[14] === 37) {
    const g = createInteractiveGroup("Tangled Vines", () => onAction?.("pull vines"));
    placeProp(g, "translate(512, 540)");
    g.innerHTML += `
      <!-- Dark backdrop shadow behind thick vine curtain -->
      <rect x="-240" y="-180" width="480" height="340" fill="rgba(6, 12, 8, 0.65)" filter="url(#paperShadow)"/>

      <!-- Main gnarled hanging vine trunks -->
      <path d="M -180 -180 Q -150 -50 -170 50 Q -180 120 -150 160" fill="none" stroke="#14532d" stroke-width="12" stroke-linecap="round"/>
      <path d="M -90 -180 Q -110 -70 -70 20 Q -40 100 -70 160" fill="none" stroke="#166534" stroke-width="14" stroke-linecap="round"/>
      <path d="M 0 -180 Q 30 -90 -10 10 Q -30 90 10 160" fill="none" stroke="#14532d" stroke-width="16" stroke-linecap="round"/>
      <path d="M 90 -180 Q 70 -80 110 30 Q 130 110 90 160" fill="none" stroke="#166534" stroke-width="14" stroke-linecap="round"/>
      <path d="M 180 -180 Q 150 -60 170 40 Q 190 120 160 160" fill="none" stroke="#14532d" stroke-width="12" stroke-linecap="round"/>

      <!-- Cross intertwining branches -->
      <path d="M -220 -80 Q -90 -40 30 -90 Q 140 -120 220 -60" fill="none" stroke="#15803d" stroke-width="9" stroke-linecap="round"/>
      <path d="M -200 40 Q -80 80 20 30 Q 120 0 210 50" fill="none" stroke="#15803d" stroke-width="10" stroke-linecap="round"/>
      <path d="M -140 -140 Q 0 -60 140 -130" fill="none" stroke="#166534" stroke-width="8" stroke-linecap="round"/>

      <!-- Sharp bramble thorns -->
      <polygon points="-160,-20 -178,-25 -162,-15" fill="#14532d"/>
      <polygon points="-80,60 -98,68 -82,72" fill="#14532d"/>
      <polygon points="20,-30 38,-38 22,-24" fill="#14532d"/>
      <polygon points="100,70 118,78 102,82" fill="#14532d"/>
      <polygon points="160,-10 178,-16 162,-5" fill="#14532d"/>

      <!-- Ivy leaf clusters -->
      <ellipse cx="-120" cy="-60" rx="14" ry="9" fill="#22c55e" transform="rotate(-25 -120 -60)"/>
      <ellipse cx="-50" cy="20" rx="16" ry="10" fill="#4ade80" transform="rotate(35 -50 20)"/>
      <ellipse cx="40" cy="-80" rx="15" ry="9" fill="#22c55e" transform="rotate(-15 40 -80)"/>
      <ellipse cx="120" cy="40" rx="16" ry="10" fill="#4ade80" transform="rotate(40 120 40)"/>
      <ellipse cx="-20" cy="110" rx="14" ry="9" fill="#16a34a" transform="rotate(-30 -20 110)"/>

      <g class="prop-badge">
        <rect x="-65" y="-95" width="130" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#22c55e" stroke-width="1.2"/>
        <text x="0" y="-80" text-anchor="middle" class="prop-badge-text">🌿 TANGLED VINES</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
    return;
  }

  // 2. Wide awake Princess Sabrina (Obj 38)
  if (state.objectLoc[38] === 37) {
    const g = createInteractiveGroup("Princess Sabrina (Awake)", () => onAction?.("talk princess"));
    placeProp(g, "translate(512, 600)");
    g.innerHTML += `
      <!-- Aura of liberation -->
      <ellipse cx="0" cy="40" rx="90" ry="130" fill="none" stroke="#f472b6" stroke-width="2.5" opacity="0.7" filter="url(#saucerGlow)"/>

      <!-- Royal gown -->
      <polygon points="-40,140 40,140 22,20 -22,20" fill="#f43f5e" stroke="#fda4af" stroke-width="2" filter="url(#paperShadow)"/>
      <polygon points="-28,140 28,140 14,35 -14,35" fill="#fb7185"/>

      <!-- Bodice & golden belt -->
      <rect x="-18" y="10" width="36" height="30" rx="4" fill="#e11d48"/>
      <line x1="-20" y1="38" x2="20" y2="38" stroke="#fbbf24" stroke-width="4"/>

      <!-- Sabrina's face & golden tiara -->
      <circle cx="0" cy="-10" r="18" fill="#fde047" opacity="0.3"/>
      <circle cx="0" cy="-10" r="16" fill="#fed7aa" stroke="#7c2d12" stroke-width="1.5"/>
      <circle cx="-5" cy="-12" r="2" fill="#0f172a"/>
      <circle cx="5" cy="-12" r="2" fill="#0f172a"/>
      <path d="M -5 -4 Q 0 -1 5 -4" fill="none" stroke="#b91c1c" stroke-width="1.8"/>

      <!-- Golden hair -->
      <path d="M -16 -12 Q -22 15 -14 45" fill="none" stroke="#eab308" stroke-width="6" stroke-linecap="round"/>
      <path d="M 16 -12 Q 22 15 14 45" fill="none" stroke="#eab308" stroke-width="6" stroke-linecap="round"/>
      <polygon points="-12,-22 0,-30 12,-22 8,-18 -8,-18" fill="#facc15" stroke="#78350f" stroke-width="1"/>

      <g class="prop-badge">
        <rect x="-64" y="-60" width="128" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#f43f5e" stroke-width="1.2"/>
        <text x="0" y="-45" text-anchor="middle" class="prop-badge-text">👸 PRINCESS SABRINA</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
    return;
  }

  // 2. Sleeping Damsel in blasted sarcophagus (Obj 16)
  if (state.objectLoc[16] === 37) {
    const g = createInteractiveGroup("Sleeping Princess Sabrina", () => onAction?.("wake damsel"));
    placeProp(g, "translate(512, 700)");
    g.innerHTML += `
      <!-- Blasted stone sarcophagus base -->
      <rect x="-130" y="-30" width="260" height="85" rx="8" fill="#27272a" stroke="#71717a" stroke-width="3" filter="url(#paperShadow)"/>
      <rect x="-115" y="-20" width="230" height="65" fill="#3f3f46"/>

      <!-- Silk cushion & sleeping Sabrina -->
      <rect x="-95" y="-12" width="190" height="45" rx="6" fill="#881337"/>
      <circle cx="-55" cy="8" r="14" fill="#fed7aa"/>
      <path d="M -68 0 Q -50 0 -40 20" fill="none" stroke="#facc15" stroke-width="5"/>
      <rect x="-40" y="-4" width="120" height="32" rx="6" fill="#fda4af" opacity="0.9"/>

      <g class="prop-badge">
        <rect x="-65" y="-65" width="130" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#fda4af" stroke-width="1.2"/>
        <text x="0" y="-50" text-anchor="middle" class="prop-badge-text">💤 SLEEPING PRINCESS</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
    return;
  }

  // 3. Sealed Stone Sarcophagus (Obj 15)
  if (state.objectLoc[15] === 37) {
    const g = createInteractiveGroup("Sealed Stone Sarcophagus", () => onAction?.("open sarcophagus"));
    placeProp(g, "translate(512, 700)");
    g.innerHTML += `
      <rect x="-130" y="-40" width="260" height="95" rx="10" fill="#27272a" stroke="#52525b" stroke-width="3" filter="url(#paperShadow)"/>
      <rect x="-120" y="-32" width="240" height="22" fill="#3f3f46" stroke="#71717a" stroke-width="1.5"/>
      <!-- Carved royal relief on lid -->
      <ellipse cx="0" cy="12" rx="70" ry="24" fill="none" stroke="#71717a" stroke-width="2"/>
      <line x1="-100" y1="12" x2="100" y2="12" stroke="#52525b" stroke-width="2"/>

      <g class="prop-badge">
        <rect x="-70" y="-72" width="140" height="22" rx="11" fill="rgba(6, 9, 18, 0.9)" stroke="#a1a1aa" stroke-width="1.2"/>
        <text x="0" y="-57" text-anchor="middle" class="prop-badge-text">⚰️ STONE SARCOPHAGUS</text>
      </g>
    `;
    overlay.appendChild(propRoot(g));
  }
}

/**
 * Room 38: Inside Broken Wagon
 * Closed coffin vs open coffin revealing rotting corpse and silver bullet!
 */
function renderRoom38(overlay, state, onAction) {
  const isOpen = state.objectLoc[19] === 38;
  const hasBullet = state.objectLoc[22] === 38;

  const g = createInteractiveGroup(
    isOpen ? "Open Wooden Coffin" : "Closed Wooden Coffin",
    () => onAction?.(isOpen ? (hasBullet ? "get bullet" : "look coffin") : "open coffin"),
  );
  placeProp(g, "translate(512, 700)");

  if (isOpen) {
    g.innerHTML += `
      <!-- Open coffin base -->
      <polygon points="-120,-35 120,-35 90,60 -90,60" fill="#18181b" stroke="#3f3f46" stroke-width="3" filter="url(#paperShadow)"/>
      <polygon points="-110,-28 110,-28 82,52 -82,52" fill="#09090b"/>

      <!-- Rotting corpse silhouette -->
      <g opacity="0.85">
        <circle cx="-55" cy="8" r="14" fill="#a1a1aa" stroke="#52525b" stroke-width="1.5"/>
        <rect x="-35" y="-2" width="95" height="24" rx="4" fill="#3f3f46"/>
        <!-- Skeletal rib lines -->
        <line x1="-25" y1="2" x2="-25" y2="18" stroke="#d4d4d8" stroke-width="1.5"/>
        <line x1="-12" y1="2" x2="-12" y2="18" stroke="#d4d4d8" stroke-width="1.5"/>
        <line x1="2" y1="2" x2="2" y2="18" stroke="#d4d4d8" stroke-width="1.5"/>
      </g>

      <!-- Coffin lid thrown aside -->
      <polygon points="60,-75 140,-5 120,40 40,-30" fill="#3b2617" stroke="#1c0f06" stroke-width="2.5" opacity="0.95"/>

      ${
        hasBullet
          ? `
        <!-- Gleaming Silver Bullet -->
        <g filter="url(#goldGlint)" transform="translate(48, 20) rotate(-15)">
          <rect x="-8" y="-4" width="18" height="8" rx="2" fill="url(#silverGrad)" stroke="#cbd5e1" stroke-width="1"/>
          <path d="M 10 -4 Q 16 0 10 4 Z" fill="url(#silverGrad)"/>
        </g>
        <g class="prop-badge">
          <rect x="-56" y="-85" width="112" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#38bdf8" stroke-width="1.2"/>
          <text x="0" y="-70" text-anchor="middle" class="prop-badge-text">🥈 SILVER BULLET</text>
        </g>
      `
          : `
        <g class="prop-badge">
          <rect x="-54" y="-85" width="108" height="22" rx="11" fill="rgba(6, 9, 18, 0.9)" stroke="#71717a" stroke-width="1.2"/>
          <text x="0" y="-70" text-anchor="middle" class="prop-badge-text">⚰️ OPEN COFFIN</text>
        </g>
      `
      }
    `;
  } else {
    // Closed coffin
    g.innerHTML += `
      <polygon points="-120,-35 120,-35 90,60 -90,60" fill="#3b2617" stroke="#23140a" stroke-width="3.5" filter="url(#paperShadow)"/>
      <polygon points="-108,-28 108,-28 80,50 -80,50" fill="#451a03" stroke="#23140a" stroke-width="1.5"/>
      <!-- Cross carving on lid -->
      <rect x="-6" y="-12" width="12" height="42" rx="2" fill="#23140a"/>
      <rect x="-18" y="-4" width="36" height="10" rx="2" fill="#23140a"/>

      <g class="prop-badge">
        <rect x="-56" y="-68" width="112" height="22" rx="11" fill="rgba(6, 9, 18, 0.9)" stroke="#b45309" stroke-width="1.2"/>
        <text x="0" y="-53" text-anchor="middle" class="prop-badge-text">⚰️ CLOSED COFFIN</text>
      </g>
    `;
  }
  overlay.appendChild(propRoot(g));
}

/**
 * Dynamic Actor: Ravenous Mice (Obj 20)
 * Scurries across rooms 2, 17, 3, 19, 38.
 */
function renderRavenousMice(overlay, state, onAction) {
  const g = createInteractiveGroup("Ravenous Mice", () => onAction?.("look mice"));
  placeProp(g, "translate(512, 820)");
  g.innerHTML += `
    <!-- Mouse 1: Left mouse facing right -->
    <g transform="translate(-65, 0)">
      <ellipse cx="0" cy="12" rx="22" ry="7" fill="rgba(0,0,0,0.4)" filter="url(#paperShadow)"/>
      <ellipse cx="0" cy="5" rx="20" ry="11" fill="#64748b" stroke="#334155" stroke-width="1.2"/>
      <ellipse cx="16" cy="2" rx="8" ry="6" fill="#64748b"/>
      <circle cx="21" cy="0" r="2" fill="#0f172a"/>
      <!-- Pink ear -->
      <circle cx="10" cy="-3" r="4.5" fill="#fda4af" stroke="#e2e8f0" stroke-width="0.8"/>
      <!-- Long curving pink tail -->
      <path d="M -18 7 Q -32 5 -38 -8 Q -42 -18 -36 -24" fill="none" stroke="#f472b6" stroke-width="2.2" stroke-linecap="round"/>
      <!-- Whiskers -->
      <line x1="20" y1="2" x2="30" y2="-2" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="20" y1="4" x2="29" y2="7" stroke="#cbd5e1" stroke-width="1"/>
    </g>

    <!-- Mouse 2: Center mouse sniffing upward -->
    <g transform="translate(0, -10)">
      <ellipse cx="0" cy="14" rx="18" ry="6" fill="rgba(0,0,0,0.4)" filter="url(#paperShadow)"/>
      <ellipse cx="0" cy="4" rx="16" ry="12" fill="#475569" stroke="#1e293b" stroke-width="1.2"/>
      <ellipse cx="2" cy="-6" rx="9" ry="7" fill="#475569"/>
      <circle cx="2" cy="-11" r="2.5" fill="#ef4444"/>
      <!-- Pink ears -->
      <circle cx="-5" cy="-9" r="4" fill="#fda4af"/>
      <circle cx="8" cy="-9" r="4" fill="#fda4af"/>
      <!-- Tail -->
      <path d="M -12 10 Q -24 16 -30 8 Q -34 0 -28 -6" fill="none" stroke="#f472b6" stroke-width="2" stroke-linecap="round"/>
    </g>

    <!-- Mouse 3: Right mouse darting forward -->
    <g transform="translate(60, 5)">
      <ellipse cx="0" cy="10" rx="20" ry="6" fill="rgba(0,0,0,0.4)" filter="url(#paperShadow)"/>
      <ellipse cx="0" cy="4" rx="18" ry="9" fill="#64748b" stroke="#334155" stroke-width="1.2"/>
      <ellipse cx="14" cy="2" rx="7" ry="5" fill="#64748b"/>
      <circle cx="18" cy="1" r="1.8" fill="#0f172a"/>
      <circle cx="9" cy="-2" r="4" fill="#fda4af"/>
      <path d="M -16 6 Q -28 8 -34 2 Q -38 -6 -32 -12" fill="none" stroke="#f472b6" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="17" y1="2" x2="26" y2="0" stroke="#cbd5e1" stroke-width="1"/>
    </g>

    <g class="prop-badge">
      <rect x="-60" y="-45" width="120" height="22" rx="11" fill="rgba(6, 9, 18, 0.95)" stroke="#94a3b8" stroke-width="1.2"/>
      <text x="0" y="-30" text-anchor="middle" class="prop-badge-text">🐀 RAVENOUS MICE</text>
    </g>
  `;
  overlay.appendChild(propRoot(g));
}

/**
 * Dynamic Actor: Snarling Werewolf (Obj 34)
 */
function renderWerewolf(overlay, state, onAction) {
  const g = createInteractiveGroup("Snarling Werewolf", () => onAction?.("shoot werewolf"));
  placeProp(g, "translate(512, 570)");
  g.innerHTML += `
    <!-- Menacing dark shadow -->
    <ellipse cx="0" cy="170" rx="110" ry="35" fill="rgba(0,0,0,0.75)" filter="url(#paperShadow)"/>

    <!-- Red beast threat aura -->
    <ellipse cx="0" cy="50" rx="120" ry="150" fill="none" stroke="#dc2626" stroke-width="3" opacity="0.6" filter="url(#bloodGlow)"/>

    <!-- Massive muscular legs & clawed feet -->
    <path d="M -70 90 L -50 165 L -25 168 L -40 95 Z" fill="#26180f" stroke="#170d06" stroke-width="2"/>
    <path d="M 70 90 L 50 165 L 25 168 L 40 95 Z" fill="#26180f" stroke="#170d06" stroke-width="2"/>
    <!-- Claws on toes -->
    <line x1="-50" y1="168" x2="-55" y2="176" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>
    <line x1="-38" y1="168" x2="-40" y2="178" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>
    <line x1="50" y1="168" x2="55" y2="176" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>
    <line x1="38" y1="168" x2="40" y2="178" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>

    <!-- Hunched muscular werewolf torso & dark shaggy fur -->
    <polygon points="-85,15 -45,100 45,100 85,15 50,-40 -50,-40" fill="#3b2617" stroke="#1a0f08" stroke-width="3" filter="url(#paperShadow)"/>
    <polygon points="-40,15 -25,80 25,80 40,15 25,-25 -25,-25" fill="#451a03"/>

    <!-- Left arm raised with outstretched talons -->
    <path d="M -70 -20 Q -120 10 -105 50" fill="none" stroke="#3b2617" stroke-width="24" stroke-linecap="round"/>
    <path d="M -105 50 L -120 62 M -105 50 L -115 72 M -105 50 L -100 75" stroke="#f1f5f9" stroke-width="3.5" stroke-linecap="round"/>

    <!-- Right arm raised ready to strike -->
    <path d="M 70 -20 Q 120 10 105 50" fill="none" stroke="#3b2617" stroke-width="24" stroke-linecap="round"/>
    <path d="M 105 50 L 120 62 M 105 50 L 115 72 M 105 50 L 100 75" stroke="#f1f5f9" stroke-width="3.5" stroke-linecap="round"/>

    <!-- Werewolf head & pointed ears -->
    <polygon points="-35,-55 -55,-105 -20,-75" fill="#26180f" stroke="#170d06" stroke-width="2"/>
    <polygon points="35,-55 55,-105 20,-75" fill="#26180f" stroke="#170d06" stroke-width="2"/>
    <circle cx="0" cy="-55" r="38" fill="#3b2617" stroke="#1a0f08" stroke-width="2"/>

    <!-- Snarling wolf muzzle with bared fangs -->
    <polygon points="-22,-50 0,-20 22,-50" fill="#1c1008"/>
    <!-- Glowing blood-red feral eyes -->
    <ellipse cx="-16" cy="-62" rx="7" ry="4.5" fill="#ef4444" filter="url(#runeGlow)"/>
    <ellipse cx="16" cy="-62" rx="7" ry="4.5" fill="#ef4444" filter="url(#runeGlow)"/>
    <circle cx="-16" cy="-62" r="2.5" fill="#7f1d1d"/>
    <circle cx="16" cy="-62" r="2.5" fill="#7f1d1d"/>

    <!-- Open snarling jaws with fangs -->
    <path d="M -16 -40 Q 0 -30 16 -40 Q 0 -15 -16 -40 Z" fill="#7f1d1d"/>
    <!-- Top fangs -->
    <polygon points="-14,-40 -11,-30 -8,-40" fill="#ffffff"/>
    <polygon points="8,-40 11,-30 14,-40" fill="#ffffff"/>
    <!-- Bottom fangs -->
    <polygon points="-10,-24 -7,-32 -4,-24" fill="#ffffff"/>
    <polygon points="4,-24 7,-32 10,-24" fill="#ffffff"/>

    <g class="prop-badge">
      <rect x="-70" y="-125" width="140" height="24" rx="12" fill="rgba(6, 9, 18, 0.95)" stroke="#ef4444" stroke-width="1.4"/>
      <text x="0" y="-109" text-anchor="middle" class="prop-badge-text">🐺 SNARLING WEREWOLF</text>
    </g>
  `;
  overlay.appendChild(propRoot(g));
}

/**
 * Dynamic Actor: Lethal Vampire Lord (Obj 39)
 */
function renderVampire(overlay, state, onAction) {
  const g = createInteractiveGroup("Lethal Vampire", () => onAction?.("wave cross"));
  placeProp(g, "translate(512, 560)");
  g.innerHTML += `
    <!-- Shadow -->
    <ellipse cx="0" cy="180" rx="90" ry="30" fill="rgba(0,0,0,0.8)" filter="url(#paperShadow)"/>

    <!-- Hypnotic supernatural aura -->
    <ellipse cx="0" cy="50" rx="100" ry="145" fill="none" stroke="#991b1b" stroke-width="2.5" opacity="0.65" filter="url(#bloodGlow)"/>

    <!-- Sweeping black cloak with deep crimson silk lining -->
    <path d="M -35 -50 Q -110 50 -85 175 Q 0 190 85 175 Q 110 50 35 -50 Z" fill="#09090b" stroke="#18181b" stroke-width="3" filter="url(#paperShadow)"/>
    <!-- Crimson inner lining revealed as cloak flutters open -->
    <path d="M -25 -25 Q -65 60 -45 165 L 0 170 L 45 165 Q 65 60 25 -25 Z" fill="#881337" stroke="#4c0519" stroke-width="1.5"/>

    <!-- High dramatic standing collar -->
    <polygon points="-40,-50 -60,-100 -20,-60" fill="#09090b" stroke="#4c0519" stroke-width="2"/>
    <polygon points="-36,-50 -52,-92 -20,-60" fill="#991b1b"/>
    <polygon points="40,-50 60,-100 20,-60" fill="#09090b" stroke="#4c0519" stroke-width="2"/>
    <polygon points="36,-50 52,-92 20,-60" fill="#991b1b"/>

    <!-- Aristocratic vest & silk cravat -->
    <polygon points="-22,-20 22,-20 18,80 -18,80" fill="#18181b"/>
    <polygon points="-12,-20 0,10 12,-20 0,-10" fill="#f8fafc"/>
    <circle cx="0" cy="-2" r="3" fill="#dc2626"/>

    <!-- Pale vampire head -->
    <circle cx="0" cy="-55" r="22" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>

    <!-- Slick black widow's peak hair -->
    <path d="M -22 -58 Q 0 -85 22 -58 Q 18 -75 0 -68 Q -18 -75 -22 -58 Z" fill="#020617"/>
    <polygon points="-6,-64 0,-56 6,-64" fill="#020617"/>

    <!-- Piercing red eyes -->
    <ellipse cx="-8" cy="-55" rx="4" ry="2.5" fill="#dc2626"/>
    <circle cx="-8" cy="-55" r="1.2" fill="#000000"/>
    <ellipse cx="8" cy="-55" rx="4" ry="2.5" fill="#dc2626"/>
    <circle cx="8" cy="-55" r="1.2" fill="#000000"/>

    <!-- Sneering fanged mouth -->
    <path d="M -8 -44 Q 0 -41 8 -44" fill="none" stroke="#4c0519" stroke-width="1.8"/>
    <polygon points="-6,-44 -4,-37 -2,-44" fill="#ffffff"/>
    <polygon points="2,-44 4,-37 6,-44" fill="#ffffff"/>

    <!-- Clawed pale hands protruding from sleeves -->
    <circle cx="-50" cy="55" r="9" fill="#f1f5f9"/>
    <circle cx="50" cy="55" r="9" fill="#f1f5f9"/>

    <g class="prop-badge">
      <rect x="-65" y="-120" width="130" height="24" rx="12" fill="rgba(6, 9, 18, 0.95)" stroke="#dc2626" stroke-width="1.4"/>
      <text x="0" y="-104" text-anchor="middle" class="prop-badge-text">🧛 VAMPIRE LORD</text>
    </g>
  `;
  overlay.appendChild(propRoot(g));
}

/**
 * Primary dispatcher to render dynamic vector overlays on top of the scene art.
 * @param {SVGSVGElement} svg
 * @param {object} params
 * @param {number} params.roomId
 * @param {import("../engine/state.js").GameState} params.state
 * @param {ReturnType<typeof import("../engine/world.js").createWorld>} params.world
 * @param {(cmd: string) => void} [params.onAction]
 */
export function updateSceneOverlay(svg, { roomId, state, world, onAction }) {
  if (!svg) return;
  svg.innerHTML = OVERLAY_DEFS;

  switch (roomId) {
    case 1:
      renderRoom1(svg, state, onAction);
      break;
    case 3:
      renderRoom3(svg, state, onAction);
      break;
    case 4:
      renderRoom4(svg, state, onAction);
      break;
    case 5:
      renderRoom5(svg, state, onAction);
      break;
    case 7:
      renderRoom7(svg, state, onAction);
      break;
    case 9:
      renderRoom9(svg, state, onAction);
      break;
    case 10:
      renderRoom10(svg, state, onAction);
      break;
    case 11:
      renderRoom11(svg, state, onAction);
      break;
    case 15:
      renderRoom15(svg, state, onAction);
      break;
    case 16:
      renderRoom16(svg, state, onAction);
      break;
    case 20:
      renderRoom20(svg, state, onAction);
      break;
    case 21:
      renderRoom21(svg, state, onAction);
      break;
    case 22:
      renderRoom22(svg, state, onAction);
      break;
    case 24:
      renderRoom24(svg, state, onAction);
      break;
    case 25:
      renderRoom25(svg, state, onAction);
      break;
    case 26:
      renderRoom26(svg, state, onAction);
      break;
    case 27:
      renderRoom27(svg, state, onAction);
      break;
    case 29:
      renderRoom29(svg, state, onAction);
      break;
    case 30:
      renderRoom30(svg, state, onAction);
      break;
    case 35:
      renderRoom35(svg, state, onAction);
      break;
    case 37:
      renderRoom37(svg, state, onAction);
      break;
    case 38:
      renderRoom38(svg, state, onAction);
      break;
  }

  // Dynamic wandering entities:
  // 1. Ravenous Mice (Obj 20)
  if (state.objectLoc[20] === roomId) {
    renderRavenousMice(svg, state, onAction);
  }

  // 2. Snarling Werewolf (Obj 34)
  if (state.objectLoc[34] === roomId && !state.flags.WF) {
    renderWerewolf(svg, state, onAction);
  }

  // 3. Lethal Vampire (Obj 39)
  if (state.objectLoc[39] === roomId && !state.flags.VR) {
    renderVampire(svg, state, onAction);
  }
}
