// Re-export selected modules for named imports
export * from "./exports";

// Provide a default export that bundles all modules for single-import usage
import * as CORE from "./exports";
export default CORE;
