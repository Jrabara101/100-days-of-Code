import { ProjectileEntity, ParticleEntity, BloodDecalEntity, DamageNumberEntity, ElementalType } from '../types/game';

export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (item: T) => void;

  constructor(createFn: () => T, resetFn: (item: T) => void, initialSize = 50) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  public obtain(): T {
    const item = this.pool.pop() || this.createFn();
    this.resetFn(item);
    return item;
  }

  public release(item: T) {
    this.pool.push(item);
  }
}

// Pre-configured Pools
export const projectilePool = new ObjectPool<ProjectileEntity>(
  () => ({
    id: '',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    damage: 0,
    penetrationRemaining: 1,
    elemental: 'none' as ElementalType,
    rangeRemaining: 1000,
    radius: 3,
    color: '#F59E0B',
    isEnemy: false,
  }),
  (p) => {
    p.id = `proj_${Math.random().toString(36).substring(2, 9)}`;
    p.penetrationRemaining = 1;
    p.isEnemy = false;
  },
  100
);

export const particlePool = new ObjectPool<ParticleEntity>(
  () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    color: '#EF4444',
    radius: 3,
    alpha: 1,
    life: 0,
    maxLife: 1,
  }),
  (part) => {
    part.alpha = 1;
    part.life = 0;
    part.maxLife = 0.5;
  },
  250
);

export const damageNumberPool = new ObjectPool<DamageNumberEntity>(
  () => ({
    id: '',
    text: '',
    x: 0,
    y: 0,
    color: '#F8FAFC',
    alpha: 1,
    scale: 1,
    life: 0,
  }),
  (d) => {
    d.id = `dmg_${Math.random().toString(36).substring(2, 9)}`;
    d.alpha = 1;
    d.scale = 1;
    d.life = 0;
  },
  60
);
