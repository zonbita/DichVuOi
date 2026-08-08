"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUploadsRoot = resolveUploadsRoot;
exports.resolveBundledUploadsRoot = resolveBundledUploadsRoot;
exports.ensureUploadsRoot = ensureUploadsRoot;
const fs_1 = require("fs");
const path_1 = require("path");
function resolveUploadsRoot() {
    const fromEnv = process.env.UPLOADS_DIR?.trim();
    if (fromEnv)
        return fromEnv;
    if (process.env.VERCEL)
        return (0, path_1.join)('/tmp', 'dichvuoi-uploads');
    return (0, path_1.join)(process.cwd(), 'uploads');
}
function resolveBundledUploadsRoot() {
    const bundled = (0, path_1.join)(process.cwd(), 'uploads');
    return (0, fs_1.existsSync)(bundled) ? bundled : null;
}
function ensureUploadsRoot() {
    const root = resolveUploadsRoot();
    try {
        if (!(0, fs_1.existsSync)(root)) {
            (0, fs_1.mkdirSync)(root, { recursive: true });
        }
    }
    catch {
    }
    return root;
}
//# sourceMappingURL=uploads-root.js.map