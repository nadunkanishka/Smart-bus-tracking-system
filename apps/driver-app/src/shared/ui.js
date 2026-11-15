// SmartBus shared UI kit (React Native / react-native-web). Source of truth lives in /shared/native and is copied into
// apps/*/src/shared by `npm run sync`. The kit is split by concern in kit/; apps import everything from here.
export { TOP_INSET, type, Tap } from './kit/core';
export * from './kit/vehicle';
export * from './kit/controls';
export * from './kit/layout';
export * from './kit/motion';
export * from './kit/settings';
