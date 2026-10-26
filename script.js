
let audioCtx = null;
let isPlaying = false;
let musicAudio = null;
let visualizerInterval = null;
let crtActive = true;
let currentTrackIndex = 0;

const tracks = [
  { name: "01. Linkin Park - A Place For My Head.mp3", src: "audio/A Place For My Head (Official Audio) - Linkin Park.mp3" },
  { name: "02. Slipknot - Disasterpiece.mp3", src: "audio/Slipknot - Disasterpiece (Audio).mp3" },
  { name: "03. System Of A Down - Sugar.mp3", src: "audio/System Of A Down - Sugar.mp3" }
];

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  initMusicPlayer();
  startBootSequence();
  initSectionReveal();
  startUptimeCounter();
});

// ==================== BOOT SEQUENCE ====================
function startBootSequence() {
  const logs = [
    "> CHECKING MEMORY: 65536KB OK",
    "> LOADING AUDIO SYNTHESIZER ENGINE...",
    "> MOUNTING PHOTO GALLERY DATABASE...",
    "> LOADING FILM COLLECTION INDEX...",
    "> SYSTEM READY. LAUNCHING PORTFOLIO..."
  ];

  let logIndex = 0;
  let percent = 0;
  const logContainer = document.getElementById('bootLogs');
  const progressBar = document.getElementById('progressBar');
  const loadPercent = document.getElementById('loadPercent');
  const introLoader = document.getElementById('introLoader');

  const interval = setInterval(() => {
    percent += 5;
    progressBar.style.width = percent + '%';
    loadPercent.innerText = percent + '%';

    if (percent % 20 === 0 && logIndex < logs.length) {
      const p = document.createElement('p');
      p.innerText = logs[logIndex];
      logContainer.appendChild(p);
      logIndex++;
    }

    if (percent >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        introLoader.style.opacity = '0';
        setTimeout(() => {
          introLoader.style.display = 'none';
        }, 700);
      }, 300);
    }
  }, 100);

  // Skip boot on click
  introLoader.addEventListener('click', () => {
    clearInterval(interval);
    initAudioOnInteraction();
    introLoader.style.opacity = '0';
    setTimeout(() => {
      introLoader.style.display = 'none';
    }, 300);
  });
}

// ==================== SECTION REVEAL ON SCROLL ====================
function initSectionReveal() {
  const sections = document.querySelectorAll('.section-reveal');

  // First hide them via JS (so they're visible if JS fails)
  sections.forEach(section => section.classList.add('unrevealed'));

  // Small delay so the browser paints the hidden state before observing
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('unrevealed');
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    sections.forEach(section => observer.observe(section));
  }, 100);
}

// ==================== UPTIME COUNTER ====================
function startUptimeCounter() {
  const el = document.getElementById('uptimeCounter');
  if (!el) return;

  let seconds = 0;
  setInterval(() => {
    seconds++;
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    el.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

// ==================== AUDIO ====================
function initAudioOnInteraction() {
  togglePlayMusic();
}

function playGuitarRiff() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const notes = [110, 110, 130.81, 110, 146.83, 130.81, 110, 98];
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playDistortedNote(freq, 0.25);
    }, idx * 180);
  });
}

function playChord(freq) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  playDistortedNote(freq, 0.5);
  playDistortedNote(freq * 1.5, 0.5);
}

function playDistortedNote(freq, duration) {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// ==================== MUSIC PLAYER ====================
function initMusicPlayer() {
  musicAudio = new Audio();
  musicAudio.preload = "metadata";
  musicAudio.volume = Number(document.getElementById('volumeSlider').value);
  musicAudio.addEventListener('play', () => {
    isPlaying = true;
    updateMusicPlayerState();
  });
  musicAudio.addEventListener('pause', () => {
    isPlaying = false;
    updateMusicPlayerState();
  });
  musicAudio.addEventListener('timeupdate', () => {
    document.getElementById('trackTime').innerText = formatTime(musicAudio.currentTime);
  });
  musicAudio.addEventListener('ended', nextTrack);
  musicAudio.addEventListener('error', () => {
    console.error(`Unable to load audio track: ${tracks[currentTrackIndex].src}`, musicAudio.error);
    isPlaying = false;
    updateMusicPlayerState();
  });
  loadTrack();
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function loadTrack() {
  const track = tracks[currentTrackIndex];
  musicAudio.src = track.src;
  document.getElementById('trackName').innerText = track.name;
  document.getElementById('trackTime').innerText = '00:00';
}

function updateMusicPlayerState() {
  const playBtn = document.getElementById('playBtn');
  const cdVisual = document.getElementById('cdVisual');

  if (isPlaying) {
    playBtn.innerText = "PAUSE";
    cdVisual.classList.add('animate-spin-slow');
    clearInterval(visualizerInterval);
    visualizerInterval = setInterval(() => {
      animateVisBars();
    }, 150);
  } else {
    playBtn.innerText = "PLAY";
    cdVisual.classList.remove('animate-spin-slow');
    clearInterval(visualizerInterval);
  }
}

function playCurrentTrack() {
  musicAudio.play().catch(error => {
    console.error(`Unable to play audio track: ${tracks[currentTrackIndex].src}`, error);
  });
}

function togglePlayMusic() {
  if (!musicAudio) return;

  if (isPlaying) {
    musicAudio.pause();
  } else {
    playCurrentTrack();
  }
}

function animateVisBars() {
  const bars = document.querySelectorAll('.vis-bar');
  bars.forEach(bar => {
    const h = Math.floor(Math.random() * 24) + 4;
    bar.style.height = h + 'px';
  });
}

function nextTrack() {
  const wasPlaying = isPlaying;
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  loadTrack();
  if (wasPlaying) playCurrentTrack();
}

function prevTrack() {
  const wasPlaying = isPlaying;
  currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  loadTrack();
  if (wasPlaying) playCurrentTrack();
}

function setVolume(val) {
  if (musicAudio) musicAudio.volume = Number(val);
}

function toggleCRT() {
  const crt = document.getElementById('crtOverlay');
  const status = document.getElementById('crtStatus');
  crtActive = !crtActive;

  if (crtActive) {
    crt.style.display = 'block';
    status.innerText = 'ON';
    status.className = 'text-metal-toxic';
  } else {
    crt.style.display = 'none';
    status.innerText = 'OFF';
    status.className = 'text-metal-crimson';
  }
}

function toggleWinamp() {
  const winamp = document.getElementById('winampPlayer');
  const isHidden = window.getComputedStyle(winamp).display === 'none';
  winamp.style.display = isHidden ? 'block' : 'none';
}

// ==================== SFX ====================
function playSFX(freq) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

// ==================== SMOOTH SCROLL ====================
function smoothScrollToSection(event, targetId) {
  event.preventDefault();
  const targetElement = document.getElementById(targetId);

  if (targetElement) {
    playSFX(900);

    const headerOffset = 70;
    const elementPosition = targetElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }
}

// ==================== LIGHTBOX (PHOTO GALLERY) ====================
function openLightbox(el) {
  const img = el.querySelector('img');
  const caption = el.querySelector('.font-orbitron');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');

  if (img) {
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
  }
  if (caption) {
    lightboxCaption.textContent = caption.textContent;
  }

  lightbox.classList.remove('hidden');
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
  playSFX(1200);

  // Re-init lucide icons for the lightbox close button
  if (window.lucide) lucide.createIcons();
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.add('hidden');
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

// Close lightbox on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
  }
});

// ==================== TERMINAL ====================
document.addEventListener('DOMContentLoaded', () => {
  const termInput = document.getElementById('terminalInput');
  const termOutput = document.getElementById('terminalOutput');
  const termPrompt = document.getElementById('terminalPrompt');

  if (!termInput || !termOutput || !termPrompt) return;

  const sections = {
    about: 'about',
    skills: 'skills',
    project: 'projects',
    projects: 'projects',
    gallery: 'gallery',
    galleries: 'gallery',
    film: 'films',
    films: 'films',
    terminal: 'terminal',
    term: 'terminal',
    contact: 'contact',
    home: 'hero',
    '~': 'hero',
    '..': 'hero'
  };

  function appendTerminalLine(text, className = 'text-metal-cyan mb-2') {
    const line = document.createElement('div');
    line.className = className;
    line.textContent = text;
    termOutput.appendChild(line);
    termOutput.scrollTop = termOutput.scrollHeight;
  }

  function changeDirectory(destination) {
    const sectionId = sections[destination.replace(/^\/+|\/+$/g, '')];
    if (!sectionId || !document.getElementById(sectionId)) {
      appendTerminalLine(`Section not found: '${destination}'. Type 'ls' to see available sections.`, 'text-metal-crimson mb-2');
      return;
    }

    termPrompt.textContent = `guest@Yazid-os:/${sectionId === 'hero' ? '~' : sectionId}$`;
    smoothScrollToSection(new Event('click'), sectionId);
    appendTerminalLine(`Navigating to /${sectionId === 'hero' ? '~' : sectionId} ...`);
  }

  termInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;

    const rawCommand = termInput.value.trim();
    if (!rawCommand) return;
    termInput.value = '';

    appendTerminalLine(`${termPrompt.textContent} ${rawCommand}`, 'text-white');

    const [command, ...args] = rawCommand.toLowerCase().split(/\s+/);
    const argument = args[0];

    switch (command) {
      case 'help':
        appendTerminalLine('COMMANDS: cd <about|skills|projects|gallery|films|terminal|contact|..>, tracks, play [number], pause, next, prev, ls, riff, clear');
        break;
      case 'ls':
        appendTerminalLine('about  skills  projects  gallery  films  terminal  contact');
        break;
      case 'tracks':
        tracks.forEach((track, index) => {
          appendTerminalLine(`${index + 1}. ${track.name}`);
        });
        break;
      case 'cd': {
        if (!argument) {
          appendTerminalLine('Usage: cd <section> (example: cd about, cd contact, cd ..)');
          break;
        }
        changeDirectory(argument);
        break;
      }
      case 'play': {
        if (args.length > 1 || (argument && !/^\d+$/.test(argument))) {
          appendTerminalLine('Usage: play [track number]. Example: play 2', 'text-metal-crimson mb-2');
          break;
        }

        if (argument) {
          const trackNumber = Number(argument);
          if (trackNumber < 1 || trackNumber > tracks.length) {
            appendTerminalLine(`Track not found. Choose a number from 1 to ${tracks.length}.`, 'text-metal-crimson mb-2');
            break;
          }
          currentTrackIndex = trackNumber - 1;
          loadTrack();
        }

        playCurrentTrack();
        appendTerminalLine(`Playing track ${currentTrackIndex + 1}: ${tracks[currentTrackIndex].name}`);
        break;
      }
      case 'pause':
        if (musicAudio && !musicAudio.paused) {
          musicAudio.pause();
          appendTerminalLine('Playback paused.');
        } else {
          appendTerminalLine('No track is currently playing.');
        }
        break;
      case 'next':
        nextTrack();
        appendTerminalLine(`Selected track ${currentTrackIndex + 1}: ${tracks[currentTrackIndex].name}`);
        break;
      case 'prev':
        prevTrack();
        appendTerminalLine(`Selected track ${currentTrackIndex + 1}: ${tracks[currentTrackIndex].name}`);
        break;
      case 'about':
      case 'skills':
      case 'projects':
      case 'gallery':
      case 'films':
      case 'terminal':
      case 'contact':
        changeDirectory(command);
        break;
      case 'riff':
        playGuitarRiff();
        appendTerminalLine('>>> PLAYING HEAVY NU-METAL RIFF...');
        break;
      case 'clear':
        termOutput.replaceChildren();
        break;
      default:
        appendTerminalLine(`Command not recognized: '${command}'. Type 'help' for available commands.`, 'text-metal-crimson mb-2');
    }
  });
});
