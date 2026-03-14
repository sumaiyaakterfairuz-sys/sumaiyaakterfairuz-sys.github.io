/* ═══════════════════════════════════════════════════════════════
   SUMAIYA PORTFOLIO — SHARED EDITOR SYSTEM
   Features: edit mode, image editor, add/copy/move/delete blocks & sections
   ═══════════════════════════════════════════════════════════════ */

/* ── STATE ─────────────────────────────────────────────────── */
var EDIT = false;
var _clipboard = null; // holds copied section/block HTML
var _imgTargetEl = null;
var IS = {img:null,zoom:100,rot:0,panX:0,panY:0,shape:'free',drag:false,lx:0,ly:0};

/* ── TOGGLE EDIT MODE ───────────────────────────────────────── */
function toggleEdit() {
  EDIT = !EDIT;
  document.body.classList.toggle('edit-mode', EDIT);
  var btn = document.getElementById('eb-edit');
  if (btn) { btn.textContent = EDIT ? '✓ Editing...' : '✏️ Edit Mode'; btn.classList.toggle('on', EDIT); }
  ['eb-save','eb-add','eb-photo'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.style.display = EDIT ? 'inline-flex' : 'none';
  });
  document.querySelectorAll('[data-editable]').forEach(function(el){
    el.contentEditable = EDIT ? 'true' : 'false';
  });
  if (EDIT) enableSkillDrag(); else disableSkillDrag();
  refreshSectionControls();
}

/* ── SKILL BAR DRAG ─────────────────────────────────────────── */
function enableSkillDrag() {
  document.querySelectorAll('.sk-bar').forEach(function(bar){
    bar.style.cursor='ew-resize';
    bar.onmousedown=function(e){
      e.preventDefault();
      var fill=bar.querySelector('.sk-fill'), pct=bar.parentElement.querySelector('.sk-pct');
      function mv(ev){ var r=bar.getBoundingClientRect(); var w=Math.min(100,Math.max(5,Math.round((ev.clientX-r.left)/r.width*100))); fill.style.width=w+'%'; if(pct)pct.textContent=w+'%'; }
      function up(){ document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); }
      document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
    };
  });
}
function disableSkillDrag(){ document.querySelectorAll('.sk-bar').forEach(function(b){b.style.cursor='';b.onmousedown=null;}); }

/* ── SECTION CONTROLS ───────────────────────────────────────── */
function refreshSectionControls() {
  document.querySelectorAll('.editable-section').forEach(function(sec){
    var existing = sec.querySelector('.sec-ctrl-bar');
    if (!EDIT) { if (existing) existing.style.display='none'; return; }
    if (!existing) {
      var bar = document.createElement('div');
      bar.className = 'sec-ctrl-bar';
      var sid = sec.id || ('s'+Date.now());
      sec.id = sid;
      bar.innerHTML =
        '<button class="scb scb-move" title="Drag to reorder" onmousedown="startDragSection(event,\''+sid+'\')">⠿ Drag</button>'+
        '<button class="scb" onclick="moveSec(\''+sid+'\',\'up\')">↑ Up</button>'+
        '<button class="scb" onclick="moveSec(\''+sid+'\',\'down\')">↓ Down</button>'+
        '<button class="scb" onclick="copySec(\''+sid+'\')">⎘ Copy</button>'+
        '<button class="scb scb-paste" onclick="pasteSec(\''+sid+'\',\'before\')" id="pbtn_'+sid+'">⏎ Paste Before</button>'+
        '<button class="scb scb-paste" onclick="pasteSec(\''+sid+'\',\'after\')">⏎ Paste After</button>'+
        '<button class="scb scb-add" onclick="showAddSectionModal(\''+sid+'\',\'before\')">＋ Before</button>'+
        '<button class="scb scb-add" onclick="showAddSectionModal(\''+sid+'\',\'after\')">＋ After</button>'+
        '<button class="scb scb-del" onclick="deleteSec(\''+sid+'\')">✕ Delete</button>';
      sec.insertBefore(bar, sec.firstChild);
    } else {
      existing.style.display='flex';
    }
    updatePasteBtn();
  });
}

function updatePasteBtn(){
  document.querySelectorAll('.scb-paste').forEach(function(b){ b.style.opacity=_clipboard?'1':'.4'; b.disabled=!_clipboard; });
}

function moveSec(id, dir){
  var el=document.getElementById(id); if(!el)return;
  var parent=el.parentNode;
  if(dir==='up' && el.previousElementSibling) parent.insertBefore(el, el.previousElementSibling);
  else if(dir==='down' && el.nextElementSibling) parent.insertBefore(el.nextElementSibling, el);
}

function copySec(id){
  var el=document.getElementById(id); if(!el)return;
  var clone=el.cloneNode(true);
  // Remove control bar from clone
  var cb=clone.querySelector('.sec-ctrl-bar'); if(cb) cb.remove();
  _clipboard = clone.outerHTML;
  updatePasteBtn();
  showToast('Section copied! Click "Paste Before/After" to place it.');
}

function pasteSec(refId, position){
  if(!_clipboard){showToast('Nothing copied yet. Copy a section first.'); return;}
  var ref=document.getElementById(refId); if(!ref)return;
  var tmp=document.createElement('div');
  tmp.innerHTML=_clipboard;
  var newSec=tmp.firstElementChild;
  // give new unique id
  newSec.id='sec'+Date.now();
  newSec.classList.add('editable-section');
  if(position==='before') ref.parentNode.insertBefore(newSec, ref);
  else ref.parentNode.insertBefore(newSec, ref.nextSibling);
  // re-enable edit on new section
  newSec.querySelectorAll('[data-editable]').forEach(function(el){el.contentEditable='true';});
  refreshSectionControls();
  showToast('Section pasted!');
}

function deleteSec(id){
  if(!confirm('Delete this section?')) return;
  var el=document.getElementById(id); if(el) el.remove();
}

/* ── DRAG-TO-REORDER SECTIONS ───────────────────────────────── */
var _dragSec=null, _dragGhost=null, _dragY=0;
function startDragSection(e, id){
  _dragSec=document.getElementById(id); if(!_dragSec)return;
  _dragY=e.clientY;
  _dragSec.style.opacity='0.4';
  document.addEventListener('mousemove', onDragSecMove);
  document.addEventListener('mouseup', onDragSecUp);
  e.preventDefault();
}
function onDragSecMove(e){
  if(!_dragSec)return;
  var dy=e.clientY-_dragY;
  if(dy<-40){ var prev=_dragSec.previousElementSibling; if(prev&&prev.classList.contains('editable-section')){_dragSec.parentNode.insertBefore(_dragSec,prev);_dragY=e.clientY;}}
  else if(dy>40){ var next=_dragSec.nextElementSibling; if(next&&next.classList.contains('editable-section')){_dragSec.parentNode.insertBefore(next,_dragSec);_dragY=e.clientY;}}
}
function onDragSecUp(){
  if(_dragSec){_dragSec.style.opacity='';_dragSec=null;}
  document.removeEventListener('mousemove',onDragSecMove);
  document.removeEventListener('mouseup',onDragSecUp);
}

/* ── ADD SECTION MODAL ──────────────────────────────────────── */
var _addSecRef=null, _addSecPos=null;
function showAddSectionModal(refId, pos){
  _addSecRef=refId; _addSecPos=pos||'after';
  document.getElementById('section-modal').style.display='flex';
}
function closeSectionModal(){ document.getElementById('section-modal').style.display='none'; }

function addSection(type){
  closeSectionModal();
  var uid='sec'+Date.now();
  var inner='', bg='background:#fff;padding:72px 0;';

  if(type==='blank'){
    inner='<div class="container"><span class="sec-label" data-editable>Label</span><h2 class="sec-title" data-editable>New Section Title</h2><div class="divider"></div>'+
      '<div id="'+uid+'-z" class="block-zone"></div>'+
      '<div class="add-row"><button class="add-row-btn" onclick="showAddBlockModal(\''+uid+'-z\')">＋ Add content block</button></div></div>';
  } else if(type==='text-photo'){
    var iid=uid+'i';
    inner='<div class="container"><span class="sec-label" data-editable>Section</span><h2 class="sec-title" data-editable>Section Title</h2><div class="divider"></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;"><div>'+
      '<p style="font-size:15px;color:#374151;line-height:1.9;" data-editable>Add your text here. Click to edit this paragraph.</p></div>'+
      '<div class="cb-img-wrap" onclick="if(EDIT)openImgModal(null,\''+iid+'\')"><img id="'+iid+'" src="'+PLACEHOLDER_IMG(500,300)+'" style="width:100%;border-radius:12px;object-fit:cover;"></div>'+
      '</div></div>';
  } else if(type==='photo-text'){
    var iid=uid+'i';
    inner='<div class="container"><span class="sec-label" data-editable>Section</span><h2 class="sec-title" data-editable>Section Title</h2><div class="divider"></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;">'+
      '<div class="cb-img-wrap" onclick="if(EDIT)openImgModal(null,\''+iid+'\')"><img id="'+iid+'" src="'+PLACEHOLDER_IMG(500,300)+'" style="width:100%;border-radius:12px;object-fit:cover;"></div>'+
      '<div><p style="font-size:15px;color:#374151;line-height:1.9;" data-editable>Add your text here. Click to edit.</p></div>'+
      '</div></div>';
  } else if(type==='full-image'){
    var iid=uid+'i';
    bg='padding:0;';
    inner='<div class="cb-img-wrap" onclick="if(EDIT)openImgModal(null,\''+iid+\')" style="max-height:440px;overflow:hidden;">'+
      '<img id="'+iid+'" src="'+PLACEHOLDER_IMG(1200,440)+'" style="width:100%;display:block;"></div>'+
      '<div class="container"><p style="font-size:12px;color:#9ca3af;text-align:center;margin:10px 0 20px;font-style:italic;" data-editable>Image caption</p></div>';
  } else if(type==='three-cards'){
    inner='<div class="container"><span class="sec-label" data-editable>Section</span><h2 class="sec-title" data-editable>Section Title</h2><div class="divider"></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;">'+
      ['1','2','3'].map(function(n){return '<div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:22px;">'+
        '<h4 data-editable style="font-family:\'DM Serif Display\',serif;color:#0f2942;font-size:17px;margin-bottom:8px;">Card '+n+' Title</h4>'+
        '<p data-editable style="font-size:13px;color:#6b7280;line-height:1.75;">Card description text for card '+n+'.</p></div>';}).join('')+
      '</div></div>';
  } else if(type==='highlight-banner'){
    bg='padding:56px 0;background:linear-gradient(135deg,#0f2942,#0e7490);';
    inner='<div class="container" style="text-align:center;">'+
      '<h2 data-editable style="font-family:\'DM Serif Display\',serif;color:#fff;font-size:32px;margin-bottom:12px;">Highlight Title</h2>'+
      '<p data-editable style="color:rgba(255,255,255,.75);font-size:16px;max-width:600px;margin:0 auto;line-height:1.8;">Add a key message or call to action here.</p></div>';
  } else if(type==='divider-text'){
    inner='<div class="container"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 28px;"><p data-editable style="font-size:15px;color:#374151;line-height:1.9;">Add your text here.</p></div>';
  }

  var sec=document.createElement('section');
  sec.className='editable-section'; sec.id=uid;
  sec.style.cssText=bg;
  sec.innerHTML=inner;

  var ref=_addSecRef?document.getElementById(_addSecRef):null;
  if(ref){
    if(_addSecPos==='before') ref.parentNode.insertBefore(sec,ref);
    else ref.parentNode.insertBefore(sec, ref.nextSibling);
  } else {
    var zone=document.getElementById('custom-sections-zone');
    if(zone) zone.appendChild(sec);
  }

  sec.querySelectorAll('[data-editable]').forEach(function(el){el.contentEditable='true';});
  refreshSectionControls();
}

function PLACEHOLDER_IMG(w,h){
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='"+w+"' height='"+h+"'%3E%3Crect width='"+w+"' height='"+h+"' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='16' font-family='sans-serif'%3EClick to upload image%3C%2Ftext%3E%3C%2Fsvg%3E";
}

/* ── ADD BLOCK MODAL ────────────────────────────────────────── */
var _blockZone=null;
function showAddBlockModal(zoneId){
  _blockZone=zoneId;
  document.getElementById('block-modal').style.display='flex';
}
function closeBlockModal(){ document.getElementById('block-modal').style.display='none'; }

function addBlock(type){
  closeBlockModal();
  var zone=typeof _blockZone==='string'?document.getElementById(_blockZone):_blockZone;
  if(!zone){console.warn('No zone'); return;}
  var uid='blk'+Date.now(), inner='';

  if(type==='text'){
    inner='<p data-editable style="font-size:15px;color:#374151;line-height:1.9;">Click to edit this text. Add your paragraph here.</p>';
  } else if(type==='heading'){
    inner='<h3 data-editable style="font-family:\'DM Serif Display\',serif;font-size:22px;color:#0f2942;margin-bottom:6px;">Your Heading</h3>'+
          '<p data-editable style="font-size:13px;font-weight:700;color:#0e7490;text-transform:uppercase;letter-spacing:.8px;">Subtitle</p>';
  } else if(type==='image'){
    var iid=uid+'i';
    inner='<div class="cb-img-wrap" onclick="if(EDIT)openImgModal(null,\''+iid+'\')">'+
      '<img id="'+iid+'" src="'+PLACEHOLDER_IMG(700,360)+'" style="width:100%;display:block;border-radius:10px;"></div>'+
      '<p data-editable style="font-size:12px;color:#9ca3af;text-align:center;margin-top:6px;font-style:italic;">Caption (click to edit)</p>';
  } else if(type==='img-text'){
    var iid=uid+'i';
    inner='<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center;">'+
      '<div class="cb-img-wrap" onclick="if(EDIT)openImgModal(null,\''+iid+'\')"><img id="'+iid+'" src="'+PLACEHOLDER_IMG(400,260)+'" style="width:100%;border-radius:10px;object-fit:cover;"></div>'+
      '<div><h4 data-editable style="font-family:\'DM Serif Display\',serif;font-size:18px;color:#0f2942;margin-bottom:8px;">Heading</h4>'+
      '<p data-editable style="font-size:14px;color:#374151;line-height:1.85;">Your text goes here.</p></div></div>';
  } else if(type==='text-img'){
    var iid=uid+'i';
    inner='<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center;">'+
      '<div><h4 data-editable style="font-family:\'DM Serif Display\',serif;font-size:18px;color:#0f2942;margin-bottom:8px;">Heading</h4>'+
      '<p data-editable style="font-size:14px;color:#374151;line-height:1.85;">Your text goes here.</p></div>'+
      '<div class="cb-img-wrap" onclick="if(EDIT)openImgModal(null,\''+iid+'\')"><img id="'+iid+'" src="'+PLACEHOLDER_IMG(400,260)+'" style="width:100%;border-radius:10px;object-fit:cover;"></div></div>';
  } else if(type==='highlight'){
    inner='<div style="background:#e8f6fa;border:1px solid rgba(14,116,144,.2);border-left:4px solid #0e7490;border-radius:10px;padding:18px 22px;">'+
      '<strong data-editable style="color:#0f2942;font-size:14px;display:block;margin-bottom:6px;">Highlight Title</strong>'+
      '<p data-editable style="font-size:14px;color:#374151;line-height:1.8;margin:0;">Your callout text.</p></div>';
  } else if(type==='two-col'){
    inner='<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">'+
      '<p data-editable style="font-size:14px;color:#374151;line-height:1.85;">Left column text.</p>'+
      '<p data-editable style="font-size:14px;color:#374151;line-height:1.85;">Right column text.</p></div>';
  } else if(type==='divider'){
    inner='<hr style="border:none;border-top:2px solid #e5e7eb;margin:8px 0;">';
  } else if(type==='quote'){
    inner='<blockquote style="border-left:4px solid #0e7490;padding:14px 20px;background:#f8fafc;border-radius:0 10px 10px 0;">'+
      '<p data-editable style="font-size:16px;font-style:italic;color:#374151;line-height:1.75;">Your quote or key statement here.</p>'+
      '<cite data-editable style="font-size:12px;color:#9ca3af;margin-top:6px;display:block;">— Source</cite></blockquote>';
  }

  var wrap=document.createElement('div');
  wrap.className='cb'; wrap.id=uid;
  wrap.innerHTML='<div class="cb-actions">'+
    '<button class="cba" onclick="moveCB(\''+uid+'\',\'up\')" title="Move up">↑</button>'+
    '<button class="cba" onclick="moveCB(\''+uid+'\',\'down\')" title="Move down">↓</button>'+
    '<button class="cba" onclick="copyCB(\''+uid+'\')" title="Copy block">⎘</button>'+
    '<button class="cba" onclick="pasteCB(\''+uid+'\',\'before\')" title="Paste before">⏎↑</button>'+
    '<button class="cba" onclick="pasteCB(\''+uid+'\',\'after\')" title="Paste after">⏎↓</button>'+
    '<button class="cba cba-del" onclick="deleteCB(\''+uid+\')" title="Delete">✕</button>'+
    '</div>'+inner;
  zone.appendChild(wrap);
  wrap.querySelectorAll('[data-editable]').forEach(function(el){el.contentEditable='true';});
}

function moveCB(id,dir){
  var el=document.getElementById(id); if(!el)return;
  if(dir==='up'&&el.previousElementSibling) el.parentNode.insertBefore(el,el.previousElementSibling);
  else if(dir==='down'&&el.nextElementSibling) el.parentNode.insertBefore(el.nextElementSibling,el);
}
function copyCB(id){
  var el=document.getElementById(id); if(!el)return;
  var clone=el.cloneNode(true);
  clone.querySelector('.cb-actions')&&clone.querySelector('.cb-actions').remove();
  _clipboard='__BLOCK__'+clone.outerHTML;
  showToast('Block copied!');
}
function pasteCB(refId,pos){
  if(!_clipboard||!_clipboard.startsWith('__BLOCK__')){showToast('No block copied.');return;}
  var html=_clipboard.replace('__BLOCK__','');
  var tmp=document.createElement('div'); tmp.innerHTML=html;
  var newEl=tmp.firstElementChild;
  newEl.id='blk'+Date.now();
  var ref=document.getElementById(refId); if(!ref)return;
  if(pos==='before') ref.parentNode.insertBefore(newEl,ref);
  else ref.parentNode.insertBefore(newEl,ref.nextSibling);
  newEl.querySelectorAll('[data-editable]').forEach(function(el){el.contentEditable='true';});
  showToast('Block pasted!');
}
function deleteCB(id){ if(confirm('Delete this block?')) document.getElementById(id)&&document.getElementById(id).remove(); }

/* ── IMAGE EDITOR ───────────────────────────────────────────── */
function openImgModal(targetId, fallbackId){
  _imgTargetEl = targetId ? document.getElementById(targetId) : document.getElementById(fallbackId);
  IS={img:null,zoom:100,rot:0,panX:0,panY:0,shape:'free',drag:false,lx:0,ly:0};
  document.getElementById('img-canvas-area').style.display='none';
  document.getElementById('img-upload-zone').style.display='block';
  document.getElementById('img-file-in').value='';
  document.getElementById('img-modal').style.display='flex';
  setImgShape('free');
  if(_imgTargetEl&&_imgTargetEl.src&&_imgTargetEl.src.startsWith('data:')){
    var i=new Image(); i.onload=function(){IS.img=i;imgReset();imgShowCanvas();}; i.src=_imgTargetEl.src;
  }
}
function closeImgModal(){ document.getElementById('img-modal').style.display='none'; }

function handleImgDrop(e){ e.preventDefault(); var f=e.dataTransfer.files[0]; if(f&&f.type.startsWith('image/')) readImgFile(f); }
function loadImgFile(e){ var f=e.target.files[0]; if(!f)return; readImgFile(f); }
function readImgFile(file){ var r=new FileReader(); r.onload=function(ev){var i=new Image();i.onload=function(){IS.img=i;imgReset();imgShowCanvas();};i.src=ev.target.result;}; r.readAsDataURL(file); }
function imgShowCanvas(){ document.getElementById('img-upload-zone').style.display='none'; document.getElementById('img-canvas-area').style.display='block'; imgRedraw(); }
function imgReset(){ IS.zoom=100;IS.rot=0;IS.panX=0;IS.panY=0; setImgShape('free'); document.getElementById('img-zoom').value=100; document.getElementById('img-rot').value=0; document.getElementById('img-bright').value=0; document.getElementById('img-contrast').value=0; document.getElementById('img-zoom-lbl').textContent='100%'; document.getElementById('img-rot-lbl').textContent='0°'; if(IS.img)imgRedraw(); }
function setImgShape(s){ IS.shape=s; ['circle','square','rect','free'].forEach(function(id){var b=document.getElementById('sh-'+id);if(b)b.classList.toggle('on',id===s);}); imgRedraw(); }
function imgZoomChange(v){ IS.zoom=parseInt(v); document.getElementById('img-zoom-lbl').textContent=v+'%'; imgRedraw(); }
function imgRotChange(v){ IS.rot=parseInt(v); document.getElementById('img-rot-lbl').textContent=v+'°'; imgRedraw(); }
function imgRedraw(){
  if(!IS.img)return;
  var wrap=document.getElementById('img-canvas-wrap');
  var sz=Math.min(wrap.clientWidth||400,440);
  var ch=IS.shape==='rect'?Math.round(sz*.68):IS.shape==='circle'?sz:Math.round(sz*.7);
  var cv=document.getElementById('img-canvas');
  cv.width=sz; cv.height=ch;
  var ctx=cv.getContext('2d');
  ctx.clearRect(0,0,sz,ch);
  ctx.save();
  ctx.beginPath();
  if(IS.shape==='circle'){ctx.arc(sz/2,ch/2,Math.min(sz,ch)/2-2,0,Math.PI*2);}
  else{ctx.rect(0,0,sz,ch);}
  ctx.clip();
  ctx.translate(sz/2+IS.panX,ch/2+IS.panY);
  ctx.rotate(IS.rot*Math.PI/180);
  var sc=IS.zoom/100, fw=IS.img.naturalWidth, fh=IS.img.naturalHeight;
  var fit=Math.max(sz/fw,ch/fh);
  var dw=fw*fit*sc, dh=fh*fit*sc;
  var br=parseInt(document.getElementById('img-bright').value)||0;
  var co=parseInt(document.getElementById('img-contrast').value)||0;
  ctx.filter='brightness('+(100+br)+'%) contrast('+(100+co)+'%)';
  ctx.drawImage(IS.img,-dw/2,-dh/2,dw,dh);
  ctx.restore();
}
function imgApply(){
  var sz=480, ch=IS.shape==='rect'?320:IS.shape==='circle'?480:360;
  var ec=document.createElement('canvas'); ec.width=sz; ec.height=ch;
  var ctx=ec.getContext('2d');
  ctx.clearRect(0,0,sz,ch); ctx.save(); ctx.beginPath();
  if(IS.shape==='circle'){ctx.arc(sz/2,ch/2,sz/2-2,0,Math.PI*2);} else{ctx.rect(0,0,sz,ch);}
  ctx.clip();
  ctx.translate(sz/2+IS.panX,ch/2+IS.panY); ctx.rotate(IS.rot*Math.PI/180);
  var sc=IS.zoom/100,fw=IS.img.naturalWidth,fh=IS.img.naturalHeight;
  var fit=Math.max(sz/fw,ch/fh); var dw=fw*fit*sc,dh=fh*fit*sc;
  var br=parseInt(document.getElementById('img-bright').value)||0;
  var co=parseInt(document.getElementById('img-contrast').value)||0;
  ctx.filter='brightness('+(100+br)+'%) contrast('+(100+co)+'%)';
  ctx.drawImage(IS.img,-dw/2,-dh/2,dw,dh); ctx.restore();
  if(_imgTargetEl) _imgTargetEl.src=ec.toDataURL('image/png');
  closeImgModal();
}

document.addEventListener('DOMContentLoaded', function(){
  var cv=document.getElementById('img-canvas');
  if(!cv) return;
  cv.addEventListener('mousedown',function(e){IS.drag=true;IS.lx=e.clientX;IS.ly=e.clientY;cv.style.cursor='grabbing';});
  cv.addEventListener('touchstart',function(e){IS.drag=true;IS.lx=e.touches[0].clientX;IS.ly=e.touches[0].clientY;},{passive:true});
  document.addEventListener('mousemove',function(e){if(!IS.drag)return;IS.panX+=e.clientX-IS.lx;IS.panY+=e.clientY-IS.ly;IS.lx=e.clientX;IS.ly=e.clientY;imgRedraw();});
  document.addEventListener('touchmove',function(e){if(!IS.drag)return;IS.panX+=e.touches[0].clientX-IS.lx;IS.panY+=e.touches[0].clientY-IS.ly;IS.lx=e.touches[0].clientX;IS.ly=e.touches[0].clientY;imgRedraw();},{passive:true});
  document.addEventListener('mouseup',function(){IS.drag=false;var c=document.getElementById('img-canvas');if(c)c.style.cursor='grab';});
  document.addEventListener('touchend',function(){IS.drag=false;});
  cv.addEventListener('wheel',function(e){e.preventDefault();IS.zoom=Math.min(300,Math.max(30,IS.zoom-(e.deltaY>0?5:-5)));document.getElementById('img-zoom').value=IS.zoom;document.getElementById('img-zoom-lbl').textContent=IS.zoom+'%';imgRedraw();},{passive:false});
});

/* ── TOAST ──────────────────────────────────────────────────── */
function showToast(msg){
  var t=document.getElementById('editor-toast');
  if(!t){t=document.createElement('div');t.id='editor-toast';t.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#0f2942;color:#fff;padding:9px 22px;border-radius:30px;font-size:13px;font-weight:700;font-family:"DM Sans",sans-serif;z-index:9999;pointer-events:none;transition:opacity .3s;';document.body.appendChild(t);}
  t.textContent=msg; t.style.opacity='1';
  clearTimeout(t._t); t._t=setTimeout(function(){t.style.opacity='0';},2500);
}

/* ── CONTACT FORM ───────────────────────────────────────────── */
function sendMsg(){
  var n=document.getElementById('cn'), e=document.getElementById('ce');
  if(!n||!n.value||!e||!e.value){alert('Please fill name and email.');return;}
  document.getElementById('form-ok').style.display='block';
  ['cn','ce','cs','cm'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  setTimeout(function(){document.getElementById('form-ok').style.display='none';},4000);
}

/* ── SAVE & DOWNLOAD ────────────────────────────────────────── */
function savePage(){
  if(EDIT) toggleEdit();
  setTimeout(function(){
    var clone=document.documentElement.cloneNode(true);
    ['#edit-bar','#img-modal','#block-modal','#section-modal','#editor-toast'].forEach(function(sel){
      var el=clone.querySelector(sel); if(el) el.remove();
    });
    clone.querySelectorAll('.sec-ctrl-bar,.cb-actions').forEach(function(el){el.remove();});
    var html='<!DOCTYPE html>\n'+clone.outerHTML;
    var blob=new Blob([html],{type:'text/html'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=document.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+$/,'')+'.html';
    a.click(); setTimeout(function(){URL.revokeObjectURL(a.href);},1500);
  },200);
}

/* ── NAV & SCROLL ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',function(){
  var burger=document.getElementById('burger'), mobNav=document.getElementById('mob-nav'), mobClose=document.getElementById('mob-close');
  if(burger) burger.addEventListener('click',function(){mobNav.classList.add('open');});
  if(mobClose) mobClose.addEventListener('click',function(){mobNav.classList.remove('open');});
  // scroll reveal
  var ro=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting)e.target.classList.add('in');});},{threshold:.07});
  document.querySelectorAll('.reveal').forEach(function(el){ro.observe(el);});
  // nav scroll shadow
  window.addEventListener('scroll',function(){
    var nav=document.getElementById('main-nav');
    if(nav) nav.classList.toggle('scrolled',window.scrollY>10);
  });
});
