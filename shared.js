// NAV scroll + active highlight
window.addEventListener('scroll',()=>{
  document.getElementById('main-nav').classList.toggle('scrolled',window.scrollY>40);
});
// highlight active nav link by page
(function(){
  var path = window.location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav-links a').forEach(function(a){
    var href = a.getAttribute('href')||'';
    if(href===path || (path===''&&href==='index.html') || (path==='index.html'&&href==='index.html'))
      a.classList.add('active');
  });
})();
// Mobile nav
document.getElementById('burger').addEventListener('click',()=>document.getElementById('mob-nav').classList.add('open'));
document.getElementById('mob-close').addEventListener('click',()=>document.getElementById('mob-nav').classList.remove('open'));
function closeMob(){document.getElementById('mob-nav').classList.remove('open');}
// Scroll reveal
var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('in');});},{threshold:.07});
document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});
// Contact form
function sendMsg(){
  if(!document.getElementById('cn').value||!document.getElementById('ce').value){alert('Please fill in your name and email.');return;}
  document.getElementById('form-ok').style.display='block';
  ['cn','ce','cs','cm'].forEach(function(id){document.getElementById(id).value='';});
  setTimeout(function(){document.getElementById('form-ok').style.display='none';},4500);
}
