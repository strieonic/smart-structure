// ============================================
// Smart Load Analyzer - Landing Page Animations
// ============================================

// Interactive Physics Background (Google Antigravity Style)
class InteractiveBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.objects = [];
    this.objectCount = 60; // More shapes
    this.mouse = { x: null, y: null, radius: 200, isDown: false };
    this.gravity = 0; // No gravity - floating effect
    this.friction = 0.95; // Less friction for smoother movement
    this.bounce = 0.7;
    
    this.init();
    this.animate();
    this.setupEventListeners();
  }
  
  init() {
    this.resize();
    
    // Create various geometric objects
    const shapes = ['circle', 'square', 'triangle', 'hexagon'];
    const colors = [
      'rgba(139, 92, 246, 0.8)',
      'rgba(124, 58, 237, 0.8)',
      'rgba(99, 102, 241, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(147, 51, 234, 0.8)'
    ];
    
    for (let i = 0; i < this.objectCount; i++) {
      const radius = Math.random() * 15 + 15; // 15-30px (smaller, around 1cm)
      this.objects.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.3, // Much slower movement
        vy: (Math.random() - 0.5) * 0.3, // Much slower movement
        radius: radius,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02, // Slower rotation
        grabbed: false,
        mass: Math.random() * 2 + 1,
        // Floating behavior
        originalX: 0,
        originalY: 0,
        floatRadius: radius * 0.5, // Float within half their size
        floatAngle: Math.random() * Math.PI * 2,
        floatSpeed: Math.random() * 0.01 + 0.005 // Very slow floating
      });
      
      // Set original position for floating
      this.objects[i].originalX = this.objects[i].x;
      this.objects[i].originalY = this.objects[i].y;
    }
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  setupEventListeners() {
    window.addEventListener('resize', () => this.resize());
    
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    
    window.addEventListener('mousedown', (e) => {
      this.mouse.isDown = true;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      
      // Grab objects near mouse
      this.objects.forEach(obj => {
        const dx = this.mouse.x - obj.x;
        const dy = this.mouse.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < obj.radius + 20) {
          obj.grabbed = true;
        }
      });
    });
    
    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
      this.objects.forEach(obj => {
        if (obj.grabbed) {
          obj.grabbed = false;
          // Add throw velocity
          obj.vx = (this.mouse.x - obj.x) * 0.1;
          obj.vy = (this.mouse.y - obj.y) * 0.1;
        }
      });
    });
    
    window.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
      this.mouse.isDown = false;
      this.objects.forEach(obj => obj.grabbed = false);
    });
    
    // Touch support
    window.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      this.mouse.isDown = true;
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;
      
      this.objects.forEach(obj => {
        const dx = this.mouse.x - obj.x;
        const dy = this.mouse.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < obj.radius + 20) {
          obj.grabbed = true;
        }
      });
    });
    
    window.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;
    });
    
    window.addEventListener('touchend', () => {
      this.mouse.isDown = false;
      this.objects.forEach(obj => {
        if (obj.grabbed) {
          obj.grabbed = false;
          obj.vx = (this.mouse.x - obj.x) * 0.1;
          obj.vy = (this.mouse.y - obj.y) * 0.1;
        }
      });
    });
  }
  
  drawShape(obj) {
    this.ctx.save();
    this.ctx.translate(obj.x, obj.y);
    this.ctx.rotate(obj.rotation);
    this.ctx.fillStyle = obj.color;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    
    switch(obj.shape) {
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        break;
        
      case 'square':
        this.ctx.fillRect(-obj.radius, -obj.radius, obj.radius * 2, obj.radius * 2);
        this.ctx.strokeRect(-obj.radius, -obj.radius, obj.radius * 2, obj.radius * 2);
        break;
        
      case 'triangle':
        this.ctx.beginPath();
        this.ctx.moveTo(0, -obj.radius);
        this.ctx.lineTo(obj.radius, obj.radius);
        this.ctx.lineTo(-obj.radius, obj.radius);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        break;
        
      case 'hexagon':
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x = obj.radius * Math.cos(angle);
          const y = obj.radius * Math.sin(angle);
          if (i === 0) this.ctx.moveTo(x, y);
          else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        break;
    }
    
    // Add glow effect when grabbed
    if (obj.grabbed) {
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = obj.color;
    }
    
    this.ctx.restore();
  }
  
  updateObject(obj) {
    if (obj.grabbed && this.mouse.x !== null && this.mouse.y !== null) {
      // Smoothly move to mouse position
      const dx = this.mouse.x - obj.x;
      const dy = this.mouse.y - obj.y;
      obj.x += dx * 0.2;
      obj.y += dy * 0.2;
      obj.vx = 0;
      obj.vy = 0;
      
      // Update original position when grabbed
      obj.originalX = obj.x;
      obj.originalY = obj.y;
    } else {
      // Floating behavior - gentle circular motion around original position
      obj.floatAngle += obj.floatSpeed;
      
      const targetX = obj.originalX + Math.cos(obj.floatAngle) * obj.floatRadius;
      const targetY = obj.originalY + Math.sin(obj.floatAngle) * obj.floatRadius;
      
      // Smoothly move towards target position
      const dx = targetX - obj.x;
      const dy = targetY - obj.y;
      
      obj.vx += dx * 0.01;
      obj.vy += dy * 0.01;
      
      // Apply velocity
      obj.x += obj.vx;
      obj.y += obj.vy;
      
      // Apply friction
      obj.vx *= this.friction;
      obj.vy *= this.friction;
      
      // Gentle rotation
      obj.rotation += obj.rotationSpeed;
      
      // Mouse repulsion when not grabbed (but limited)
      if (this.mouse.x !== null && this.mouse.y !== null && !this.mouse.isDown) {
        const dx = this.mouse.x - obj.x;
        const dy = this.mouse.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.mouse.radius) {
          const force = (this.mouse.radius - distance) / this.mouse.radius;
          const angle = Math.atan2(dy, dx);
          obj.vx -= Math.cos(angle) * force * 0.5;
          obj.vy -= Math.sin(angle) * force * 0.5;
        }
      }
      
      // CONSTRAINT: Keep within 4-5cm (170px) from original position
      const maxDistance = 170; // ~4.5cm in pixels
      const distFromOrigin = Math.sqrt(
        Math.pow(obj.x - obj.originalX, 2) + 
        Math.pow(obj.y - obj.originalY, 2)
      );
      
      if (distFromOrigin > maxDistance) {
        // Pull back towards original position with strong force
        const angle = Math.atan2(obj.y - obj.originalY, obj.x - obj.originalX);
        const pullForce = (distFromOrigin - maxDistance) * 0.1;
        
        obj.vx -= Math.cos(angle) * pullForce;
        obj.vy -= Math.sin(angle) * pullForce;
        
        // Clamp position to max distance
        obj.x = obj.originalX + Math.cos(angle) * maxDistance;
        obj.y = obj.originalY + Math.sin(angle) * maxDistance;
      }
      
      // Keep within screen bounds (soft boundaries)
      if (obj.x < obj.radius) {
        obj.x = obj.radius;
        obj.vx *= -0.5;
        obj.originalX = obj.x;
      }
      if (obj.x > this.canvas.width - obj.radius) {
        obj.x = this.canvas.width - obj.radius;
        obj.vx *= -0.5;
        obj.originalX = obj.x;
      }
      if (obj.y < obj.radius) {
        obj.y = obj.radius;
        obj.vy *= -0.5;
        obj.originalY = obj.y;
      }
      if (obj.y > this.canvas.height - obj.radius) {
        obj.y = this.canvas.height - obj.radius;
        obj.vy *= -0.5;
        obj.originalY = obj.y;
      }
    }
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update and draw objects
    this.objects.forEach(obj => {
      this.updateObject(obj);
      this.drawShape(obj);
    });
    
    requestAnimationFrame(() => this.animate());
  }
}

// Wave/Ripple Effect (Effect 3 - Bottom section)
class WaveEffect {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.waves = [];
    this.mouse = { x: null, y: null };
    this.time = 0;
    
    this.init();
    this.animate();
    this.setupEventListeners();
  }
  
  init() {
    this.resize();
    
    // Create initial waves
    for (let i = 0; i < 5; i++) {
      this.waves.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: 0,
        maxRadius: 200 + Math.random() * 100,
        speed: 1 + Math.random() * 0.5,
        opacity: 0.5
      });
    }
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  setupEventListeners() {
    window.addEventListener('resize', () => this.resize());
    
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    
    window.addEventListener('click', (e) => {
      // Create ripple on click
      this.waves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 300,
        speed: 3,
        opacity: 0.8
      });
    });
  }
  
  drawWave(wave) {
    this.ctx.beginPath();
    this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = `rgba(139, 92, 246, ${wave.opacity * (1 - wave.radius / wave.maxRadius)})`;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
  
  updateWave(wave) {
    wave.radius += wave.speed;
    
    if (wave.radius > wave.maxRadius) {
      wave.radius = 0;
      wave.x = Math.random() * this.canvas.width;
      wave.y = Math.random() * this.canvas.height;
    }
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.time += 0.01;
    
    // Draw flowing lines
    for (let i = 0; i < 3; i++) {
      this.ctx.beginPath();
      for (let x = 0; x < this.canvas.width; x += 10) {
        const y = this.canvas.height / 2 + Math.sin(x * 0.01 + this.time + i) * 50;
        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 + i * 0.05})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    
    // Update and draw waves
    this.waves.forEach(wave => {
      this.updateWave(wave);
      this.drawWave(wave);
    });
    
    requestAnimationFrame(() => this.animate());
  }
}

// Particle System
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 80;
    this.connectionDistance = 150;
    this.mouse = { x: null, y: null, radius: 150 };
    
    this.init();
    this.animate();
    this.setupEventListeners();
  }
  
  init() {
    this.resize();
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3
      });
    }
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  setupEventListeners() {
    window.addEventListener('resize', () => this.resize());
    
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.x;
      this.mouse.y = e.y;
    });
    
    window.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }
  
  drawParticle(particle) {
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(139, 92, 246, ${particle.opacity})`;
    this.ctx.fill();
  }
  
  drawConnection(p1, p2, distance) {
    const opacity = (1 - distance / this.connectionDistance) * 0.3;
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
  
  updateParticle(particle) {
    // Move particle
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    // Bounce off edges
    if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
    if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
    
    // Mouse interaction
    if (this.mouse.x !== null && this.mouse.y !== null) {
      const dx = this.mouse.x - particle.x;
      const dy = this.mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.mouse.radius) {
        const force = (this.mouse.radius - distance) / this.mouse.radius;
        const angle = Math.atan2(dy, dx);
        particle.vx -= Math.cos(angle) * force * 0.1;
        particle.vy -= Math.sin(angle) * force * 0.1;
      }
    }
    
    // Damping
    particle.vx *= 0.99;
    particle.vy *= 0.99;
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update and draw particles
    this.particles.forEach(particle => {
      this.updateParticle(particle);
      this.drawParticle(particle);
    });
    
    // Draw connections
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.connectionDistance) {
          this.drawConnection(this.particles[i], this.particles[j], distance);
        }
      }
    }
    
    requestAnimationFrame(() => this.animate());
  }
}

// 3D Building Visualization
class Building3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rotation = 0;
    this.rotationSpeed = 0.005;
    this.buildings = [];
    
    this.init();
    this.animate();
  }
  
  init() {
    this.resize();
    
    // Create multiple buildings
    this.buildings = [
      { x: -100, y: 0, z: 0, width: 60, height: 150, depth: 60, color: 'rgba(139, 92, 246, 0.8)' },
      { x: 0, y: 0, z: -80, width: 50, height: 120, depth: 50, color: 'rgba(124, 58, 237, 0.7)' },
      { x: 100, y: 0, z: 20, width: 70, height: 180, depth: 70, color: 'rgba(99, 102, 241, 0.8)' }
    ];
    
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
  }
  
  project3D(x, y, z) {
    const scale = 400 / (400 + z);
    return {
      x: this.centerX + x * scale,
      y: this.centerY + y * scale,
      scale: scale
    };
  }
  
  rotatePoint(x, y, z, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: x * cos - z * sin,
      y: y,
      z: x * sin + z * cos
    };
  }
  
  drawBuilding(building) {
    const { x, y, z, width, height, depth, color } = building;
    
    // Define 8 corners of the building
    const corners = [
      { x: x - width/2, y: y - height, z: z - depth/2 },
      { x: x + width/2, y: y - height, z: z - depth/2 },
      { x: x + width/2, y: y, z: z - depth/2 },
      { x: x - width/2, y: y, z: z - depth/2 },
      { x: x - width/2, y: y - height, z: z + depth/2 },
      { x: x + width/2, y: y - height, z: z + depth/2 },
      { x: x + width/2, y: y, z: z + depth/2 },
      { x: x - width/2, y: y, z: z + depth/2 }
    ];
    
    // Rotate and project corners
    const projected = corners.map(corner => {
      const rotated = this.rotatePoint(corner.x, corner.y, corner.z, this.rotation);
      return this.project3D(rotated.x, rotated.y, rotated.z);
    });
    
    // Draw faces
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
    this.ctx.lineWidth = 2;
    
    // Front face
    this.ctx.beginPath();
    this.ctx.moveTo(projected[0].x, projected[0].y);
    this.ctx.lineTo(projected[1].x, projected[1].y);
    this.ctx.lineTo(projected[2].x, projected[2].y);
    this.ctx.lineTo(projected[3].x, projected[3].y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // Right face
    this.ctx.fillStyle = color.replace('0.8', '0.6').replace('0.7', '0.5');
    this.ctx.beginPath();
    this.ctx.moveTo(projected[1].x, projected[1].y);
    this.ctx.lineTo(projected[5].x, projected[5].y);
    this.ctx.lineTo(projected[6].x, projected[6].y);
    this.ctx.lineTo(projected[2].x, projected[2].y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // Top face
    this.ctx.fillStyle = color.replace('0.8', '0.9').replace('0.7', '0.8');
    this.ctx.beginPath();
    this.ctx.moveTo(projected[0].x, projected[0].y);
    this.ctx.lineTo(projected[1].x, projected[1].y);
    this.ctx.lineTo(projected[5].x, projected[5].y);
    this.ctx.lineTo(projected[4].x, projected[4].y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.rotation += this.rotationSpeed;
    
    // Sort buildings by z-depth for proper rendering
    const sortedBuildings = [...this.buildings].sort((a, b) => {
      const rotatedA = this.rotatePoint(a.x, a.y, a.z, this.rotation);
      const rotatedB = this.rotatePoint(b.x, b.y, b.z, this.rotation);
      return rotatedB.z - rotatedA.z;
    });
    
    sortedBuildings.forEach(building => this.drawBuilding(building));
    
    requestAnimationFrame(() => this.animate());
  }
}

// Scroll Animations
class ScrollAnimations {
  constructor() {
    this.elements = document.querySelectorAll('[data-animate]');
    this.init();
  }
  
  init() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );
    
    this.elements.forEach(el => this.observer.observe(el));
  }
}

// Floating Elements Animation
class FloatingElements {
  constructor() {
    this.elements = document.querySelectorAll('.floating');
    this.init();
  }
  
  init() {
    this.elements.forEach((el, index) => {
      const delay = index * 0.2;
      const duration = 3 + Math.random() * 2;
      const distance = 10 + Math.random() * 20;
      
      el.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;
      el.style.setProperty('--float-distance', `${distance}px`);
    });
  }
}

// Typing Effect
class TypingEffect {
  constructor(element, texts, speed = 100) {
    this.element = element;
    this.texts = texts;
    this.speed = speed;
    this.textIndex = 0;
    this.charIndex = 0;
    this.isDeleting = false;
    
    this.type();
  }
  
  type() {
    const currentText = this.texts[this.textIndex];
    
    if (this.isDeleting) {
      this.element.textContent = currentText.substring(0, this.charIndex - 1);
      this.charIndex--;
    } else {
      this.element.textContent = currentText.substring(0, this.charIndex + 1);
      this.charIndex++;
    }
    
    let timeout = this.speed;
    
    if (this.isDeleting) {
      timeout /= 2;
    }
    
    if (!this.isDeleting && this.charIndex === currentText.length) {
      timeout = 2000;
      this.isDeleting = true;
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.textIndex = (this.textIndex + 1) % this.texts.length;
      timeout = 500;
    }
    
    setTimeout(() => this.type(), timeout);
  }
}

// Counter Animation
class CounterAnimation {
  constructor(element, target, duration = 2000) {
    this.element = element;
    this.target = target;
    this.duration = duration;
    this.current = 0;
    
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && this.current === 0) {
            this.animate();
          }
        });
      },
      { threshold: 0.5 }
    );
    
    this.observer.observe(this.element);
  }
  
  animate() {
    const increment = this.target / (this.duration / 16);
    const timer = setInterval(() => {
      this.current += increment;
      if (this.current >= this.target) {
        this.current = this.target;
        clearInterval(timer);
      }
      this.element.textContent = Math.floor(this.current).toLocaleString();
    }, 16);
  }
}

// Parallax Effect
class ParallaxEffect {
  constructor() {
    this.elements = document.querySelectorAll('[data-parallax]');
    this.init();
  }
  
  init() {
    window.addEventListener('scroll', () => this.update());
    this.update();
  }
  
  update() {
    const scrollY = window.pageYOffset;
    
    this.elements.forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.5;
      const yPos = -(scrollY * speed);
      el.style.transform = `translateY(${yPos}px)`;
    });
  }
}

// Mouse Trail Effect
class MouseTrail {
  constructor() {
    this.trail = [];
    this.maxTrail = 20;
    this.isHomePage = true;
    this.customCursor = null;
    this.init();
  }
  
  init() {
    // Create custom cursor
    this.customCursor = document.createElement('div');
    this.customCursor.className = 'custom-cursor';
    this.customCursor.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(139, 92, 246, 0.5);
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
      transition: transform 0.15s ease, opacity 0.15s ease;
      opacity: 0;
    `;
    document.body.appendChild(this.customCursor);
    
    document.addEventListener('mousemove', (e) => {
      // Check if we're on home page
      const homeSection = document.getElementById('home-section');
      this.isHomePage = homeSection && homeSection.classList.contains('active');
      
      // Update custom cursor position
      this.customCursor.style.left = (e.clientX - 10) + 'px';
      this.customCursor.style.top = (e.clientY - 10) + 'px';
      this.customCursor.style.opacity = this.isHomePage ? '1' : '0.3';
      
      // Add trail only on home page
      if (this.isHomePage) {
        this.addTrailPoint(e.clientX, e.clientY);
      }
    });
    
    document.addEventListener('mouseenter', () => {
      this.customCursor.style.opacity = this.isHomePage ? '1' : '0.3';
    });
    
    document.addEventListener('mouseleave', () => {
      this.customCursor.style.opacity = '0';
    });
    
    // Cursor effects on hover
    document.addEventListener('mousedown', () => {
      this.customCursor.style.transform = 'scale(0.8)';
    });
    
    document.addEventListener('mouseup', () => {
      this.customCursor.style.transform = 'scale(1)';
    });
    
    this.animate();
  }
  
  addTrailPoint(x, y) {
    const point = document.createElement('div');
    point.className = 'mouse-trail-point';
    point.style.left = x + 'px';
    point.style.top = y + 'px';
    document.body.appendChild(point);
    
    this.trail.push(point);
    
    if (this.trail.length > this.maxTrail) {
      const oldPoint = this.trail.shift();
      oldPoint.remove();
    }
    
    setTimeout(() => {
      point.style.opacity = '0';
      point.style.transform = 'scale(0)';
    }, 10);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
  }
}

// Smooth Scroll
class SmoothScroll {
  constructor() {
    this.init();
  }
  
  init() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
}

// Card Tilt Effect
class CardTilt {
  constructor() {
    this.cards = document.querySelectorAll('.feature-card, .stat-card');
    this.init();
  }
  
  init() {
    this.cards.forEach(card => {
      card.addEventListener('mousemove', (e) => this.handleMove(e, card));
      card.addEventListener('mouseleave', () => this.handleLeave(card));
    });
  }
  
  handleMove(e, card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  }
  
  handleLeave(card) {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
  }
}

// Initialize all animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize 3 different interactive backgrounds for home page
  const canvas1 = document.getElementById('interactive-bg-1'); // Floating shapes
  const canvas2 = document.getElementById('interactive-bg-2'); // Particle network
  const canvas3 = document.getElementById('interactive-bg-3'); // Wave effect
  const homeSection = document.getElementById('home-section');
  
  let effect1, effect2, effect3;
  
  if (canvas1 && canvas2 && canvas3 && homeSection) {
    console.log('🎨 Initializing 3 interactive effects...');
    
    // Initialize all 3 effects
    effect1 = new InteractiveBackground(canvas1);
    console.log('✅ Effect 1: Floating Shapes initialized');
    
    effect2 = new ParticleSystem(canvas2);
    console.log('✅ Effect 2: Particle Network initialized');
    
    effect3 = new WaveEffect(canvas3);
    console.log('✅ Effect 3: Wave Effect initialized');
    
    // Initial state - show only effect 1
    canvas1.style.opacity = '1';
    canvas2.style.opacity = '0';
    canvas3.style.opacity = '0';
    
    // Scroll-based effect switching
    window.addEventListener('scroll', () => {
      if (!homeSection.classList.contains('active')) return;
      
      const scrollY = window.pageYOffset;
      const windowHeight = window.innerHeight;
      
      // Calculate which effect should be visible based on scroll position
      // Effect 1 (Floating Shapes): 0 - 80vh
      // Effect 2 (Particle Network): 80vh - 200vh
      // Effect 3 (Wave Effect): 200vh+
      
      if (scrollY < windowHeight * 0.8) {
        // Top section - Floating shapes
        canvas1.style.opacity = '1';
        canvas2.style.opacity = '0';
        canvas3.style.opacity = '0';
      } else if (scrollY < windowHeight * 2) {
        // Middle section - Particle network
        const progress = (scrollY - windowHeight * 0.8) / (windowHeight * 1.2);
        canvas1.style.opacity = String(Math.max(0, 1 - progress * 2));
        canvas2.style.opacity = String(Math.min(1, progress * 2));
        canvas3.style.opacity = '0';
      } else {
        // Bottom section - Wave effect
        const progress = (scrollY - windowHeight * 2) / windowHeight;
        canvas1.style.opacity = '0';
        canvas2.style.opacity = String(Math.max(0, 1 - progress * 2));
        canvas3.style.opacity = String(Math.min(1, progress * 2));
      }
    });
    
    // Trigger initial scroll event to set correct opacity
    window.dispatchEvent(new Event('scroll'));
    
    // Hide/show all canvases based on active section
    const observer = new MutationObserver(() => {
      if (homeSection.classList.contains('active')) {
        canvas1.style.display = 'block';
        canvas2.style.display = 'block';
        canvas3.style.display = 'block';
      } else {
        canvas1.style.display = 'none';
        canvas2.style.display = 'none';
        canvas3.style.display = 'none';
      }
    });
    
    observer.observe(homeSection, { attributes: true, attributeFilter: ['class'] });
  }
  
  // Initialize 3D building
  const buildingCanvas = document.getElementById('building-canvas');
  if (buildingCanvas) {
    new Building3D(buildingCanvas);
  }
  
  // Initialize scroll animations
  new ScrollAnimations();
  
  // Initialize floating elements
  new FloatingElements();
  
  // Initialize typing effect
  const typingElement = document.querySelector('.typing-text');
  if (typingElement) {
    new TypingEffect(typingElement, [
      'Structural Analysis',
      'Load Distribution',
      'Seismic Assessment',
      'AI-Powered Insights',
      'Expert Consultation'
    ]);
  }
  
  // Initialize counters
  document.querySelectorAll('[data-counter]').forEach(el => {
    const target = parseInt(el.dataset.counter);
    new CounterAnimation(el, target);
  });
  
  // Initialize parallax
  new ParallaxEffect();
  
  // Initialize mouse trail (works on all pages, but minimal on non-home pages)
  new MouseTrail();
  
  // Initialize smooth scroll
  new SmoothScroll();
  
  // Initialize card tilt
  new CardTilt();
  
  console.log('✅ All animations initialized successfully');
  console.log('🎨 3 interactive effects ready: Floating Shapes → Particle Network → Wave Effect');
});

// Add CSS for animations dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(var(--float-distance, -20px));
    }
  }
  
  [data-animate] {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  
  [data-animate].animate-in {
    opacity: 1;
    transform: translateY(0);
  }
  
  .mouse-trail-point {
    position: fixed;
    width: 10px;
    height: 10px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.8), transparent);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  
  .feature-card, .stat-card {
    transition: transform 0.3s ease;
  }
`;
document.head.appendChild(style);
