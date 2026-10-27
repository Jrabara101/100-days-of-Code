import type {
  WorldPlayerEntity,
  GroundLootEntity,
  ItemRarity,
} from '../types/mmo.js';

export const RARITY_COLORS: Record<ItemRarity, { main: string; glow: string; text: string }> = {
  common: { main: '#94A3B8', glow: 'rgba(148, 163, 184, 0.4)', text: '#F1F5F9' },
  uncommon: { main: '#4ADE80', glow: 'rgba(74, 222, 128, 0.4)', text: '#BBF7D0' },
  rare: { main: '#38BDF8', glow: 'rgba(56, 189, 248, 0.5)', text: '#BAE6FD' },
  epic: { main: '#A855F7', glow: 'rgba(168, 85, 247, 0.6)', text: '#E9D5FF' },
  legendary: { main: '#F59E0B', glow: 'rgba(245, 158, 11, 0.7)', text: '#FEF3C7' },
};

export class SpriteRenderer {
  // Render Ground Loot Drop
  public static renderGroundLoot(
    ctx: CanvasRenderingContext2D,
    loot: GroundLootEntity,
    camX: number,
    camY: number,
    time: number,
    isNearPlayer: boolean
  ) {
    const sx = loot.x - camX;
    const sy = loot.y - camY;

    const rarityInfo = RARITY_COLORS[loot.item.rarity] || RARITY_COLORS.common;
    const floatOffset = Math.sin(time * 0.005 + loot.x) * 4;

    ctx.save();
    ctx.translate(sx, sy);

    // 1. Floor shadow and pulsing pickup halo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isNearPlayer) {
      // Pulsing cyan proximity halo
      const haloPulse = 0.5 + Math.sin(time * 0.008) * 0.3;
      ctx.strokeStyle = `rgba(56, 189, 248, ${haloPulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 8, 18, 9, 0, 0, Math.PI * 2);
      ctx.stroke();

      // [E] Pick up prompt badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-24, -36, 48, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38BDF8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('[E] Take', 0, -27);
    }

    // 2. Rarity Aura Glow
    const auraRadius = 14 + Math.sin(time * 0.004) * 2;
    const auraGrad = ctx.createRadialGradient(0, floatOffset, 2, 0, floatOffset, auraRadius);
    auraGrad.addColorStop(0, rarityInfo.glow);
    auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, floatOffset, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Item Sprite / Icon Graphic
    ctx.translate(0, floatOffset);
    SpriteRenderer.drawItemIcon(ctx, loot.item.iconKey, rarityInfo.main);

    // 4. Floating item name label if within proximity
    if (isNearPlayer) {
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      const name = loot.item.quantity > 1 ? `${loot.item.name} x${loot.item.quantity}` : loot.item.name;
      const metrics = ctx.measureText(name);
      const bgW = metrics.width + 12;

      ctx.fillStyle = 'rgba(11, 15, 25, 0.85)';
      ctx.strokeStyle = rarityInfo.main;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-bgW / 2, -18, bgW, 16, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = rarityInfo.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 0, -10);
    }

    ctx.restore();
  }

  // Render Layered Paper-Doll Player Avatar
  public static renderPlayer(
    ctx: CanvasRenderingContext2D,
    player: WorldPlayerEntity,
    camX: number,
    camY: number,
    time: number,
    isLocalPlayer: boolean,
    isSelected: boolean
  ) {
    const sx = player.x - camX;
    const sy = player.y - camY;

    ctx.save();
    ctx.translate(sx, sy);

    // 1. Target Reticle if selected
    if (isSelected) {
      const reticleAngle = time * 0.003;
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 10, 22, reticleAngle, reticleAngle + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Stride Bobbing Oscillation
    const stride = player.isMoving ? Math.sin(time * 0.015) : 0;
    const bobY = Math.abs(stride) * 2;

    // 4. Boots / Feet
    ctx.fillStyle = player.equippedVisuals.feet ? '#64748B' : '#334155';
    const footOffset = player.isMoving ? stride * 4 : 0;
    ctx.fillRect(-8, 8 + bobY - footOffset, 5, 6);
    ctx.fillRect(3, 8 + bobY + footOffset, 5, 6);

    // 5. Body / Torso / Armor Layer
    const baseColor = player.avatarColor || '#38BDF8';
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.roundRect(-9, -6 + bobY, 18, 16, 4);
    ctx.fill();

    // Chest Armor overlay if equipped
    if (player.equippedVisuals.chest) {
      if (player.equippedVisuals.chest.includes('plate')) {
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(-7, -4 + bobY, 14, 12);
        ctx.fillStyle = '#F59E0B'; // Gold trim
        ctx.fillRect(-3, -2 + bobY, 6, 8);
      } else {
        // Leather tunic
        ctx.fillStyle = '#78350F';
        ctx.fillRect(-7, -4 + bobY, 14, 12);
        ctx.fillStyle = '#B45309';
        ctx.fillRect(-1, -4 + bobY, 2, 12);
      }
    }

    // 6. Head & Hair / Helmet
    const headY = -18 + bobY;
    ctx.fillStyle = '#FBBF24'; // Adventurer skin tone
    ctx.beginPath();
    ctx.arc(0, headY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Eyes according to facing
    ctx.fillStyle = '#0F172A';
    if (player.facing === 'down') {
      ctx.fillRect(-3, headY - 1, 2, 2);
      ctx.fillRect(2, headY - 1, 2, 2);
    } else if (player.facing === 'left') {
      ctx.fillRect(-5, headY - 1, 2, 2);
    } else if (player.facing === 'right') {
      ctx.fillRect(3, headY - 1, 2, 2);
    } // up shows no eyes (back of head)

    // Helmet / Crown overlay
    if (player.equippedVisuals.head) {
      if (player.equippedVisuals.head.includes('crown')) {
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-8, headY - 9, 16, 4);
        ctx.fillStyle = '#38BDF8'; // Gem
        ctx.fillRect(-2, headY - 11, 4, 3);
      } else {
        // Plated Visor
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(-8, headY - 8, 16, 6);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(-6, headY - 2, 12, 2);
      }
    } else {
      // Natural hair cap
      ctx.fillStyle = '#92400E';
      ctx.beginPath();
      ctx.arc(0, headY - 3, 8, Math.PI, Math.PI * 2);
      ctx.fill();
    }

    // 7. Weapon in Main Hand
    if (player.equippedVisuals.main_hand) {
      const weaponHandX = player.facing === 'left' ? -12 : 11;
      const weaponY = -4 + bobY;

      if (player.equippedVisuals.main_hand.includes('sunblade') || player.equippedVisuals.main_hand.includes('sword')) {
        const isSun = player.equippedVisuals.main_hand.includes('sunblade');
        ctx.fillStyle = isSun ? '#F59E0B' : '#94A3B8';
        ctx.fillRect(weaponHandX - 1, weaponY - 12, 3, 16);
        // Crossguard
        ctx.fillStyle = isSun ? '#FDE047' : '#475569';
        ctx.fillRect(weaponHandX - 3, weaponY + 2, 7, 2);
        if (isSun) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
          ctx.strokeRect(weaponHandX - 2, weaponY - 13, 5, 18);
        }
      } else if (player.equippedVisuals.main_hand.includes('dagger')) {
        ctx.fillStyle = '#A855F7';
        ctx.fillRect(weaponHandX, weaponY - 6, 2, 10);
      } else if (player.equippedVisuals.main_hand.includes('staff')) {
        ctx.fillStyle = '#78350F';
        ctx.fillRect(weaponHandX, weaponY - 16, 3, 24);
        // Glowing gem on top
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(weaponHandX + 1.5, weaponY - 16, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 8. Shield in Off Hand
    if (player.equippedVisuals.off_hand) {
      const shieldX = player.facing === 'left' ? 8 : -14;
      ctx.fillStyle = '#334155';
      ctx.fillRect(shieldX, -2 + bobY, 6, 12);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(shieldX + 1, 2 + bobY, 4, 4);
    }

    // 9. Overhead Diegetic Nameplate & Health Bar
    SpriteRenderer.renderNameplate(ctx, player, headY - 14, isLocalPlayer);

    // 10. Comic-Style Kinetic Speech Bubble
    if (player.activeChatBubble && Date.now() < player.activeChatBubble.expiresAt) {
      SpriteRenderer.renderSpeechBubble(ctx, player.activeChatBubble.text, headY - 38);
    }

    // 11. Floating Emoji Reaction Pop
    if (player.activeEmote && Date.now() < player.activeEmote.expiresAt) {
      SpriteRenderer.renderEmotePop(ctx, player.activeEmote.emoji, headY - 36, time);
    }

    ctx.restore();
  }

  // Overhead Nameplate and Health Bar
  private static renderNameplate(
    ctx: CanvasRenderingContext2D,
    player: WorldPlayerEntity,
    topY: number,
    isLocalPlayer: boolean
  ) {
    ctx.textAlign = 'center';

    // Username & Title
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeText(player.username, 0, topY);

    ctx.fillStyle = isLocalPlayer ? '#38BDF8' : '#F8FAFC';
    ctx.fillText(player.username, 0, topY);

    // Title tag (smaller, subtle gold/gray)
    if (player.title) {
      ctx.font = 'italic 9px "Plus Jakarta Sans", sans-serif';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.strokeText(`<${player.title}>`, 0, topY - 10);
      ctx.fillStyle = player.isBot ? '#34D399' : '#FBBF24';
      ctx.fillText(`<${player.title}>`, 0, topY - 10);
    }

    // HP Bar
    const barW = 32;
    const barH = 4;
    const barX = -barW / 2;
    const barY = topY + 4;

    // Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(barX, barY, barW, barH);

    // Current HP fill
    const hpRatio = Math.max(0, Math.min(1, player.hp / (player.maxHp || 100)));
    ctx.fillStyle = hpRatio > 0.35 ? '#10B981' : '#F59E0B';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
  }

  // Kinetic Comic-Style Speech Bubble
  private static renderSpeechBubble(ctx: CanvasRenderingContext2D, text: string, bubbleY: number) {
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';

    // Word wrap into max 28 characters per line
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const w of words) {
      if ((currentLine + ' ' + w).trim().length <= 26) {
        currentLine = (currentLine + ' ' + w).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = w;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = 14;
    const totalTextH = lines.length * lineHeight;
    let maxLineW = 40;
    for (const line of lines) {
      const w = ctx.measureText(line).width;
      if (w > maxLineW) maxLineW = w;
    }

    const padX = 10;
    const padY = 6;
    const boxW = maxLineW + padX * 2;
    const boxH = totalTextH + padY * 2;
    const boxX = -boxW / 2;
    const boxTop = bubbleY - boxH;

    // Comic speech pill background
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(boxX, boxTop, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    // Comic tail pointing down to avatar
    ctx.beginPath();
    ctx.moveTo(-5, boxTop + boxH);
    ctx.lineTo(0, boxTop + boxH + 6);
    ctx.lineTo(5, boxTop + boxH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Render speech text
    ctx.fillStyle = '#0F172A';
    lines.forEach((l, idx) => {
      ctx.fillText(l, 0, boxTop + padY + 11 + idx * lineHeight);
    });
  }

  // Floating Emoji Reaction Pop
  private static renderEmotePop(ctx: CanvasRenderingContext2D, emoji: string, topY: number, time: number) {
    const floatY = topY - 12 + Math.sin(time * 0.008) * 3;
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow aura behind emoji
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(0, floatY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillText(emoji, 0, floatY);
  }

  // Draw procedural item icon on ground or bag
  private static drawItemIcon(ctx: CanvasRenderingContext2D, iconKey: string, color: string) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    switch (iconKey) {
      case 'sword':
      case 'sunblade': {
        ctx.fillRect(-1.5, -8, 3, 14);
        ctx.fillRect(-5, 2, 10, 2);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-1, 4, 2, 4);
        break;
      }
      case 'dagger': {
        ctx.fillRect(-1, -6, 2, 10);
        ctx.fillRect(-3, 1, 6, 2);
        break;
      }
      case 'staff': {
        ctx.fillRect(-1, -9, 2, 18);
        ctx.beginPath();
        ctx.arc(0, -9, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'potion_red':
      case 'potion_cyan': {
        // Flask bottle
        ctx.fillRect(-2, -7, 4, 3);
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'shield': {
        ctx.beginPath();
        ctx.moveTo(-5, -6);
        ctx.lineTo(5, -6);
        ctx.lineTo(4, 2);
        ctx.lineTo(0, 6);
        ctx.lineTo(-4, 2);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'helm':
      case 'crown': {
        ctx.fillRect(-6, -3, 12, 6);
        ctx.fillRect(-3, -6, 6, 3);
        break;
      }
      case 'gem': {
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(5, -1);
        ctx.lineTo(0, 6);
        ctx.lineTo(-5, -1);
        ctx.closePath();
        ctx.fill();
        break;
      }
      default: {
        ctx.fillRect(-4, -4, 8, 8);
        break;
      }
    }
  }
}
