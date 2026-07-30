"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portraitAvatarUrl = portraitAvatarUrl;
const PORTRAIT_COUNT = 9;
function portraitAvatarUrl(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const index = (hash % PORTRAIT_COUNT) + 1;
    return `/avatars/vn-avatar-${String(index).padStart(2, '0')}.jpg`;
}
//# sourceMappingURL=portrait-avatar.js.map