const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const preview = read('visual-preview.html');
const bootstrap = read('visual-editor-bootstrap.js');
const runtime = read('visual-preview-opening.js');
const css = read('visual-canvas.css');

test('recipient opening runtime is loaded only by the visual-document Preview', () => {
  assert.match(preview, /recipient-envelope-active recipient-opening-pending/);
  const previewDependencies = bootstrap.match(/preview:\s*\{[\s\S]*?\n\s*\}/)?.[0] || '';
  const canvasDependencies = bootstrap.match(/canvas:\s*\{[\s\S]*?\n\s*\}/)?.[0] || '';
  assert.match(previewDependencies, /'visual-canvas\.js', 'visual-preview-opening\.js'/);
  assert.doesNotMatch(canvasDependencies, /visual-preview-opening/);
  assert.match(runtime, /dataset\.editorSurface !== 'preview'/);
  assert.doesNotMatch(runtime + preview, /index\.html|invitation\.html|invitation\.js|openControl|sessionStorage|localStorage/);
});

test('transient envelope uses the legacy paper and seal assets with no legacy iframe or navigation', () => {
  for (const asset of [
    'invitation-assets/envelope-paper-greige.jpg',
    'invitation-assets/wax-seal-blank-optimized.png'
  ]) assert.match(preview + runtime + css, new RegExp(asset.replaceAll('.', '\\.'), 'g'));
  assert.doesNotMatch(preview + css, /envelope-liner-optimized\.jpg/);
  assert.match(preview, /data-recipient-envelope/);
  assert.match(preview, /recipient-envelope-flap-front/);
  assert.match(preview, /recipient-envelope-flap-back/);
  assert.match(preview, /recipient-envelope-card/);
  assert.doesNotMatch(runtime + preview, /<iframe|location\.(?:assign|replace)|window\.open/);
});

test('Preview ports the exact legacy SVG envelope, pocket, flap, and paper texture construction', () => {
  assert.match(preview, /class="recipient-envelope-body" viewBox="0 0 838 693" preserveAspectRatio="none"/);
  assert.match(preview, /<image x="0" y="-72" width="838" height="838" href="invitation-assets\/envelope-paper-greige\.jpg" preserveAspectRatio="xMidYMid slice"/);
  assert.match(preview, /class="recipient-envelope-pocket" viewBox="0 0 838 693" preserveAspectRatio="none"/);
  assert.match(preview, /M1 1 352 315 1 693Z/);
  assert.match(preview, /M837 1 486 315 837 693Z/);
  assert.match(preview, /M1 693V646Q5 615 29 581L335 299H503L809 581Q833 615 837 646V693Z/);
  assert.match(preview, /M837 693V646Q833 615 809 581L503 299/);
  assert.equal((preview.match(/viewBox="0 0 838 420" preserveAspectRatio="none"/g) || []).length, 2);
  assert.equal((preview.match(/M1 1H837Q832 48 823 67 813 88 789 107L447 392Q419 426 391 392L49 107Q25 88 15 67 6 48 1 1Z/g) || []).length, 4);
  assert.match(preview, /<image x="0" y="-209" width="838" height="838"/);
  assert.match(preview, /<image x="0" y="-160" width="838" height="838"/);
  assert.match(preview, /class="recipient-envelope-paper-texture" viewBox="0 0 942 1674" preserveAspectRatio="none"/);
  assert.doesNotMatch(preview + css, /recipient-envelope-pocket::before|recipient-envelope-pocket-bottom|recipient-envelope-flap-face[^}]*clip-path/);
});

test('Preview preserves legacy sibling-level flap, card, and pocket stacking', () => {
  const flapRule = css.match(/\.recipient-envelope-flap \{[\s\S]*?\n\}/)?.[0] || '';
  assert.doesNotMatch(flapRule, /z-index/);
  assert.match(css, /\.recipient-envelope-flap-face \{[\s\S]*?z-index: 6/);
  assert.match(css, /\.recipient-envelope-flap-back \{[\s\S]*?z-index: 1/);
  assert.match(css, /\.recipient-envelope-card \{[\s\S]*?z-index: 2/);
  assert.match(css, /\.recipient-envelope-pocket \{[\s\S]*?z-index: 3/);
});

test('closed envelope is present and styled in the first HTML frame', () => {
  assert.match(preview, /<style id="recipientOpeningFirstFrame">/);
  assert.match(preview, /<div class="recipient-envelope-overlay" data-recipient-envelope/);
  assert.match(preview, /aria-busy="true"/);
  assert.match(preview, /html\.recipient-envelope-active,html\.recipient-envelope-active body\{overflow:hidden/);
  assert.match(preview, /\.recipient-envelope-overlay\{position:fixed;z-index:30000;inset:0;display:grid/);
  assert.match(preview, /\.recipient-envelope-seal\{[^}]*pointer-events:none/);
  assert.match(preview, /data-recipient-opening-ready/);
  assert.equal((preview.match(/rel="preload"/g) || []).length, 2);
  assert.doesNotMatch(runtime, /createElement\('div'\)|document\.body\.append\(overlay\)|overlay\.innerHTML/);
  assert.match(runtime, /overlay\.dataset\.recipientOpeningReady = ''/);
  assert.match(runtime, /overlay\.setAttribute\('aria-busy', 'false'\)/);
});

test('seal, flap, rise, turn, approach, and handoff retain approved timing', () => {
  assert.match(css, /transition: transform \.22s ease, filter \.22s ease, opacity \.22s ease/);
  assert.match(css, /recipientFlapFrontOpen \.56s cubic-bezier\(\.36,\.05,\.64,\.95\)/);
  assert.match(css, /recipientFlapBackOpen \.59s \.56s cubic-bezier\(\.24,\.68,\.17,1\)/);
  assert.match(css, /recipientCardRise 1\.1s cubic-bezier\(\.2,\.72,\.18,1\)/);
  assert.match(css, /recipientCardTurn \.7s cubic-bezier\(\.4,0,\.2,1\)/);
  assert.match(css, /recipientCardApproach \.48s cubic-bezier\(\.28,\.16,\.48,1\)/);
  assert.match(css, /recipientInvitationHandoff \.18s \.28s ease-out/);
  assert.match(runtime, /addEventListener\('click', runOpening, \{ once: true \}\)/);
});

test('Opening copy animates existing animation layers as four composed beats', () => {
  const expected = {
    'opening-intro-1': [720, 180], 'opening-intro-2': [720, 180],
    'opening-isabella': [860, 920], 'opening-and': [860, 920], 'opening-julian': [860, 920],
    'opening-date': [720, 1800], 'opening-location': [720, 1900], 'opening-scroll': [640, 2480]
  };
  Object.entries(expected).forEach(([id, [duration, delay]]) => {
    assert.match(runtime, new RegExp(`'${id}': \\{ duration: ${duration}, delay: ${delay} \\}`));
  });
  assert.match(runtime, /\.element-animation-layer/);
  assert.match(runtime, /copySettledAfter = 3120/);
  assert.match(runtime, /cubic-bezier\(\.22,\.66,\.2,1\)/);
  assert.doesNotMatch(runtime, /ceremony|the-day|details|our-story|rsvp/);
});

test('responsive envelope motion follows the approved mobile, iPad, and desktop character', () => {
  assert.match(css, /--recipient-card-pull: -67cqw/);
  assert.match(css, /--recipient-card-focus: 4cqw/);
  assert.match(css, /--recipient-card-approach-scale: 4/);
  assert.match(css, /@media \(min-width: 900px\)[\s\S]*--recipient-card-pull:-38svh/);
  assert.match(css, /--recipient-card-focus:-6svh/);
  assert.match(css, /--recipient-card-approach-scale:4\.8/);
});

test('render replacement resumes elapsed copy timing and completed state cannot replay', () => {
  assert.match(runtime, /new MutationObserver/);
  assert.match(runtime, /performance\.now\(\) - copyStartedAt/);
  assert.match(runtime, /animationDelay = `\$\{timing\.delay - elapsed\}ms`/);
  assert.match(runtime, /if \(phase === 'copy'\) requestAnimationFrame\(applyOpeningAnimations\)/);
  assert.match(runtime, /if \(phase === 'complete'\) requestAnimationFrame\(clearOpeningAnimationStyles\)/);
  assert.match(runtime, /if \(openingStarted\) return/);
});

test('reduced motion waits for activation and then reveals the complete invitation immediately', () => {
  assert.match(runtime, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(runtime, /if \(reduceMotion\) \{\s*showInvitationImmediately\(\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(runtime, /classList\.remove\('recipient-envelope-active', 'recipient-opening-pending', 'recipient-opening-copy'\)/);
});

test('visual document defaults and template revision remain unchanged', () => {
  const context = { console };
  context.globalThis = context;
  vm.runInNewContext(read('visual-document.js'), context);
  vm.runInNewContext(read('green-sage-visual-template.js'), context);
  const authored = context.GreenSageVisualTemplate.cloneDefault();
  assert.equal(authored.document.templateRevision, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(authored.document.sectionOrder)), ['opening', 'ceremony', 'the-day', 'details', 'our-story', 'rsvp']);
});
