import * as THREE from 'three';

const textureCache = new Map();

export const createTileFaceTexture = (tileID) => {
    if (textureCache.has(tileID)) return textureCache.get(tileID);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 344;
    const ctx = canvas.getContext('2d');

    // Ivory Front Face Base
    const grad = ctx.createLinearGradient(0, 0, 256, 344);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#f3ebd7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 344);

    // Double Border Frame
    ctx.strokeStyle = '#cda365';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 236, 324);
    ctx.strokeStyle = '#946c31';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 216, 304);

    const [suit, valStr] = tileID.split('_');
    const val = parseInt(valStr, 10) || 1;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (suit === 'BAMBOO') {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 110px sans-serif';
        const bambooIcons = ['🎋', '🎍', '🌿', '🌱', '🍃', '🌴', '🌲', '🌳', '🦜'];
        ctx.fillText(bambooIcons[(val - 1) % bambooIcons.length], 128, 140);
        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 42px monospace';
        ctx.fillText(`BAMBOO ${val}`, 128, 270);
    } else if (suit === 'CHARACTER') {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 110px sans-serif';
        const charKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
        ctx.fillText(charKanji[(val - 1) % 9] || '萬', 128, 140);
        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 42px monospace';
        ctx.fillText(`CHAR ${val}`, 128, 270);
    } else if (suit === 'DOTS') {
        ctx.fillStyle = '#0ea5e9';
        ctx.font = 'bold 110px sans-serif';
        ctx.fillText('🔴', 128, 140);
        ctx.fillStyle = '#075985';
        ctx.font = 'bold 42px monospace';
        ctx.fillText(`DOTS ${val}`, 128, 270);
    } else if (suit === 'DRAGON') {
        const dragonColors = ['#dc2626', '#16a34a', '#2563eb'];
        const dragonSymbols = ['中', '發', '白'];
        ctx.fillStyle = dragonColors[(val - 1) % 3];
        ctx.font = 'bold 120px sans-serif';
        ctx.fillText(dragonSymbols[(val - 1) % 3], 128, 140);
        ctx.font = 'bold 38px monospace';
        ctx.fillText('DRAGON', 128, 270);
    } else if (suit === 'WIND') {
        ctx.fillStyle = '#8b5cf6';
        ctx.font = 'bold 110px sans-serif';
        const windSymbols = ['東', '南', '西', '北'];
        ctx.fillText(windSymbols[(val - 1) % 4], 128, 140);
        ctx.fillStyle = '#5b21b6';
        ctx.font = 'bold 38px monospace';
        ctx.fillText('WIND', 128, 270);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    textureCache.set(tileID, texture);
    return texture;
};
