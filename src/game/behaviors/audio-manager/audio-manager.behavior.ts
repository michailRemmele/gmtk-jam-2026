import type { Actor, Scene, BehaviorOptions } from 'dacha';
import { Behavior, AudioSource } from 'dacha';
import { DefineBehavior, DefineField } from 'dacha-workbench/decorators';

import * as EventType from '../../events';
import type { GameOverEvent, TimerTickEvent } from '../../events';

const CRITICAL_SECONDS_LEFT = 10;

interface AudioManagerBehaviorOptions extends BehaviorOptions {
  buildMusic: string;
  escapeMusic: string;
  impact: string;
  turretShot: string;
  blockPlaced: string;
  blockSold: string;
  obstacleDestroyed: string;
  repairPickup: string;
  explosion: string;
  fuse: string;
  creaturesSpawned: string;
  blockLoss: string;
  countdown: string;
  turbine: string;
  win: string;
  lose: string;
}

@DefineBehavior({
  name: 'AudioManagerBehavior',
})
export default class AudioManagerBehavior extends Behavior {
  private scene: Scene;

  @DefineField({ type: 'string' })
  private buildMusic: string;

  @DefineField({ type: 'string' })
  private escapeMusic: string;

  @DefineField({ type: 'string' })
  private impact: string;

  @DefineField({ type: 'string' })
  private turretShot: string;

  @DefineField({ type: 'string' })
  private blockPlaced: string;

  @DefineField({ type: 'string' })
  private blockSold: string;

  @DefineField({ type: 'string' })
  private obstacleDestroyed: string;

  @DefineField({ type: 'string' })
  private repairPickup: string;

  @DefineField({ type: 'string' })
  private explosion: string;

  @DefineField({ type: 'string' })
  private fuse: string;

  @DefineField({ type: 'string' })
  private creaturesSpawned: string;

  @DefineField({ type: 'string' })
  private blockLoss: string;

  @DefineField({ type: 'string' })
  private countdown: string;

  @DefineField({ type: 'string' })
  private turbine: string;

  @DefineField({ type: 'string' })
  private win: string;

  @DefineField({ type: 'string' })
  private lose: string;

  private buildMusicSource?: AudioSource;
  private escapeMusicSource?: AudioSource;
  private impactSource?: AudioSource;
  private turretShotSource?: AudioSource;
  private blockPlacedSource?: AudioSource;
  private blockSoldSource?: AudioSource;
  private obstacleDestroyedSource?: AudioSource;
  private repairPickupSource?: AudioSource;
  private explosionSource?: AudioSource;
  private fuseSource?: AudioSource;
  private creaturesSpawnedSource?: AudioSource;
  private blockLossSource?: AudioSource;
  private countdownSource?: AudioSource;
  private turbineSource?: AudioSource;
  private winSource?: AudioSource;
  private loseSource?: AudioSource;

  constructor(options: AudioManagerBehaviorOptions) {
    super();

    this.scene = options.scene;

    this.buildMusic = options.buildMusic;
    this.escapeMusic = options.escapeMusic;
    this.impact = options.impact;
    this.turretShot = options.turretShot;
    this.blockPlaced = options.blockPlaced;
    this.blockSold = options.blockSold;
    this.obstacleDestroyed = options.obstacleDestroyed;
    this.repairPickup = options.repairPickup;
    this.explosion = options.explosion;
    this.fuse = options.fuse;
    this.creaturesSpawned = options.creaturesSpawned;
    this.blockLoss = options.blockLoss;
    this.countdown = options.countdown;
    this.turbine = options.turbine;
    this.win = options.win;
    this.lose = options.lose;

    this.buildMusicSource = this.resolve(this.buildMusic);
    this.escapeMusicSource = this.resolve(this.escapeMusic);
    this.impactSource = this.resolve(this.impact);
    this.turretShotSource = this.resolve(this.turretShot);
    this.blockPlacedSource = this.resolve(this.blockPlaced);
    this.blockSoldSource = this.resolve(this.blockSold);
    this.obstacleDestroyedSource = this.resolve(this.obstacleDestroyed);
    this.repairPickupSource = this.resolve(this.repairPickup);
    this.explosionSource = this.resolve(this.explosion);
    this.fuseSource = this.resolve(this.fuse);
    this.creaturesSpawnedSource = this.resolve(this.creaturesSpawned);
    this.blockLossSource = this.resolve(this.blockLoss);
    this.countdownSource = this.resolve(this.countdown);
    this.turbineSource = this.resolve(this.turbine);
    this.winSource = this.resolve(this.win);
    this.loseSource = this.resolve(this.lose);

    this.buildMusicSource?.play();

    this.scene.addEventListener(
      EventType.BuildPhaseEnd,
      this.handleEscapeStart,
    );
    this.scene.addEventListener(EventType.GameOver, this.handleGameOver);
    this.scene.addEventListener(EventType.Impact, this.handleImpact);
    this.scene.addEventListener(EventType.TurretShot, this.handleTurretShot);
    this.scene.addEventListener(EventType.BlockPlaced, this.handleBlockPlaced);
    this.scene.addEventListener(EventType.BlockSold, this.handleBlockSold);
    this.scene.addEventListener(
      EventType.ObstacleDestroyed,
      this.handleObstacleDestroyed,
    );
    this.scene.addEventListener(
      EventType.RepairPickup,
      this.handleRepairPickup,
    );
    this.scene.addEventListener(EventType.Explosion, this.handleExplosion);
    this.scene.addEventListener(EventType.ExplosiveTriggered, this.handleFuse);
    this.scene.addEventListener(
      EventType.CreaturesSpawned,
      this.handleCreaturesSpawned,
    );
    this.scene.addEventListener(EventType.BlockDestroyed, this.handleBlockLoss);
    this.scene.addEventListener(EventType.TimerTick, this.handleTimerTick);
    this.scene.addEventListener(
      EventType.TurbinesStarted,
      this.handleTurbinesStarted,
    );
    this.scene.addEventListener(
      EventType.TurbinesStopped,
      this.handleTurbinesStopped,
    );
  }

  destroy(): void {
    this.scene.removeEventListener(
      EventType.BuildPhaseEnd,
      this.handleEscapeStart,
    );
    this.scene.removeEventListener(EventType.GameOver, this.handleGameOver);
    this.scene.removeEventListener(EventType.Impact, this.handleImpact);
    this.scene.removeEventListener(EventType.TurretShot, this.handleTurretShot);
    this.scene.removeEventListener(
      EventType.BlockPlaced,
      this.handleBlockPlaced,
    );
    this.scene.removeEventListener(EventType.BlockSold, this.handleBlockSold);
    this.scene.removeEventListener(
      EventType.ObstacleDestroyed,
      this.handleObstacleDestroyed,
    );
    this.scene.removeEventListener(
      EventType.RepairPickup,
      this.handleRepairPickup,
    );
    this.scene.removeEventListener(EventType.Explosion, this.handleExplosion);
    this.scene.removeEventListener(
      EventType.ExplosiveTriggered,
      this.handleFuse,
    );
    this.scene.removeEventListener(
      EventType.CreaturesSpawned,
      this.handleCreaturesSpawned,
    );
    this.scene.removeEventListener(
      EventType.BlockDestroyed,
      this.handleBlockLoss,
    );
    this.scene.removeEventListener(EventType.TimerTick, this.handleTimerTick);
    this.scene.removeEventListener(
      EventType.TurbinesStarted,
      this.handleTurbinesStarted,
    );
    this.scene.removeEventListener(
      EventType.TurbinesStopped,
      this.handleTurbinesStopped,
    );
  }

  private resolve(id?: string): AudioSource | undefined {
    const actor = id
      ? (this.scene.findChildById(id, true) as Actor | undefined)
      : undefined;
    return actor?.getComponent(AudioSource);
  }

  private handleEscapeStart = (): void => {
    this.buildMusicSource?.stop();
    this.escapeMusicSource?.play();
  };

  private handleGameOver = (event: GameOverEvent): void => {
    this.buildMusicSource?.stop();
    this.escapeMusicSource?.stop();
    this.turbineSource?.stop();

    if (event.isWin) {
      this.winSource?.play();
    } else {
      this.loseSource?.play();
    }
  };

  private handleImpact = (): void => {
    this.impactSource?.play();
  };

  private handleTurretShot = (): void => {
    this.turretShotSource?.play();
  };

  private handleBlockPlaced = (): void => {
    this.blockPlacedSource?.play();
  };

  private handleBlockSold = (): void => {
    this.blockSoldSource?.play();
  };

  private handleObstacleDestroyed = (): void => {
    this.obstacleDestroyedSource?.play();
  };

  private handleRepairPickup = (): void => {
    this.repairPickupSource?.play();
  };

  private handleExplosion = (): void => {
    this.explosionSource?.play();
  };

  private handleFuse = (): void => {
    this.fuseSource?.play();
  };

  private handleCreaturesSpawned = (): void => {
    this.creaturesSpawnedSource?.play();
  };

  private handleBlockLoss = (): void => {
    this.blockLossSource?.play();
  };

  private handleTimerTick = (event: TimerTickEvent): void => {
    if (event.secondsLeft > 0 && event.secondsLeft <= CRITICAL_SECONDS_LEFT) {
      this.countdownSource?.play();
    }
  };

  private handleTurbinesStarted = (): void => {
    this.turbineSource?.play();
  };

  private handleTurbinesStopped = (): void => {
    this.turbineSource?.stop();
  };
}
