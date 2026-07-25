import { Filter, GlProgram, UniformGroup, defaultFilterVert } from 'pixi.js';
import { FilterEffect } from 'dacha';
import { DefineFilterEffect, DefineField } from 'dacha-workbench/decorators';

interface DustCloudsOptions {
  cellSize?: number;
  cloudSize?: number;
  speedX?: number;
  speedY?: number;
  threshold?: number;
  ditherStrength?: number;
  opacity?: number;
  dustColor?: [number, number, number];
  cameraOffsetX?: number;
  cameraOffsetY?: number;
  maskColor?: [number, number, number];
  maskTolerance?: number;
}

const DEFAULT_CELL_SIZE = 4;
const DEFAULT_CLOUD_SIZE = 220;
const DEFAULT_SPEED_X = 0.015;
const DEFAULT_SPEED_Y = 0.006;
const DEFAULT_THRESHOLD = 0.62;
const DEFAULT_DITHER_STRENGTH = 0.3;
const DEFAULT_OPACITY = 0.18;
const DEFAULT_DUST_COLOR: [number, number, number] = [0.961, 0.49, 0.29];
const DEFAULT_CAMERA_OFFSET = 0;
const DEFAULT_MASK_COLOR: [number, number, number] = [0.1686, 0.0353, 0.051];
const DEFAULT_MASK_TOLERANCE = 0;

const FRAGMENT_SHADER = `precision highp float;

  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform vec4 uInputSize;
  uniform vec4 uInputPixel;
  uniform float uCellSize;
  uniform float uCloudSize;
  uniform float uSpeedX;
  uniform float uSpeedY;
  uniform float uThreshold;
  uniform float uDitherStrength;
  uniform float uOpacity;
  uniform vec3 uDustColor;
  uniform float uTime;
  uniform float uCameraOffsetX;
  uniform float uCameraOffsetY;
  uniform vec3 uMaskColor;
  uniform float uMaskTolerance;

  float hash(vec2 p)
  {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p)
  {
      vec2 i = floor(p);
      vec2 f = fract(p);

      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float bayer2(vec2 a)
  {
      a = floor(a);
      return fract(a.x / 2.0 + a.y * a.y * 0.75);
  }

  float bayer4x4(vec2 c)
  {
      return bayer2(0.5 * c) * 0.25 + bayer2(c);
  }

  void main(void)
  {
      vec4 color = texture(uTexture, vTextureCoord);

      float resolution = uInputPixel.x / uInputSize.x;
      float cellSize = uCellSize * resolution;
      float cloudSize = uCloudSize * resolution;

      float stableY = vTextureCoord.y * uInputPixel.y;
      vec2 screenPos = vec2(gl_FragCoord.x, stableY);

      vec2 cameraOffset = vec2(uCameraOffsetX, uCameraOffsetY);
      vec2 pos = screenPos + cameraOffset;
      vec2 cellIndex = floor(pos / cellSize);
      vec2 quantizedPos = cellIndex * cellSize;

      vec2 drift = vec2(uTime * uSpeedX, uTime * uSpeedY);
      vec2 noiseCoord = quantizedPos / cloudSize + drift;

      float n = noise(noiseCoord) * 0.6
        + noise(noiseCoord * 2.375 + drift * 1.7 + 10.0) * 0.4;
      float dither = bayer4x4(cellIndex);

      float maskDist = distance(color.rgb, uMaskColor);
      float maskFactor = step(uMaskTolerance, maskDist);

      float dust = step(uThreshold, n + (dither - 0.5) * uDitherStrength) * uOpacity * maskFactor;

      color.rgb = mix(color.rgb, uDustColor, dust);

      finalColor = color;
  }
`;

@DefineFilterEffect({ name: 'DustClouds' })
export default class DustClouds extends FilterEffect {
  @DefineField({ initialValue: DEFAULT_CELL_SIZE })
  cellSize: number = DEFAULT_CELL_SIZE;

  @DefineField({ initialValue: DEFAULT_CLOUD_SIZE })
  cloudSize: number = DEFAULT_CLOUD_SIZE;

  @DefineField({ initialValue: DEFAULT_SPEED_X })
  speedX: number = DEFAULT_SPEED_X;

  @DefineField({ initialValue: DEFAULT_SPEED_Y })
  speedY: number = DEFAULT_SPEED_Y;

  @DefineField({ initialValue: DEFAULT_THRESHOLD })
  threshold: number = DEFAULT_THRESHOLD;

  @DefineField({ initialValue: DEFAULT_DITHER_STRENGTH })
  ditherStrength: number = DEFAULT_DITHER_STRENGTH;

  @DefineField({ initialValue: DEFAULT_OPACITY })
  opacity: number = DEFAULT_OPACITY;

  dustColor: [number, number, number] = DEFAULT_DUST_COLOR;

  create(options: DustCloudsOptions): Filter {
    const uniforms = new UniformGroup({
      uCellSize: { value: options.cellSize ?? DEFAULT_CELL_SIZE, type: 'f32' },
      uCloudSize: {
        value: options.cloudSize ?? DEFAULT_CLOUD_SIZE,
        type: 'f32',
      },
      uSpeedX: { value: options.speedX ?? DEFAULT_SPEED_X, type: 'f32' },
      uSpeedY: { value: options.speedY ?? DEFAULT_SPEED_Y, type: 'f32' },
      uThreshold: {
        value: options.threshold ?? DEFAULT_THRESHOLD,
        type: 'f32',
      },
      uDitherStrength: {
        value: options.ditherStrength ?? DEFAULT_DITHER_STRENGTH,
        type: 'f32',
      },
      uOpacity: { value: options.opacity ?? DEFAULT_OPACITY, type: 'f32' },
      uDustColor: {
        value: options.dustColor ?? DEFAULT_DUST_COLOR,
        type: 'vec3<f32>',
      },
      uTime: { value: 0, type: 'f32' },
      uCameraOffsetX: {
        value: options.cameraOffsetX ?? DEFAULT_CAMERA_OFFSET,
        type: 'f32',
      },
      uCameraOffsetY: {
        value: options.cameraOffsetY ?? DEFAULT_CAMERA_OFFSET,
        type: 'f32',
      },
      uMaskColor: {
        value: options.maskColor ?? DEFAULT_MASK_COLOR,
        type: 'vec3<f32>',
      },
      uMaskTolerance: {
        value: options.maskTolerance ?? DEFAULT_MASK_TOLERANCE,
        type: 'f32',
      },
    });

    return new Filter({
      glProgram: GlProgram.from({
        vertex: defaultFilterVert,
        fragment: FRAGMENT_SHADER,
        name: 'dust-clouds-filter',
      }),
      resources: {
        dustCloudsUniforms: uniforms,
      },
    });
  }

  update(
    filter: Filter,
    options: DustCloudsOptions,
    elapsedTime: number,
  ): void {
    const { uniforms } = filter.resources.dustCloudsUniforms as UniformGroup;

    uniforms.uCellSize = options.cellSize ?? DEFAULT_CELL_SIZE;
    uniforms.uCloudSize = options.cloudSize ?? DEFAULT_CLOUD_SIZE;
    uniforms.uSpeedX = options.speedX ?? DEFAULT_SPEED_X;
    uniforms.uSpeedY = options.speedY ?? DEFAULT_SPEED_Y;
    uniforms.uThreshold = options.threshold ?? DEFAULT_THRESHOLD;
    uniforms.uDitherStrength =
      options.ditherStrength ?? DEFAULT_DITHER_STRENGTH;
    uniforms.uOpacity = options.opacity ?? DEFAULT_OPACITY;
    uniforms.uDustColor = options.dustColor ?? DEFAULT_DUST_COLOR;
    uniforms.uTime = elapsedTime;
    uniforms.uCameraOffsetX = options.cameraOffsetX ?? DEFAULT_CAMERA_OFFSET;
    uniforms.uCameraOffsetY = options.cameraOffsetY ?? DEFAULT_CAMERA_OFFSET;
    uniforms.uMaskColor = options.maskColor ?? DEFAULT_MASK_COLOR;
    uniforms.uMaskTolerance = options.maskTolerance ?? DEFAULT_MASK_TOLERANCE;
  }
}
