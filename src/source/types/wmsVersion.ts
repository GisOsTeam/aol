export enum WmsVersionEnum {
  V1_0_0 = '1.0.0',
  V1_1_0 = '1.1.0',
  V1_3_0 = '1.3.0',
}
// Type wms version from enum, keep string union for backward compatibility with old versions of wms module
export type WmsVersion = '1.0.0' | '1.1.0' | '1.3.0' | WmsVersionEnum;

export const DEFAULT_WMS_VERSION: WmsVersion = WmsVersionEnum.V1_3_0;
