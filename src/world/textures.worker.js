// Worker des textures (§12) : relief, normales, biomes et masques calculés hors du fil
// principal. Renvoie des ImageBitmap (déjà retournées verticalement, comme le ferait
// Three.js avec flipY) et le champ de relief pour poser cités et marqueurs.
import { generateTextures } from './textures.js';

self.onmessage = async ({ data: { map, width } }) => {
  try {
    const t0 = performance.now();
    const { fields, height, normal, color, mask } = generateTextures(map, { width });
    const flip = (c) => createImageBitmap(c, { imageOrientation: 'flipY' });
    const [h, n, c, m] = await Promise.all([flip(height), flip(normal), flip(color), flip(mask)]);
    const { W, H, s, k, heights, timings } = fields;
    self.postMessage(
      {
        ok: true,
        bitmaps: { height: h, normal: n, color: c, mask: m },
        fields: { W, H, s, k, heights },
        timings: { ...timings, total: performance.now() - t0 },
      },
      [h, n, c, m, heights.buffer],
    );
  } catch (e) {
    self.postMessage({ ok: false, error: String(e?.message ?? e) });
  }
};
