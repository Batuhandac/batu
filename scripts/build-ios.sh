#!/usr/bin/env bash
# Pati SOS — iOS Build + TestFlight (tek seferlik)
set -e

BRANCH="claude/pati-sos-build-tLYBi"
REPO="https://github.com/Batuhandac/batu"
DIR="$HOME/pati-sos-build"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     Pati SOS → TestFlight Setup          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Homebrew ─────────────────────────────────────────────────────────
if ! command -v brew &>/dev/null; then
  echo "▸ Homebrew kuruluyor..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || eval "$(/usr/local/bin/brew shellenv)" 2>/dev/null || true
fi
echo "✓ Homebrew hazır"

# ── 2. Node.js ───────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "▸ Node.js kuruluyor..."
  brew install node
fi
echo "✓ Node $(node --version) hazır"

# ── 3. EAS CLI ────────────────────────────────────────────────────────────
if ! command -v eas &>/dev/null; then
  echo "▸ EAS CLI kuruluyor..."
  npm install -g eas-cli --silent
fi
echo "✓ EAS CLI hazır"

# ── 4. Kodu indir ──────────────────────────────────────────────────────────────
if [ -d "$DIR" ]; then
  echo "▸ Mevcut klasör güncelleniyor..."
  git -C "$DIR" pull origin "$BRANCH" --rebase --quiet 2>/dev/null || true
else
  echo "▸ Kod indiriliyor..."
  git clone --branch "$BRANCH" --depth 1 "$REPO" "$DIR"
fi
cd "$DIR"
echo "✓ Kod hazır: $DIR"

# ── 5. npm install ───────────────────────────────────────────────────────────────
echo "▸ Bağımlılıklar yükleniyor..."
npm install --silent
echo "✓ Bağımlılıklar hazır"

# ── 6. Expo girişi ───────────────────────────────────────────────────────────────
echo ""
echo "▸ Expo hesabına giriş yapılıyor..."
echo "  (Tarayıcı açılır — Expo kullanıcı adı/şifrenle gir)"
echo ""
eas login

# ── 7. EAS init ───────────────────────────────────────────────────────────────
echo ""
echo "▸ Proje EAS'e bağlanıyor..."
eas init --non-interactive 2>/dev/null || eas init
echo "✓ Proje bağlandı"

# ── 8. iOS build + TestFlight ─────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " iOS Production Build başlatılıyor..."
echo " EAS bulutta derleyecek (~15-20 dk)"
echo " İlk seferde Apple kimlik bilgilerin sorulacak:"
echo "   Apple ID    → Apple Developer e-postaın"
echo "   Team ID     → U9XS8V85V3"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

eas build -p ios --profile production --auto-submit

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Build + submit tamamlandı!"
echo " App Store Connect → TestFlight sekmesini kontrol et."
echo " 'Processing' → 'Ready to Test' (~10-15 dk)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
