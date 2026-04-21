// UUID & Hash Generator

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function uuidv1() {
  const now = Date.now();
  const ts = now.toString(16).padStart(12, '0');
  const rand = 'xxxxxxxxxxxx'.replace(/x/g, () => Math.random().toString(16)[0]);
  return `${ts.slice(0, 8)}-${ts.slice(8, 12)}-1xxx-${rand.slice(0, 4)}${rand.slice(4, 12)}`.replace(/[xy]/g, c => {
    if (c === 'x') return Math.random().toString(16)[0];
    return (parseInt(Math.random().toString(16)[0], 16) & 0x3 | 0x8).toString(16);
  });
}

function uuidv7() {
  const now = Date.now();
  const ts = now.toString(16).padStart(12, '0');
  const rand = 'xxxxxxxxxxxx'.replace(/x/g, () => Math.random().toString(16)[0]);
  return `${ts.slice(0, 8)}-${ts.slice(8, 12)}-7xxx-${rand.slice(0, 4)}${rand.slice(4, 12)}`.replace(/[xy]/g, c => {
    if (c === 'x') return Math.random().toString(16)[0];
    return (parseInt(Math.random().toString(16)[0], 16) & 0x3 | 0x8).toString(16);
  });
}

function formatUUID(uuid, format) {
  switch (format) {
    case 'uppercase': return uuid.toUpperCase();
    case 'nohyphen': return uuid.replace(/-/g, '');
    default: return uuid;
  }
}

async function hashString(str, algo) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  
  if (algo === 'md5' || algo === 'ripemd') {
    return simpleHash(str, algo);
  }
  
  const hashBuffer = await crypto.subtle.digest(algo.toUpperCase().replace('-', ''), data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function simpleHash(str, algo) {
  let hash = 0;
  if (algo === 'md5') {
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0').repeat(4).slice(0, 32);
  }
  if (algo === 'ripemd') {
    let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      h0 = ((h0 + char) | 0) >>> 0;
      h1 = ((h1 + (h0 >>> 4)) | 0) >>> 0;
      h2 = ((h2 + (h1 >>> 8)) | 0) >>> 0;
      h3 = ((h3 + (h2 >>> 12)) | 0) >>> 0;
    }
    return [h0, h1, h2, h3].map(x => x.toString(16).padStart(8, '0')).join('');
  }
  return '';
}

document.addEventListener('DOMContentLoaded', () => {
  const uuidVersion = document.getElementById('uuid-version');
  const uuidQuantity = document.getElementById('uuid-quantity');
  const uuidFormatBtns = document.querySelectorAll('.mode-btn[data-format]');
  const uuidGenerateBtn = document.getElementById('uuid-generate');
  const uuidCopyBtn = document.getElementById('uuid-copy');
  const uuidOutput = document.getElementById('uuid-output');
  
  const hashInput = document.getElementById('hash-input');
  const hashAlgoBtns = document.querySelectorAll('.filter-btn[data-algo]');
  const hashGenerateBtn = document.getElementById('hash-generate');
  const hashCopyBtn = document.getElementById('hash-copy');
  const hashOutput = document.getElementById('hash-output');
  
  let uuidFormat = 'standard';
  let hashAlgo = 'md5';
  
  uuidFormatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      uuidFormatBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      uuidFormat = btn.dataset.format;
    });
  });
  
  uuidGenerateBtn.addEventListener('click', () => {
    const version = uuidVersion.value;
    const quantity = Math.min(100, Math.max(1, parseInt(uuidQuantity.value) || 1));
    const uuids = [];
    
    for (let i = 0; i < quantity; i++) {
      let uuid;
      switch (version) {
        case 'v1': uuid = uuidv1(); break;
        case 'v7': uuid = uuidv7(); break;
        default: uuid = uuidv4();
      }
      uuids.push(formatUUID(uuid, uuidFormat));
    }
    
    uuidOutput.textContent = uuids.join('\n');
    window.jctHistory?.save('uuid', { version, quantity, format: uuidFormat });
  });
  
  uuidCopyBtn.addEventListener('click', () => {
    if (uuidOutput.textContent) {
      copyToClipboard(uuidOutput.textContent, uuidCopyBtn);
    }
  });
  
  hashAlgoBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      hashAlgoBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      hashAlgo = btn.dataset.algo;
    });
  });
  
  hashGenerateBtn.addEventListener('click', async () => {
    const text = hashInput.value;
    if (!text) {
      hashInput.focus();
      return;
    }
    
    try {
      const hash = await hashString(text, hashAlgo);
      hashOutput.textContent = hash;
      window.jctHistory?.save('hash', { algo: hashAlgo, input: text.slice(0, 20) });
    } catch (e) {
      hashOutput.textContent = 'Error generating hash';
    }
  });
  
  hashCopyBtn.addEventListener('click', () => {
    if (hashOutput.textContent) {
      copyToClipboard(hashOutput.textContent, hashCopyBtn);
    }
  });
});