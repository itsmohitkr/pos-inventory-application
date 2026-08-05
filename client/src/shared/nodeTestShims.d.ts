// Minimal ambient shapes for the Node builtins used by ipcChannels.test.ts,
// scoped to just the call signatures it needs. The project deliberately does
// not add "node" to client/tsconfig.json's `types`: @types/node's global
// augmentation overrides `setTimeout`'s return type to `NodeJS.Timeout`,
// which collides with `window.setTimeout`'s DOM-typed `number` return used in
// usePOSLayout.ts and elsewhere in the client. This file has no top-level
// import/export, so `declare module` here is a fresh ambient declaration
// (not an augmentation of an existing module), letting these three modules
// resolve for the one test file that runs under Node via Vitest, never in
// the browser.
declare module 'fs' {
  export function readFileSync(path: string, encoding: string): string;
}
declare module 'url' {
  export function fileURLToPath(url: string): string;
}
declare module 'path' {
  const path: {
    resolve: (...segments: string[]) => string;
    dirname: (p: string) => string;
  };
  export default path;
}
