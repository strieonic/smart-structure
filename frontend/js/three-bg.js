// Three.js background adapted from ProTask Elite
/* Copied and slightly namespaced to avoid conflicts */
const ThreeBackground = (function(){
  let scene, camera, renderer, torusKnot, particles, animId;
  let mouseX=0, mouseY=0, targetX=0, targetY=0;
  const init = ()=>{
    const canvas = document.getElementById('bg-canvas');
    if(!canvas || typeof THREE === 'undefined') return;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setClearColor(0x000000,0);
    const torusGeo = new THREE.TorusKnotGeometry(1.4,0.38,128,18,2,3);
    const torusMat = new THREE.MeshPhongMaterial({ color:0x6366f1, emissive:0x1e0a3c, specular:0x22d3ee, shininess:80, transparent:true, opacity:0.82 });
    torusKnot = new THREE.Mesh(torusGeo, torusMat);
    torusKnot.position.set(3.2,0,-1.5);
    scene.add(torusKnot);
    const wireMat = new THREE.MeshBasicMaterial({ color:0x818cf8, wireframe:true, transparent:true, opacity:0.12 });
    const wireKnot = new THREE.Mesh(torusGeo, wireMat);
    wireKnot.position.copy(torusKnot.position);
    scene.add(wireKnot);
    const particleCount = 800;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount*3);
    const colors = new Float32Array(particleCount*3);
    const colorOptions = [[0.388,0.4,0.949],[0.133,0.827,0.933],[0.659,0.337,0.969]];
    for(let i=0;i<particleCount;i++){positions[i*3]=(Math.random()-0.5)*30;positions[i*3+1]=(Math.random()-0.5)*20;positions[i*3+2]=(Math.random()-0.5)*15-5;const c=colorOptions[Math.floor(Math.random()*colorOptions.length)];colors[i*3]=c[0];colors[i*3+1]=c[1];colors[i*3+2]=c[2];}
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions,3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors,3));
    const particleMat = new THREE.PointsMaterial({ size:0.045, vertexColors:true, transparent:true, opacity:0.65, sizeAttenuation:true });
    particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    const ambient = new THREE.AmbientLight(0x1a1a2e,1.5); scene.add(ambient);
    const light1 = new THREE.DirectionalLight(0x6366f1,3); light1.position.set(5,5,5); scene.add(light1);
    const light2 = new THREE.PointLight(0x22d3ee,2.5,20); light2.position.set(-4,2,3); scene.add(light2);
    const light3 = new THREE.PointLight(0xa855f7,1.8,15); light3.position.set(4,-3,2); scene.add(light3);
    document.addEventListener('mousemove', onMouseMove); window.addEventListener('resize', onResize);
    animate();
  };
  const onMouseMove = e=>{ mouseX=(e.clientX/window.innerWidth-0.5)*2; mouseY=(e.clientY/window.innerHeight-0.5)*2; };
  const onResize = ()=>{ if(!camera||!renderer) return; camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
  const animate = ()=>{ animId = requestAnimationFrame(animate); const t = performance.now()*0.001; targetX += (mouseX - targetX)*0.04; targetY += (mouseY - targetY)*0.04; if(torusKnot){ torusKnot.rotation.x = t*0.18 + targetY*0.3; torusKnot.rotation.y = t*0.25 + targetX*0.4; } if(particles){ particles.rotation.y = t*0.025; particles.rotation.x = targetY*0.08; } camera.position.x += (targetX*0.3 - camera.position.x)*0.03; camera.position.y += (-targetY*0.2 - camera.position.y)*0.03; camera.lookAt(scene.position); if(renderer) renderer.render(scene,camera); };
  const destroy = ()=>{ if(animId) cancelAnimationFrame(animId); document.removeEventListener('mousemove', onMouseMove); window.removeEventListener('resize', onResize); if(renderer) renderer.dispose(); };
  return { init, destroy };
})();
window.ThreeBackground = ThreeBackground;
