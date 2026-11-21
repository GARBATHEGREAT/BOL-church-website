// Usage: npm run import:live   (optionally LIVE_URL=https://breadoflifedcm.org)
import { importLive, IMPORT_SOURCE } from '../server/importLive';

importLive(process.env.LIVE_URL || IMPORT_SOURCE)
  .then(r => console.log(`Imported ${r.settings} settings, ${r.sermons} sermons, ${r.events} events, ${r.contentItems} content items, ${r.gallery} gallery items. Media copied: ${r.mediaCopied}, failed: ${r.mediaFailed}.`))
  .catch(e => { console.error(e); process.exit(1); });
