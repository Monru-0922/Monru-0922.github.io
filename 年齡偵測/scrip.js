const triggerBtn = document.getElementById('triggerBtn');
const stopBtn = document.getElementById('stopBtn');
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud');
const logEl = document.getElementById('log');

let stream = null, animId = null, modelReady = false;
let ages = [];
const AVG_N = 15;     // 平滑用的移動平均
const STABLE_MS = 1200;
let lastStableT = 0;

const ROUTES = [
  { name: '兒童',   min: 0,  max: 12,  url: 'https://your-site/children'  },
  { name: '青少年', min: 13, max: 17,  url: 'https://your-site/teens'     },
  { name: '一般',   min: 18, max: 120, url: 'https://your-site/general'   },
];

function log(s){ console.log(s); logEl.textContent += s + '\n'; }
function setHud(t, ok=false){ hud.textContent=t; hud.style.borderColor = ok?'rgba(0,255,150,.25)':'rgba(255,255,255,.12)'; }

async function loadModels(){
  setHud('載入模型中…');
  await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
  await faceapi.nets.ageGenderNet.loadFromUri('./models');
  modelReady = true;
  setHud('模型就緒 ✅', true);
}

async function startCamera(){
  if (stream) stopCamera();
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width:{ideal:1280}, height:{ideal:720}, frameRate:{ideal:30} }, audio:false
  });
  video.srcObject = stream;
  await video.play().catch(()=>{});
  overlay.width = video.videoWidth || overlay.clientWidth;
  overlay.height = video.videoHeight || overlay.clientHeight;
  setHud('相機啟動', true);
}

function stopCamera(){
  if (animId) cancelAnimationFrame(animId); animId = null;
  if (stream){ stream.getTracks().forEach(t=>t.stop()); stream=null; }
  video.srcObject = null;
  ages = []; lastStableT = 0;
  setHud('已停止');
}

function rollingAvg(arr, n){
  const k = Math.min(arr.length, n);
  if (k===0) return null;
  let sum = 0; for (let i=arr.length-k; i<arr.length; i++) sum += arr[i];
  return sum / k;
}

function pickRoute(age){
  return ROUTES.find(r => age >= r.min && age <= r.max);
}

async function loop(){
  if (!modelReady || !stream) return;
  const ctx = overlay.getContext('2d');
  const opt = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.6 });

  const tick = async () => {
    if (!stream) return;
    const dets = await faceapi.detectAllFaces(video, opt).withAgeAndGender();
    ctx.clearRect(0,0,overlay.width,overlay.height);

    if (dets.length > 0){
      dets.sort((a,b)=>b.detection.box.area - a.detection.box.area);
      const res = dets[0];
      const { x,y,width,height } = res.detection.box;
      const age = res.age;
      ages.push(age); if (ages.length > 60) ages.shift();

      ctx.strokeStyle = 'rgba(0,255,170,0.9)'; ctx.lineWidth = 3; ctx.strokeRect(x,y,width,height);

      const avg = rollingAvg(ages, AVG_N);
      const text = `Age ~ ${avg ? Math.round(avg) : Math.round(age)}`;
      ctx.font = '18px system-ui,-apple-system,Segoe UI,Roboto';
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, y-26, tw+12, 22);
      ctx.fillStyle = '#9cffb5'; ctx.fillText(text, x+6, y-9);

      if (avg){
        const route = pickRoute(Math.round(avg));
        setHud(`偵測中：${Math.round(avg)} 歲 → ${route?.name ?? '未分類'}`, true);

        if (!lastStableT) lastStableT = performance.now();
        const elapsed = performance.now() - lastStableT;

        if (elapsed >= STABLE_MS && route){
          setHud(`導向：${route.name}`, true);
          stopCamera();
          window.location.href = route.url;
          return;
        }
      }
    } else {
      setHud('請站到框內', false);
      ages = []; lastStableT = 0;
    }
    animId = requestAnimationFrame(tick);
  };
  tick();
}

triggerBtn.addEventListener('click', async () => {
  logEl.textContent = '';
  try{
    if (!modelReady) await loadModels();
    await startCamera();
    await loop();
    triggerBtn.disabled = true;
    stopBtn.disabled = false;
  }catch(err){
    log(`啟動失敗：${err.name} - ${err.message}`);
    if (err.name === 'NotAllowedError') log('→ 請允許相機權限（瀏覽器 / 系統）。');
    if (err.name === 'NotFoundError') log('→ 沒偵測到相機 / 被別的程式占用。');
    if (err.name === 'SecurityError') log('→ 需要 HTTPS 或 localhost。');
  }
});

stopBtn.addEventListener('click', () => {
  stopCamera();
  triggerBtn.disabled=false;
  stopBtn.disabled=true;
});

loadModels().catch(e => log('模型載入失敗：'+e.message));
