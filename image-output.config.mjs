/**
 * 画像の出力モード（開発: scripts/vite-plugin-dev-images.mjs / 本番: scripts/optimize-images.mjs）
 *
 * - webp-only: JPG/PNG を WebP に変換・最適化後、元の JPG/PNG を削除（SVG は最適化のまま残す）
 * - both: JPG/PNG を最適化し、同名の .webp も出力（従来どおり）
 * - raster-only: JPG/PNG のみ最適化（WebP は生成しない）
 *
 * 環境変数 IMAGE_OUTPUT_MODE で上書き可能。
 * 例: IMAGE_OUTPUT_MODE=both pnpm build
 *
 * @type {'webp-only' | 'both' | 'raster-only'}
 */
export default 'webp-only';
