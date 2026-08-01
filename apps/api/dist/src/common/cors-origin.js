"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCorsOrigin = buildCorsOrigin;
function buildCorsOrigin() {
    const raw = process.env.CORS_ORIGIN?.trim();
    if (!raw || raw === '*') {
        return true;
    }
    const allowlist = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    return (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (allowlist.includes(origin)) {
            callback(null, true);
            return;
        }
        if (process.env.VERCEL && /\.vercel\.app$/i.test(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    };
}
//# sourceMappingURL=cors-origin.js.map