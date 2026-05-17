```markdown
# 🤖 MIKU AI TERMINAL ASSISTANT

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

**AI Developer Copilot untuk Terminal**

</div>

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Instalasi](#-instalasi)
- [Cara Penggunaan](#-cara-penggunaan)
- [Menu Utama](#-menu-utama)
- [AI Modes](#-ai-modes)
- [Premium Config](#-premium-config)
- [GitHub Configuration](#-github-configuration)
- [File Operations](#-file-operations)
- [Terminal Commands](#-terminal-commands)
- [Project Analysis](#-project-analysis)
- [Struktur Project](#-struktur-project)
- [Konfigurasi](#-konfigurasi)
- [Troubleshooting](#-troubleshooting)

---

<div align="center">

## 📸 Preview

![MIKU AI TERMINAL](https://cdn.aceimg.com/a397e906a.jpg)

</div>

## 🚀 Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 💬 **AI Chat** | Chat dengan AI untuk bantu coding, debugging, refactor |
| 🌐 **Free Mode** | Pakai free endpoint tanpa API key |
| ⭐ **Premium Mode** | Support Groq, Gemini, OpenRouter, dll |
| 📝 **Multi Config** | Simpan banyak konfigurasi API, tinggal pilih |
| 🐙 **GitHub Integration** | Status, add, commit, push, pull dari terminal |
| 📁 **File Operations** | Baca, tulis, edit file langsung dari terminal |
| 💻 **Terminal Commands** | Jalankan command dengan whitelist safety |
| 📊 **Project Analysis** | Scan struktur project, dependencies, frameworks |

---

## 📦 Instalasi

### Prasyarat
- Node.js v18 atau lebih baru
- NPM atau Yarn

### Install dari Terminal

```bash
# Clone atau buat folder project
git clone https://github.com/miku-terminal/miku-ai.git
cd miku-ai

# Install dependencies
npm install

# Jalankan
npm start
```

Dependencies yang Digunakan

```json
{
  "dependencies": {
    "axios": "^1.7.7",
    "chalk": "^5.3.0",
    "boxen": "^8.0.1",
    "ora": "^8.1.0",
    "inquirer": "^12.0.0",
    "simple-git": "^3.25.0",
    "fs-extra": "^11.2.0"
  }
}
```

---

🎮 Cara Penggunaan

1. Jalankan Terminal

```bash
npm start
```

2. Tampilan Awal

```
  ╔═══════════════════════════════════════╗
  ║     🤖 MIKU AI TERMINAL ASSISTANT     ║
  ╚═══════════════════════════════════════╝

  ✓ Mode: free
  ✓ Provider: free
  ─────────────────────────────────────────
```

3. Pilih Menu

Gunakan arrow keys untuk navigasi, Enter untuk memilih.

---

📱 Menu Utama

```
? What would you like to do?
  💬  Start AI Chat
  🌐  Free Mode
  ⭐  Premium Mode
  📝  Manage Premium Configs
  🔧  Configure Free Endpoint
  🐙  GitHub Configuration
  📁  File Operations
  💻  Terminal Commands
  📊  Project Analysis
  ❌  Exit
```

---

🌐 AI Modes

Free Mode (No API Key)

· Menggunakan free endpoint publik
· Contoh: https://api.nexray.eu.cc/ai/gemini
· Tidak perlu API key
· Bisa ganti endpoint sendiri

```bash
# Pilih menu
🌐 Free Mode

# Atau konfigurasi endpoint sendiri
🔧 Configure Free Endpoint
```

Premium Mode (With API Key)

Supported Providers:

· Groq (mixtral, llama)
· Google Gemini (gemini-pro)
· OpenRouter (banyak model)
· Custom endpoint apapun

Cara setup:

1. Pilih ⭐ Premium Mode
2. Pilih provider atau ➕ Add new config
3. Isi:
   · Nama config (contoh: "Gemini Pro")
   · Endpoint URL
   · API key (Y/N)
   · Model name (optional)
   · System prompt (default/custom)
4. Config tersimpan, tinggal pilih next time

---

📝 Premium Config

Menambah Config Baru

```
📝 Manage Premium Configs → ➕ Add new config
```

Yang diisi:

· Config name: Gemini Pro
· Endpoint URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
· API key? Yes / No
· Model: gemini-pro
· System prompt: default atau custom

Mengelola Config

```
📝 Manage Premium Configs
  📋 View all configs     → Lihat semua config
  ➕ Add new config       → Tambah config baru
  ✏️ Edit system prompt   → Edit prompt config
  🗑️ Delete config        → Hapus config
```

Mengaktifkan Config

```
⭐ Premium Mode → Pilih config yang sudah dibuat
```

---

🐙 GitHub Configuration

Setup GitHub

```
🐙 GitHub Configuration → ⚙️ Configure GitHub
```

Yang diisi:

· Username GitHub
· Email (untuk commit)
· Repository (format: username/repo-name)
· Personal Access Token (optional, untuk private repo)

Fitur Git

Command Fungsi
git status Lihat status file
git add Stage file
git commit Commit dengan pesan
git push Push ke remote
git pull Pull dari remote
git branch Lihat branch
git log Lihat history commit

Membuat Personal Access Token (PAT)

1. Buka GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. Pilih scopes: repo, workflow
5. Copy token dan simpan

---

📁 File Operations

Operasi Deskripsi
Read File Baca dan tampilkan isi file
Write File Buat atau tulis file baru
Edit File Edit file dengan editor
Create Folder Buat folder baru

Contoh:

```
📁 File Operations → Read File
Enter path: src/index.js
```

---

💻 Terminal Commands

Command Whitelist (Safe)

```javascript
// Command yang diizinkan
npm install, npm run, npm start
git status, git add, git commit
node script.js
ls, pwd, cat, mkdir, touch
vercel deploy
```

Command yang Diblokir (Dangerous)

```javascript
// Diblokir otomatis
rm -rf, sudo, chmod 777
dd if=, mkfs, fork bombs
curl ... | sh
```

Menjalankan Command

```
💻 Terminal Commands
$ npm install express
```

---

📊 Project Analysis

Fitur ini akan menscan project kamu dan menampilkan:

· 📁 Struktur folder (3 level)
· 📦 Dependencies dari package.json
· 🔧 Frameworks yang terdeteksi (Express, React, Next.js, dll)
· 📄 Total file dalam project

Output contoh:

```
  📁 Project Structure:
  📁 src/
    📄 index.js
    📁 commands/
      📄 ai.js
      📄 git.js

  📦 Dependencies:
  express, axios, chalk, inquirer

  🔧 Frameworks:
  express, whatsapp-bot

  📄 Total Files:
  42
```

---

📁 Struktur Project

```
miku-terminal/
├── index.js                 # Main entry point
├── package.json
├── commands/
│   ├── ai.js               # AI chat handler
│   ├── git.js              # Git operations
│   ├── config.js           # Config manager
│   └── file.js             # File operations
├── core/
│   ├── ai-engine.js        # Multi-provider AI
│   ├── context.js          # Project context
│   └── executor.js         # Safe command exec
├── providers/
│   ├── base.js             # Base provider class
│   ├── free.js             # Free endpoints
│   ├── groq.js             # Groq API
│   ├── gemini.js           # Google Gemini
│   ├── openrouter.js       # OpenRouter
│   └── custom.js           # Custom endpoint
├── utils/
│   ├── logger.js           # Logging utility
│   └── ui.js               # UI components
├── config/
│   └── settings.json       # User config (auto-gen)
└── README.md
```

---

⚙️ Konfigurasi

File settings.json (Auto-generated)

```json
{
  "ai": {
    "mode": "free",
    "provider": "free",
    "endpoint": "https://api.nexray.eu.cc/ai/gemini",
    "apiKey": "",
    "model": "",
    "systemPrompt": "You are Miku..."
  },
  "premiumConfigs": [],
  "activePremiumConfig": null,
  "github": {
    "username": "",
    "email": "",
    "repo": "",
    "token": ""
  },
  "terminal": {
    "requireConfirm": true,
    "maxOutputLines": 1000,
    "whitelistCommands": true
  },
  "ui": {
    "theme": "dark",
    "animations": true,
    "compactMode": false
  }
}
```

Settings Auto-Generate

Jika settings.json:

· ❌ Tidak ada → Auto create dengan default
· ❌ Field kurang → Auto tambah field yang missing
· ❌ Struktur rusak → Auto repair dengan default

---

🛠️ Troubleshooting

Error: "Provider requires API key"

Solusi:

1. Pilih ⭐ Premium Mode
2. Pilih config yang sudah ada, atau
3. 📝 Manage Premium Configs → ➕ Add new config
4. Isi API key dengan benar

Error: "Network error"

Solusi:

1. Cek koneksi internet
2. Cek endpoint URL
3. Coba free endpoint dulu

Error: "GitHub push failed"

Solusi:

1. 🐙 GitHub Configuration → ⚙️ Configure GitHub
2. Cek username, repo, dan token
3. Pastikan token punya akses repo

Error: "Command not in whitelist"

Solusi:
Command tidak diizinkan untuk keamanan. Gunakan command yang sudah di-whitelist atau tambahkan manual di core/executor.js

---

📝 Changelog

v1.0.0

· ✅ AI Chat dengan multi-provider
· ✅ Free mode (no API key)
· ✅ Premium mode (Groq, Gemini, OpenRouter)
· ✅ Multi config premium
· ✅ System prompt per config
· ✅ GitHub integration
· ✅ File operations
· ✅ Safe terminal commands
· ✅ Project analysis
· ✅ Auto-generate settings.json

---

📄 License

MIT © Miku AI Terminal Assistant

---

🙏 Credits

Dibuat dengan ❤️ untuk developer Indonesia

Happy Coding! 🚀

```