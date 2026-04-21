// Lorem Ipsum Generator with creative variations

const LoremData = {
  classic: ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'],
  
  corporate: ['synergy', 'leverage', 'disrupt', 'innovate', 'paradigm', 'transform', 'scalable', 'value-add', 'proactive', 'holistic', 'robust', 'seamless', 'streamline', 'optimize', 'empower', 'strategic', 'visionary', 'mission-critical', 'best-in-class', 'cutting-edge', 'game-changing', 'win-win', 'ecosystem', 'market-driven', 'customer-centric', 'data-driven', 'agile', 'enterprise', 'verticals', 'touchpoints', 'deliverables', 'KPIs', 'ROI', 'actionable', 'insights', 'roadmap', 'milestones', 'stakeholders', 'buy-in', 'bandwidth', 'deep-dive', 'circle back', 'low-hanging fruit', 'moving the needle', 'core competency', 'pain points', 'value proposition'],
  
  tech: ['API', 'cloud-native', 'microservices', 'blockchain', 'AI', 'machine learning', 'deep learning', 'neural network', ' DevOps', 'CI/CD', 'Kubernetes', 'Docker', 'serverless', 'edge computing', '5G', 'IoT', 'big data', 'analytics', 'SaaS', 'PaaS', 'IaaS', 'GDPR', 'encryption', 'authentication', 'OAuth', 'JWT', 'REST', 'GraphQL', 'WebSocket', 'lambda', 'function', 'container', 'orchestration', 'deployment', 'pipeline', 'testing', 'TDD', 'BDD', 'scrum', 'sprint', 'backlog', 'story points', 'velocity', 'stand-up', 'retrospective', 'MVP', 'POC', 'tech debt', 'refactoring', 'code review', 'pull request', 'merge', 'branch', 'commit', 'push'],
  
  hipster: ['artisanal', 'handcrafted', 'small-batch', 'local', 'sustainable', 'organic', 'farm-to-table', 'slow food', 'vintage', 'retro', 'upcycled', 'repurposed', 'thrift', 'antiques', 'handmade', 'bespoke', 'curated', 'authentic', 'rustic', 'charming', 'cozy', 'welcoming', 'unique', 'one-of-a-kind', 'limited edition', 'exclusive', 'rare', 'collectible', 'heritage', 'craft', 'workshop', 'studio', 'atelier', 'boutique', 'espresso', 'roasters', 'pour-over', 'cold brew', 'single-origin', 'fair trade', 'ethically sourced', 'conscious', 'mindful', 'zen', 'minimalist', 'aesthetic', 'photogenic', 'instagrammable', 'exposure', 'golden hour', 'natural light', 'film', 'polaroid', 'lo-fi', 'vhs', 'cassette', 'vinyl'],
  
  pirate: ['arrr', 'matey', 'ahoy', 'ye', 'yer', 'booty', 'treasure', 'ship', 'crew', 'captain', 'first mate', 'quartermaster', 'bosun', 'gunner', 'sailing', 'voyage', 'adventure', 'seas', 'ocean', 'wave', 'storm', 'tempest', 'kraken', 'sea monster', 'mermaid', 'siren', 'island', 'desert island', 'treasure map', 'X marks the spot', 'buried gold', 'doubloons', 'pieces of eight', 'spanish gold', 'pirate flag', 'Jolly Roger', 'blackbeard', 'hook', 'wooden leg', 'eye patch', 'parrot', 'captain\'s quarters', 'deck', 'crow\'s nest', 'sail', 'mast', 'hull', 'keel', 'port', 'starboard', 'bow', 'stern', 'anchor', 'rope', 'rum', 'grog', 'carousing', 'sing songs', 'Yo Ho Ho'],
  
  zombie: ['brains', 'undead', 'walker', 'horde', 'infection', 'outbreak', 'survivor', 'apocalypse', 'wasteland', 'restrained', 'quarantine', 'bite', 'contagion', 'virus', 'mutated', 'reanimated', 'corpse', 'graveyard', 'cemetery', 'tomb', 'crypt', 'coffin', 'decayed', 'rotting', 'flesh', 'blood', 'guts', 'splatter', 'horror', 'terror', 'screaming', 'running', 'hiding', 'trapped', 'desperate', 'hope', 'fading', 'survival', 'weapons', 'machete', 'shotgun', 'barricade', 'supplies', 'rations', 'water', 'safe house', 'radio', 'signal', 'military', 'experiment', 'government', 'conspiracy', 'lab', 'specimen', 'research', 'vaccine', 'cure', 'escape'],
  
  meow: ['meow', 'purr', 'nya', 'whiskers', 'tail', 'fur', 'paw', 'claw', 'kitten', 'cat', 'feline', 'tabby', 'calico', 'siamese', 'persian', 'maine coon', 'sphynx', 'ragdoll', 'bengal', 'russian blue', 'scottish fold', 'british shorthair', 'kitty', 'mittens', 'fluffy', 'graceful', 'agile', 'curious', 'playful', 'sleepy', 'nap', 'sunbeam', 'windowsill', 'cardboard box', 'yarn', 'feather', 'laser pointer', 'treat', 'tuna', 'salmon', 'milk', 'bowl', 'litter box', 'scratching post', 'cat tree', 'window', 'bird watching', 'indoor hunter', 'zoomies', 'midnight crazies', 'loaf', 'blep', 'mlem', 'prrr', 'trill', 'chirp', 'yowl', 'hiss'],
  
  chef: ['sauté', 'simmer', 'boil', 'braise', 'roast', 'grill', 'bake', 'poach', 'blanch', 'fry', 'caramelize', 'deglaze', 'reduction', 'emulsion', 'sauce', 'consommé', 'velouté', 'béchamel', 'hollandaise', 'roux', 'stock', 'broth', 'mirepoix', 'aromatics', 'herbs', 'thyme', 'rosemary', 'basil', 'parsley', 'cilantro', 'oregano', 'spices', 'cumin', 'paprika', 'cinnamon', 'nutmeg', 'saffron', 'truffle', 'foie gras', 'caviar', 'lobster', 'crab', 'scallop', 'salmon', 'tuna', 'filet', 'tenderloin', 'ribeye', 'sous vide', 'tempura', 'wok', 'cast iron', 'copper', 'knife', 'chef\'s knife', 'paring knife', 'cleaver', 'mandoline', 'thermometer', 'piping bag', 'pastry bag', 'ramekin', 'baking sheet', 'plating', 'garnish', 'presentation', 'umami', 'flavor', 'texture', 'temperature', 'fresh', 'local', 'organic', 'seasonal', 'farm-to-table', 'menu', 'tasting menu', 'à la carte', 'buffet', 'brunch', 'dinner service'],
  
  hacker: ['0day', 'exploit', 'vulnerability', 'CVE', 'payload', 'shellcode', 'buffer overflow', 'SQL injection', 'XSS', 'CSRF', 'RCE', 'LFI', 'RFI', 'SSRF', 'IDOR', 'authentication', 'authorization', 'privilege escalation', 'lateral movement', 'pivoting', 'persistence', 'backdoor', 'rootkit', 'keylogger', 'honeypot', 'SIEM', 'SOC', 'incident response', 'forensics', 'threat hunting', 'APT', 'nation state', 'botnet', 'DDoS', 'phishing', 'spear phishing', 'whaling', 'social engineering', 'pretexting', 'baiting', 'piggybacking', 'tailgating', ' dumpster diving', 'shoulder surfing', 'password', 'hash', 'salt', 'pepper', 'rainbow table', 'brute force', 'dictionary attack', 'mask attack', 'rule-based attack', 'GPU', 'cracking', 'WPA2', 'WPA3', 'WEP', 'handshake', 'PMKID', 'deauth', 'evil twin', 'MITM', 'ARP spoofing', 'DNS spoofing', 'SSL strip', 'certificate', 'PKI', 'TLS', 'SSL', 'HTTPS', 'proxy', 'VPN', 'TOR', 'I2P', 'onion', 'dark web', 'deep web', 'clearnet', 'CTF', 'bug bounty', 'pentest', 'red team', 'blue team', 'purple team', 'zero trust', 'hardening', 'firewall', 'IDS', 'IPS', 'WAF', 'sandbox', 'malware', 'ransomware', 'trojan', 'virus', 'worm', 'spyware', 'adware', 'rootkit', 'bootkit', 'firmware', 'UEFI', 'BIOS', 'kernel', 'memory', 'heap', 'stack', 'overflow', 'underflow', 'integer overflow', 'format string', 'race condition', 'TOCTOU', 'deadlock', 'race condition', 'reentrancy', 'deserialization', 'insecure deserialization', 'XXE', 'path traversal', 'LFI', 'RFI', 'SSTI', 'template injection', 'code injection', 'command injection', 'Laravel', 'Rails', 'Django', 'Spring', 'Express', 'Node.js', 'React', 'Angular', 'Vue', 'jQuery', 'vanilla', 'vanilla JS'],
  
  coffee: ['espresso', 'latte', 'cappuccino', 'americano', 'macchiato', 'mocha', 'flat white', 'cortado', 'ristretto', ' lungo', 'double', 'shot', 'brew', 'roast', 'dark', 'medium', 'light', 'blonde', 'fair trade', 'organic', 'single origin', 'ethiopian', 'colombian', 'kenyan', 'brazilian', 'guatemalan', ' costa rican', 'java', 'sumatra', 'mandheling', 'monsoon', 'barista', ' extraction', 'crema', 'foam', 'milk', 'steamed', 'whipped', 'oat milk', 'almond milk', 'soy milk', 'coconut milk', 'vanilla', 'caramel', 'hazelnut', 'mocha', 'peppermint', 'gingerbread', 'seasonal', 'pumpkin spice', 'PSL', 'iced', 'cold brew', 'nitro', 'pour over', 'chemex', 'v60', 'aeropress', 'french press', 'moka pot', 'drip', 'batch brew', 'coffeehouse', 'café', 'third wave', 'specialty', 'grade', 'score', 'cupping', 'tasting notes', 'chocolate', 'fruity', 'nutty', 'caramel', 'berry', 'citrus', 'floral', 'earthy', 'spicy', 'smooth', 'bold', 'rich', 'balanced', 'complex', 'aroma', 'fragrance', 'finish', 'aftertaste', 'body', 'acidity', 'mouthfeel', 'sip', 'savor', 'enjoy', 'caffeine', 'buzz', 'jitters', 'espresso bar', 'coffee shop', 'laptop', 'wifi', 'study', 'work', 'meeting', 'catch up', 'date', 'read', 'write', 'create', 'think', 'pause', 'moment', 'ritual', 'morning', 'afternoon', 'evening', 'daily', 'routine']
};

document.addEventListener('DOMContentLoaded', () => {
  const variationSelect = document.getElementById('lorem-variation');
  const parasSlider = document.getElementById('lorem-paras');
  const wordsSlider = document.getElementById('lorem-words');
  const parasVal = document.getElementById('lorem-paras-val');
  const wordsVal = document.getElementById('lorem-words-val');
  const startBtns = document.querySelectorAll('.mode-btn[data-start]');
  const generateBtn = document.getElementById('lorem-generate');
  const copyBtn = document.getElementById('lorem-copy');
  const output = document.getElementById('lorem-output');
  
  let startWithLorem = true;
  
  parasSlider.addEventListener('input', () => parasVal.textContent = parasSlider.value);
  wordsSlider.addEventListener('input', () => wordsVal.textContent = wordsSlider.value);
  
  startBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      startBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      startWithLorem = btn.dataset.start === 'yes';
    });
  });
  
  generateBtn.addEventListener('click', generate);
  copyBtn.addEventListener('click', () => output.textContent && copyToClipboard(output.textContent, copyBtn));
  
  function generate() {
    const variation = variationSelect.value;
    const numParas = parseInt(parasSlider.value);
    const wordsPerPara = parseInt(wordsSlider.value);
    
    const words = LoremData[variation];
    let result = [];
    
    for (let p = 0; p < numParas; p++) {
      const paraWords = [];
      const startIdx = (p === 0 && startWithLorem && variation === 'classic') ? 0 : Math.floor(Math.random() * 10);
      
      while (paraWords.length < wordsPerPara) {
        const word = words[(startIdx + paraWords.length) % words.length];
        paraWords.push(word);
      }
      
      let para = paraWords.join(' ');
      para = para.charAt(0).toUpperCase() + para.slice(1);
      result.push(para + '.');
    }
    
    output.textContent = result.join('\n\n');
    window.jctHistory?.save('lorem', { variation, numParas, wordsPerPara });
  }
});