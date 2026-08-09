/**
 * 画像の出力モード（開発・ビルド・pnpm optimize:images で共通。実体は scripts/lib/image-pipeline.mjs）
 *
 * - webp-only: WebP のみ出力（元の JPG/PNG は書き出さない。SVG は最適化して残す）
 * - both: JPG/PNG を最適化し、同名の .webp も出力
 * - raster-only: JPG/PNG のみ最適化（WebP は生成しない）
 *
 * SCSS や JS から url() で JPG/PNG を参照する場合は both か raster-only にする。
 *
 * 環境変数 IMAGE_OUTPUT_MODE で上書き可能。
 * 例: IMAGE_OUTPUT_MODE=both pnpm build
 *
 * @type {'webp-only' | 'both' | 'raster-only'}
 */
export default 'webp-only';
