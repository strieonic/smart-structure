// Lightweight Auth stubs for local demo/testing
(function(){
  const USERS_KEY = 'demo_users_v1';

  function loadUsers(){
    try{ return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }catch(e){ return []; }
  }
  function saveUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

  function findUserByEmail(email){
    const users = loadUsers();
    return users.find(u => u.email && u.email.toLowerCase()===email.toLowerCase());
  }

  // Create demo account on first use
  (function ensureDemo(){
    const users = loadUsers();
    if(!users.find(u=>u.email==='demo@protask.elite')){
      users.push({ email:'demo@protask.elite', password:'Demo1234!', name:'Demo User', role:'USER' });
      saveUsers(users);
    }
  })();

  window.switchTab = function(tab, ev){
    ev?.preventDefault();
    document.querySelectorAll('#auth-section .tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('#auth-section form, #auth-section #login-fields, #auth-section #register-fields').forEach(el=>el.style.display='none');
    if(tab === 'login'){
      document.querySelector('#auth-section .tab:nth-child(1)')?.classList.add('active');
      document.getElementById('login-fields').style.display='block';
    } else {
      document.querySelector('#auth-section .tab:nth-child(2)')?.classList.add('active');
      document.getElementById('register-fields').style.display='block';
    }
  };

  window.selectAccountType = function(type, ev){
    document.querySelectorAll('.account-type-card').forEach(c=>c.classList.remove('active'));
    ev.currentTarget?.classList.add('active');
    // show appropriate auth card
    if(type==='expert'){
      document.getElementById('user-auth-card')?.style.display='none';
      document.getElementById('expert-auth-card')?.style.display='block';
    } else {
      document.getElementById('user-auth-card')?.style.display='block';
      document.getElementById('expert-auth-card')?.style.display='none';
    }
  };

  window.login = function(){
    const email = (document.getElementById('login-email')?.value || '').trim();
    const password = document.getElementById('login-password')?.value || '';
    if(!email || !password){ alert('Please enter email and password'); return; }
    const user = findUserByEmail(email);
    if(!user || user.password !== password){ alert('Invalid credentials for demo'); return; }
    // Set minimal state
    state.user = { name: user.name || email, email: user.email, role: user.role || 'USER' };
    state.token = 'demo-token-'+Date.now();
    localStorage.setItem('token', state.token);
    localStorage.setItem('user', JSON.stringify(state.user));
    if(typeof UI?.toast === 'function') UI.toast('Signed in', `Welcome ${state.user.name}`, 'success');
    // Navigate to home/dashboard
    navigateTo('home-section');
    updateSidebarNavigation();
  };

  window.register = function(){
    const name = (document.getElementById('register-name')?.value || '').trim();
    const email = (document.getElementById('register-email')?.value || '').trim();
    const password = document.getElementById('register-password')?.value || '';
    const role = document.getElementById('register-role')?.value || 'USER';
    if(!name || !email || !password){ alert('Please fill all fields'); return; }
    if(findUserByEmail(email)){ alert('User already exists. Try signing in.'); switchTab('login'); return; }
    const users = loadUsers();
    users.push({ email, password, name, role });
    saveUsers(users);
    if(typeof UI?.toast === 'function') UI.toast('Account created', 'You can sign in now', 'success');
    switchTab('login');
    document.getElementById('login-email').value = email;
  };

  window.expertLogin = window.login;
  window.registerExpert = function(){
    // For demo, reuse register but mark as EXPERT
    const name = (document.getElementById('expert-name')?.value || '').trim();
    const email = (document.getElementById('expert-email')?.value || '').trim();
    const password = document.getElementById('expert-password')?.value || '';
    if(!name || !email || !password){ alert('Fill required fields'); return; }
    const users = loadUsers();
    if(findUserByEmail(email)){ alert('User exists'); return; }
    users.push({ email, password, name, role: 'EXPERT' }); saveUsers(users);
    if(typeof UI?.toast === 'function') UI.toast('Expert account created', 'Complete your profile later', 'success');
    switchTab('login');
  };

  window.nextStep = function(step){
    document.querySelectorAll('.registration-step').forEach(s=>s.classList.remove('active'));
    const el = document.getElementById('step-'+step);
    if(el) el.classList.add('active');
  };
  window.prevStep = function(step){ nextStep(step); };

  // Password toggle
  document.addEventListener('DOMContentLoaded', ()=>{
    const toggle = document.getElementById('toggle-password');
    const pwd = document.getElementById('login-password');
    toggle?.addEventListener('click', ()=>{ if(!pwd) return; pwd.type = pwd.type==='password'?'text':'password'; toggle.textContent = pwd.type==='password'?'👁️':'🙈'; });
  });

})();
