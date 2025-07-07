/* =========================================================
   Particle Background – Fixed Instance Mode Implementation
   ========================================================= */

const CONFIG = {
  // Use the #about section size if available, otherwise fallback to window size
  canvasWidth: () => {
    const particleSection = document.getElementById('particle-bg');
    return particleSection ? particleSection.scrollWidth : window.innerWidth;
  },
  canvasHeight: () => {
    const particleSection = document.getElementById('particle-bg');
    return particleSection ? particleSection.scrollHeight : window.innerHeight;
  },
  particleCount: 1000,
  palette: [
    {fg: [0, 0, 0],       bg: [255, 255, 255]},
    {fg: [242, 68, 68],   bg: [167, 217, 217]},
    {fg: [102, 121, 107], bg: [222, 239, 87]},
    {fg: [242, 170, 82],  bg: [0, 169, 104]},
    {fg: [146, 241, 222], bg: [166, 116, 88]}
  ]
};

// Utility functions
const rand = (min, max) => Math.random() * (max - min) + min;
const choice = arr => arr[(Math.random() * arr.length) | 0];

// Object Pool class
class Pool {
  constructor(factory, size) {
    this.free = [];
    this.busy = new Set();
    for (let i = 0; i < size; i++) this.free.push(factory());
  }
  acquire() { 
    const obj = this.free.pop() ?? null; 
    if (obj) this.busy.add(obj); 
    return obj; 
  }
  release(obj) { 
    this.busy.delete(obj); 
    this.free.push(obj); 
  }
  forEach(callback) { 
    this.busy.forEach(callback); 
  }
}

// Particle class - now receives p5 instance
class Particle {
  constructor(p) {
    this.p = p;  // Store reference to p5 instance
    this.pos = this.p.createVector();  // ✅ Use p.createVector()
    this.vel = this.p.createVector();
    this.acc = this.p.createVector();
    this.offset = rand(1, 2);
  }
  
  reset(x, y, colors) {
    this.pos.set(x, y);
    this.vel.set(0, rand(-1, 1));
    this.acc.set(0, rand(-0.025, 0.025));
    this.r = rand(25, 35);
    this.alpha2 = 100;
    this.alpha1 = rand(0, 100);
    this.fg = colors.fg;
    this.bg = colors.bg;
    return this;
  }
  
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.alpha2 -= rand(0.5, 1);
    this.alpha1 += rand(0.5, 1);
    this.r = this.p.max(1, this.r - 0.025);  // ✅ Use p.max()
  }
  
  draw(ctx) {
    const g = ctx.createRadialGradient(
      this.pos.x + rand(-this.offset, this.offset),
      this.pos.y + rand(-this.offset, this.offset),
      0,
      this.pos.x,
      this.pos.y,
      this.r
    );
    // fg and bg are [r,g,b,a], a in 0-100
    const fgAlpha = (this.fg[3] !== undefined ? this.fg[3] : 100) * (this.alpha1 / 100) / 100;
    const bgAlpha = (this.bg[3] !== undefined ? this.bg[3] : 100) * (this.alpha2 / 100) / 100;
    g.addColorStop(0.15, `rgba(${this.fg[0]},${this.fg[1]},${this.fg[2]},${fgAlpha})`);
    g.addColorStop(1, `rgba(${this.bg[0]},${this.bg[1]},${this.bg[2]},${bgAlpha})`);
    ctx.fillStyle = g;
    ctx.fillRect(this.pos.x, this.pos.y, this.r * 0.4, this.r * 0.1);
  }
  
  finished() { 
    return this.alpha2 < 10; 
  }
}

// Spark class - also receives p5 instance
class Spark {
  constructor(p) {
    this.p = p;
    this.pos = this.p.createVector();
    this.vel = this.p.createVector();
    this.acc = this.p.createVector();
  }
  
  reset(x, y, fg, bg) {
    this.pos.set(x, y);
    this.vel.set(rand(-0.25, 0.25), 0);
    this.acc.set(rand(-0.025, 0.025), 0);
    this.r = 1;
    this.alpha2 = 20;
    this.alpha1 = 5;
    this.fg = fg;
    this.bg = bg;
    return this;
  }
  
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.alpha2 -= rand(0.8, 1);
    this.alpha1 += rand(0.3, 0.6);
    this.r += 0.05;
  }
  
  draw(ctx) {
    const g = ctx.createRadialGradient(
      this.pos.x, this.pos.y, 0, 
      this.pos.x, this.pos.y, this.r
    );
    const fgAlpha = (this.fg[3] !== undefined ? this.fg[3] : 100) * (this.alpha1 / 100) / 100;
    const bgAlpha = (this.bg[3] !== undefined ? this.bg[3] : 100) * (this.alpha2 / 100) / 100;
    g.addColorStop(0.25, `rgba(${this.fg[0]},${this.fg[1]},${this.fg[2]},${fgAlpha})`);
    g.addColorStop(1, `rgba(${this.bg[0]},${this.bg[1]},${this.bg[2]},${bgAlpha})`);
    ctx.fillStyle = g;
    ctx.fillRect(this.pos.x, this.pos.y, 1, this.r);
  }
  
  finished() { 
    return this.alpha2 < 2; 
  }
}

// Exported sketch function for p5 instance mode
function particleBgSketch(p) {
  let particlePool, sparkPool, ctx;
  let palette = null;


  // Wait for aboutSketchPalette to be set before initializing
  function waitForPaletteAndInit() {
    if (window.aboutSketchPalette && window.aboutSketchPalette.color1 && window.aboutSketchPalette.color2) {
      palette = {
        color1: window.aboutSketchPalette.color1,
        color2: window.aboutSketchPalette.color2
      };
      initializeParticles();
    } else {
      setTimeout(waitForPaletteAndInit, 50);
    }
  }

  p.setup = () => {
    p.pixelDensity(1);
    const parent = p.createCanvas(CONFIG.canvasWidth(), CONFIG.canvasHeight());
    parent.parent('particle-bg');
    parent.addClass('p5Canvas');
    ctx = p.drawingContext;
    waitForPaletteAndInit();
  };

  function initializeParticles() {
    // Create pools with p5 instance passed to factory functions
    particlePool = new Pool(() => new Particle(p), CONFIG.particleCount);
    sparkPool = new Pool(() => new Spark(p), CONFIG.particleCount);

    // Initialize particles
    for (let i = 0; i < CONFIG.particleCount; i++) {
      const y = p.height / 2 - Math.tan(rand(1, 2) * i + rand(0, 50)) * p.height / 100;
      // Use a random color from the selected palette
      const colorArr = Math.random() < 0.5 ? palette.color1 : palette.color2;
      particlePool.acquire()?.reset(rand(0, p.width), y, { fg: hexToRgbA(colorArr[Math.floor(Math.random() * colorArr.length)]), bg: [255,255,255] });
    }
  }

  // Helper to convert hex with alpha to rgba array
  function hexToRgbA(hex) {
    let c = hex.replace('#','');
    if (c.length === 8) {
      return [
        parseInt(c.substring(0,2),16),
        parseInt(c.substring(2,4),16),
        parseInt(c.substring(4,6),16),
        Math.round(parseInt(c.substring(6,8),16) / 2.55)
      ];
    } else if (c.length === 6) {
      return [
        parseInt(c.substring(0,2),16),
        parseInt(c.substring(2,4),16),
        parseInt(c.substring(4,6),16),
        100
      ];
    }
    return [0,0,0,100];
  }

  p.draw = () => {
    if (!palette) return;
    p.clear();

    // Update and draw particles
    particlePool.forEach(part => {
      part.update();
      part.draw(ctx);

      // Explosion trigger
      if (part.alpha2 < 30) {
        const s = sparkPool.acquire();
        if (s) s.reset(part.pos.x, part.pos.y, part.fg, part.bg);
      }

      if (part.finished()) {
        particlePool.release(part);
      }
    });

    // Update and draw sparks
    sparkPool.forEach(s => {
      s.update();
      s.draw(ctx);
      if (s.finished()) {
        sparkPool.release(s);
      }
    });

    // Maintain particle population
    while (particlePool.busy.size < CONFIG.particleCount) {
      const pObj = particlePool.acquire();
      if (!pObj) break;
      // Use a random color from the selected palette
      const colorArr = Math.random() < 0.5 ? palette.color1 : palette.color2;
      pObj.reset(rand(0, p.width), rand(0, p.height), { fg: hexToRgbA(colorArr[Math.floor(Math.random() * colorArr.length)]), bg: [255,255,255] });
    }
  };

  // Handle window resize
  p.windowResized = () => {
    p.resizeCanvas(CONFIG.canvasWidth(), CONFIG.canvasHeight());
    // Re-initialize particles to match new size and avoid visual inconsistencies
    if (typeof initializeParticles === 'function') {
      initializeParticles();
    }
    // Redraw immediately
    p.redraw && p.redraw();
  };
}
// Make available globally for main.js
window.particleBgSketch = particleBgSketch;
