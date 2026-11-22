import { builtinProductionAssets, type BuiltinProductionAsset } from './builtinProductionAssets';

export const variantsPerAsset = 232;

export function productionAssetVariant(base: BuiltinProductionAsset, index: number) {
  const label = String(index).padStart(3, '0');
  const format = base.folder === 'Audio' ? 'WAV' : base.format === 'CSV' ? 'CSV' : 'SVG';
  const slug = `${base.slug}-${label}`;
  return {
    ...base,
    base,
    index,
    slug,
    assetId: `zkmap-${slug}`,
    name: `${base.name} · Variant ${label}`,
    format,
    url: `/api/production-pack/${base.slug}/${index}.${format.toLowerCase()}`,
    durationSec: format === 'WAV' ? base.durationSec : undefined,
  };
}

export const productionAssetVariants = builtinProductionAssets.flatMap((base) =>
  Array.from({ length: variantsPerAsset }, (_, index) => productionAssetVariant(base, index + 1)),
);

export type ProductionAssetVariant = ReturnType<typeof productionAssetVariant>;
