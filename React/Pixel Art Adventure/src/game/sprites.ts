// Procedural 16-Bit Pixel Art Texture & Sprite Generator
// Generates high-fidelity retro sprites directly onto offscreen HTML5 canvases for 60fps blitting.

export interface SpriteSheet {
  drawPlayer(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    facing: 'up' | 'down' | 'left' | 'right',
    frame: number,
    hasLantern: boolean
  ): void;
  drawNPC(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    type: 'elder' | 'golem' | 'wanderer' | 'guardian' | 'spirit',
    facing: 'up' | 'down' | 'left' | 'right',
    isAwake?: boolean
  ): void;
  drawTile(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    tileId: number,
    time: number
  ): void;
  getPortraitDataUrl(type: 'elder' | 'golem' | 'wanderer' | 'guardian' | 'spirit'): string;
}

class ProceduralPixelArtEngine implements SpriteSheet {
  private portraitsCache = new Map<string, string>();

  // Draw Player Avatar (32x32 pixel bounds)
  public drawPlayer(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    facing: 'up' | 'down' | 'left' | 'right',
    frame: number,
    hasLantern: boolean
  ) {
    ctx.save();
    ctx.translate(dx, dy);

    // Pixel step bounce based on walk frame
    const bounce = frame % 2 === 1 ? -1 : 0;
    const legOffset = frame === 1 ? -2 : frame === 3 ? 2 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(16, 30, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Legs / Boots
    ctx.fillStyle = '#3E2723'; // Dark leather boots
    if (facing === 'up' || facing === 'down') {
      ctx.fillRect(11 + legOffset, 24 + bounce, 4, 6);
      ctx.fillRect(17 - legOffset, 24 + bounce, 4, 6);
    } else if (facing === 'left') {
      ctx.fillRect(12 + legOffset, 24 + bounce, 4, 6);
      ctx.fillRect(16 - legOffset, 24 + bounce, 4, 6);
    } else {
      ctx.fillRect(12 - legOffset, 24 + bounce, 4, 6);
      ctx.fillRect(16 + legOffset, 24 + bounce, 4, 6);
    }

    // 2. Torso / Adventurer Tunic
    ctx.fillStyle = '#1E3A8A'; // Deep blue tunic
    ctx.fillRect(10, 14 + bounce, 12, 10);
    ctx.fillStyle = '#D97706'; // Gold belt / buckle
    ctx.fillRect(10, 21 + bounce, 12, 3);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(14, 21 + bounce, 4, 3);

    // 3. Head & Hair
    ctx.fillStyle = '#FCD34D'; // Sandy blonde adventurer hair
    ctx.fillRect(9, 6 + bounce, 14, 8);
    ctx.fillStyle = '#FBBF24'; // Hair highlights
    ctx.fillRect(11, 4 + bounce, 10, 3);

    // Face skin
    ctx.fillStyle = '#FBCFE8'; // Pale warm skin tone
    ctx.fillRect(11, 9 + bounce, 10, 6);

    // Eyes depending on facing
    ctx.fillStyle = '#0F172A';
    if (facing === 'down') {
      ctx.fillRect(13, 11 + bounce, 2, 2);
      ctx.fillRect(17, 11 + bounce, 2, 2);
    } else if (facing === 'left') {
      ctx.fillRect(11, 11 + bounce, 2, 2);
    } else if (facing === 'right') {
      ctx.fillRect(19, 11 + bounce, 2, 2);
    } else if (facing === 'up') {
      // Hair back cover
      ctx.fillStyle = '#D97706';
      ctx.fillRect(10, 8 + bounce, 12, 6);
    }

    // 4. Carried Ancient Lantern (held in hand)
    if (hasLantern) {
      const lx = facing === 'left' ? 4 : facing === 'right' ? 24 : 22;
      const ly = 16 + bounce;

      // Handle & frame
      ctx.fillStyle = '#78350F';
      ctx.fillRect(lx + 1, ly - 3, 4, 2);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(lx, ly - 1, 6, 8);

      // Core amber light
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(lx + 1, ly + 1, 4, 4);
    }

    ctx.restore();
  }

  // Draw Specific NPCs
  public drawNPC(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    type: 'elder' | 'golem' | 'wanderer' | 'guardian' | 'spirit',
    facing: 'up' | 'down' | 'left' | 'right',
    isAwake: boolean = false
  ) {
    ctx.save();
    ctx.translate(dx, dy);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(16, 30, type === 'golem' ? 12 : 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'elder') {
      // Elder Mael: Long green robe, long white beard, wooden crook
      ctx.fillStyle = '#065F46'; // Forest green robe
      ctx.fillRect(10, 12, 12, 16);
      ctx.fillStyle = '#FDE047'; // Robe trim
      ctx.fillRect(14, 12, 4, 16);

      // Face & White Beard
      ctx.fillStyle = '#FED7AA';
      ctx.fillRect(11, 6, 10, 6);
      ctx.fillStyle = '#F8FAFC'; // Flowing beard
      ctx.fillRect(10, 10, 12, 8);
      ctx.fillRect(12, 18, 8, 4);

      // Hood
      ctx.fillStyle = '#047857';
      ctx.fillRect(9, 4, 14, 4);

      // Wooden Staff
      ctx.fillStyle = '#78350F';
      ctx.fillRect(23, 4, 2, 26);
      ctx.fillStyle = '#38BDF8'; // Glowing crystal staff tip
      ctx.fillRect(22, 2, 4, 4);
    } else if (type === 'golem') {
      // Ancient Stone Golem: Heavy mossy rock blocks
      ctx.fillStyle = '#475569'; // Slate rock body
      ctx.fillRect(6, 6, 20, 22);
      ctx.fillStyle = '#334155'; // Rock shade
      ctx.fillRect(8, 8, 16, 18);

      // Moss patches
      ctx.fillStyle = '#15803D';
      ctx.fillRect(8, 10, 5, 4);
      ctx.fillRect(17, 18, 6, 4);

      // Eyes / Runic chest glow
      if (isAwake) {
        ctx.fillStyle = '#38BDF8'; // Radiant Cyan Eyes
        ctx.fillRect(10, 10, 4, 2);
        ctx.fillRect(18, 10, 4, 2);
        // Chest spiral core
        ctx.fillRect(14, 16, 4, 4);
      } else {
        ctx.fillStyle = '#1E293B'; // Dim slumbering eye slits
        ctx.fillRect(10, 10, 4, 2);
        ctx.fillRect(18, 10, 4, 2);
      }
    } else if (type === 'wanderer') {
      // Lyra the Wanderer: Leather cloak, crimson scarf
      ctx.fillStyle = '#92400E';
      ctx.fillRect(10, 14, 12, 14);
      ctx.fillStyle = '#EF4444'; // Red scarf
      ctx.fillRect(9, 12, 14, 3);

      // Hair & Face
      ctx.fillStyle = '#3B0764'; // Dark plum hair
      ctx.fillRect(9, 6, 14, 6);
      ctx.fillStyle = '#FED7AA';
      ctx.fillRect(11, 8, 10, 5);

      // Eyes
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(13, 9, 2, 2);
      ctx.fillRect(17, 9, 2, 2);
    } else if (type === 'guardian') {
      // Ancient Sentinel: Polished blue-gray armor and spear
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(8, 8, 16, 20);
      ctx.fillStyle = '#38BDF8'; // Visor glow
      ctx.fillRect(11, 10, 10, 3);

      // Golden Pauldrons
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(6, 10, 4, 6);
      ctx.fillRect(22, 10, 4, 6);

      // Polearm
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(25, 2, 2, 28);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(24, 0, 4, 6);
    } else if (type === 'spirit') {
      // Ethereal orb
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(16, 16, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(16, 16, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Procedural World Tiles (32x32 px)
  public drawTile(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    tileId: number,
    time: number
  ) {
    switch (tileId) {
      case 0: // Grass Base
        ctx.fillStyle = '#143823'; // Lush emerald green base
        ctx.fillRect(dx, dy, 32, 32);
        ctx.fillStyle = '#1B4D31'; // Grass tuft texture
        ctx.fillRect(dx + 4, dy + 6, 3, 2);
        ctx.fillRect(dx + 18, dy + 14, 3, 2);
        ctx.fillRect(dx + 10, dy + 22, 3, 2);
        ctx.fillRect(dx + 24, dy + 4, 2, 2);
        break;

      case 1: // Cobblestone Path
        ctx.fillStyle = '#334155';
        ctx.fillRect(dx, dy, 32, 32);
        ctx.fillStyle = '#475569';
        // Slate paving blocks
        ctx.fillRect(dx + 2, dy + 2, 12, 12);
        ctx.fillRect(dx + 16, dy + 2, 14, 12);
        ctx.fillRect(dx + 2, dy + 16, 14, 14);
        ctx.fillRect(dx + 18, dy + 16, 12, 14);
        ctx.fillStyle = '#1E293B'; // Grout line
        ctx.fillRect(dx + 15, dy, 1, 32);
        ctx.fillRect(dx, dy + 15, 32, 1);
        break;

      case 2: // Dirt Trail
        ctx.fillStyle = '#5C4033'; // Rich loam brown
        ctx.fillRect(dx, dy, 32, 32);
        ctx.fillStyle = '#78523F';
        ctx.fillRect(dx + 4, dy + 8, 6, 4);
        ctx.fillRect(dx + 16, dy + 20, 8, 4);
        ctx.fillStyle = '#4A332A'; // Pebble specks
        ctx.fillRect(dx + 8, dy + 24, 2, 2);
        ctx.fillRect(dx + 22, dy + 10, 2, 2);
        break;

      case 3: // Shimmering River Water
        const wave = Math.sin(time * 2 + dx * 0.1) * 2;
        ctx.fillStyle = '#0284C7'; // Deep azure water
        ctx.fillRect(dx, dy, 32, 32);
        ctx.fillStyle = '#38BDF8'; // Surface specular ripples
        ctx.fillRect(dx + 4 + wave, dy + 8, 12, 2);
        ctx.fillRect(dx + 14 - wave, dy + 20, 14, 2);
        break;

      case 4: // Wooden Bridge Planks
        ctx.fillStyle = '#78350F'; // Dark cedar bridge timber
        ctx.fillRect(dx, dy, 32, 32);
        ctx.fillStyle = '#92400E';
        ctx.fillRect(dx + 1, dy + 2, 30, 6);
        ctx.fillRect(dx + 1, dy + 10, 30, 6);
        ctx.fillRect(dx + 1, dy + 18, 30, 6);
        ctx.fillRect(dx + 1, dy + 26, 30, 5);
        ctx.fillStyle = '#451A03'; // Planks gap & nail heads
        ctx.fillRect(dx + 4, dy + 4, 2, 2);
        ctx.fillRect(dx + 26, dy + 4, 2, 2);
        ctx.fillRect(dx + 4, dy + 20, 2, 2);
        ctx.fillRect(dx + 26, dy + 20, 2, 2);
        break;

      case 5: // Wildflower Meadow Grass
        ctx.fillStyle = '#143823';
        ctx.fillRect(dx, dy, 32, 32);
        // Golden florets
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(dx + 6, dy + 8, 3, 3);
        ctx.fillRect(dx + 22, dy + 18, 3, 3);
        // Sky blue florets
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(dx + 18, dy + 6, 3, 3);
        ctx.fillRect(dx + 8, dy + 22, 3, 3);
        break;

      case 6: // Ancient Vault Slate (Sunken Shrine)
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(dx, dy, 32, 32);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(dx + 2, dy + 2, 28, 28);
        // Runic inlays
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(dx + 15, dy + 15, 2, 2);
        break;

      case 10: // Ancient Oak Tree Base
        ctx.fillStyle = '#5A3825'; // Tree trunk bark
        ctx.fillRect(dx + 8, dy + 10, 16, 22);
        ctx.fillStyle = '#3D2415';
        ctx.fillRect(dx + 12, dy + 12, 4, 20);
        break;

      case 12: // Lantern Post
        ctx.fillStyle = '#475569'; // Iron post
        ctx.fillRect(dx + 14, dy + 12, 4, 20);
        ctx.fillStyle = '#D97706'; // Lantern lamp
        ctx.fillRect(dx + 12, dy + 4, 8, 8);
        ctx.fillStyle = '#FDE047'; // Glowing wick
        ctx.fillRect(dx + 14, dy + 6, 4, 4);
        break;

      case 15: // Ancient Monolith Column
        ctx.fillStyle = '#334155';
        ctx.fillRect(dx + 6, dy + 2, 20, 28);
        ctx.fillStyle = '#475569';
        ctx.fillRect(dx + 8, dy + 4, 16, 24);
        // Pulsing cyan glyphs
        const glyphAlpha = 0.5 + Math.sin(time * 3) * 0.4;
        ctx.fillStyle = `rgba(56, 189, 248, ${glyphAlpha})`;
        ctx.fillRect(dx + 12, dy + 8, 8, 2);
        ctx.fillRect(dx + 14, dy + 14, 4, 6);
        ctx.fillRect(dx + 12, dy + 22, 8, 2);
        break;

      case 16: // Campfire
        ctx.fillStyle = '#451A03'; // Wooden logs
        ctx.fillRect(dx + 8, dy + 18, 16, 6);
        // Animated fire flame
        const flameOffset = Math.sin(time * 8) * 2;
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(dx + 10 + flameOffset, dy + 10, 12, 10);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(dx + 12, dy + 8, 8, 8);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(dx + 14, dy + 6, 4, 6);
        break;

      case 18: // Shrine Heart Altar
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(dx + 4, dy + 14, 24, 16);
        // Floating cyan crystal heart
        const floatY = Math.sin(time * 2.5) * 3;
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(dx + 16, dy + 8 + floatY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#F0FDFA';
        ctx.beginPath();
        ctx.arc(dx + 16, dy + 7 + floatY, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 20: // Tree Canopy (Overlay)
        ctx.fillStyle = '#064E3B'; // Dense emerald canopy
        ctx.beginPath();
        ctx.arc(dx + 16, dy + 14, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#047857'; // Foliage highlights
        ctx.beginPath();
        ctx.arc(dx + 14, dy + 10, 14, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        break;
    }
  }

  // Pre-render 80x80 crisp portraits as Data URLs for React Dialogue UI
  public getPortraitDataUrl(type: 'elder' | 'golem' | 'wanderer' | 'guardian' | 'spirit'): string {
    if (this.portraitsCache.has(type)) {
      return this.portraitsCache.get(type)!;
    }

    const c = document.createElement('canvas');
    c.width = 80;
    c.height = 80;
    const ctx = c.getContext('2d')!;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 80, 80);
    grad.addColorStop(0, '#131826');
    grad.addColorStop(1, '#0B0D14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 80, 80);

    // Border inner frame
    ctx.strokeStyle = '#2D3954';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 76, 76);

    ctx.save();
    ctx.scale(2.2, 2.2);
    ctx.translate(2, 2);
    this.drawNPC(ctx, 0, 0, type, 'down', true);
    ctx.restore();

    const url = c.toDataURL('image/png');
    this.portraitsCache.set(type, url);
    return url;
  }
}

export const pixelSprites = new ProceduralPixelArtEngine();
