// The Metro YAML transformer embeds .yaml/.yml files as their raw source text
// (see yaml-transformer.js, decision D8) — parsing happens at runtime via @maias/core.
declare module '*.yaml' {
  const src: string;
  export default src;
}
declare module '*.yml' {
  const src: string;
  export default src;
}
