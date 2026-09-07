import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.php'), 'utf8');
const services = [
  ['Sunday', 'Celebration Service', '8:00 AM & 10:30 AM'],
  ['Wednesday', 'Word & Prayer', '5:30 PM'],
  ['Friday', 'Covenant Prayer', '6:00 PM'],
].map(([day, name, time]) => `<div><span>${day}<small>${name}</small></span><b>${time}</b></div>`).join('');

html = html
  .replace(/^<\?php .*?\?>\n/, '')
  .replaceAll("<?= htmlspecialchars($church['full_name']) ?>", 'Bread of Life Divine Covenant Ministry')
  .replaceAll("<?= htmlspecialchars($church['tagline']) ?>", 'A place to belong. A people becoming like Christ.')
  .replaceAll("<?= htmlspecialchars($data['youtube']['channel_url']) ?>", 'https://www.youtube.com/')
  .replaceAll("<?= htmlspecialchars($data['youtube']['featured_embed']) ?>", 'https://www.youtube.com/embed/ysz5S6PUM-U')
  .replace(/<\?php foreach \(\$data\['services'\] as \$service\): \?>.*?<\?php endforeach; \?>/s, services)
  .replaceAll("<?= htmlspecialchars($church['address']) ?>", 'Your Church Address, Your City, Nigeria')
  .replaceAll("<?= htmlspecialchars($church['phone']) ?>", '+234 800 000 0000')
  .replaceAll("<?= htmlspecialchars($church['email']) ?>", 'hello@breadoflifedcm.org')
  .replaceAll("<?= date('Y') ?>", String(new Date().getUTCFullYear()));

const dist = path.join(root, 'dist');
fs.mkdirSync(path.join(dist, 'assets/css'), { recursive: true });
fs.mkdirSync(path.join(dist, 'assets/js'), { recursive: true });
fs.mkdirSync(path.join(dist, 'assets/images'), { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), html);
fs.copyFileSync(path.join(root, 'assets/css/style.css'), path.join(dist, 'assets/css/style.css'));
fs.copyFileSync(path.join(root, 'assets/js/main.js'), path.join(dist, 'assets/js/main.js'));
fs.copyFileSync(path.join(root, 'assets/css/theme.css'), path.join(dist, 'assets/css/theme.css'));
fs.copyFileSync(path.join(root, 'assets/css/premium.css'), path.join(dist, 'assets/css/premium.css'));
fs.copyFileSync(path.join(root, 'assets/images/bread-of-life-logo.png'), path.join(dist, 'assets/images/bread-of-life-logo.png'));
console.log('Static demo exported to dist/');
