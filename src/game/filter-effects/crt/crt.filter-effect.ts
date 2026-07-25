import { Filter, GlProgram, UniformGroup, defaultFilterVert } from 'pixi.js';
import { FilterEffect } from 'dacha';
import { DefineFilterEffect, DefineField } from 'dacha-workbench/decorators';

interface CrtOptions {
  scanlineSpacing?: number;
  scanlineStrength?: number;
  vignetteStrength?: number;
  vignetteInner?: number;
  vignetteOuter?: number;
}

const DEFAULT_SCANLINE_SPACING = 3;
const DEFAULT_SCANLINE_STRENGTH = 0.12;
const DEFAULT_VIGNETTE_STRENGTH = 0.35;
const DEFAULT_VIGNETTE_INNER = 0.35;
const DEFAULT_VIGNETTE_OUTER = 0.85;

const FRAGMENT_SHADER = `precision highp float;

  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform vec4 uInputSize;
  uniform vec4 uInputPixel;
  uniform vec4 uOutputFrame;
  uniform float uScanlineSpacing;
  uniform float uScanlineStrength;
  uniform float uVignetteStrength;
  uniform float uVignetteInner;
  uniform float uVignetteOuter;

  void main(void)
  {
      vec4 color = texture(uTexture, vTextureCoord);

      float resolution = uInputPixel.x / uInputSize.x;
      float scanlineSpacing = uScanlineSpacing * resolution;

      float scanline = mod(gl_FragCoord.y, scanlineSpacing * 2.0);
      float scanlineFactor = 1.0 - uScanlineStrength * step(scanlineSpacing, scanline);

      vec2 uv = vTextureCoord * uInputSize.xy / uOutputFrame.zw;
      vec2 centered = uv - 0.5;
      centered.x *= uOutputFrame.z / uOutputFrame.w;
      float dist = length(centered);
      float vignetteFactor = 1.0 - uVignetteStrength * smoothstep(uVignetteInner, uVignetteOuter, dist);

      color.rgb *= scanlineFactor * vignetteFactor;

      finalColor = color;
  }
`;

@DefineFilterEffect({ name: 'Crt' })
export default class Crt extends FilterEffect {
  @DefineField({ initialValue: DEFAULT_SCANLINE_SPACING })
  scanlineSpacing: number = DEFAULT_SCANLINE_SPACING;

  @DefineField({ initialValue: DEFAULT_SCANLINE_STRENGTH })
  scanlineStrength: number = DEFAULT_SCANLINE_STRENGTH;

  @DefineField({ initialValue: DEFAULT_VIGNETTE_STRENGTH })
  vignetteStrength: number = DEFAULT_VIGNETTE_STRENGTH;

  @DefineField({ initialValue: DEFAULT_VIGNETTE_INNER })
  vignetteInner: number = DEFAULT_VIGNETTE_INNER;

  @DefineField({ initialValue: DEFAULT_VIGNETTE_OUTER })
  vignetteOuter: number = DEFAULT_VIGNETTE_OUTER;

  create(options: CrtOptions): Filter {
    const uniforms = new UniformGroup({
      uScanlineSpacing: {
        value: options.scanlineSpacing ?? DEFAULT_SCANLINE_SPACING,
        type: 'f32',
      },
      uScanlineStrength: {
        value: options.scanlineStrength ?? DEFAULT_SCANLINE_STRENGTH,
        type: 'f32',
      },
      uVignetteStrength: {
        value: options.vignetteStrength ?? DEFAULT_VIGNETTE_STRENGTH,
        type: 'f32',
      },
      uVignetteInner: {
        value: options.vignetteInner ?? DEFAULT_VIGNETTE_INNER,
        type: 'f32',
      },
      uVignetteOuter: {
        value: options.vignetteOuter ?? DEFAULT_VIGNETTE_OUTER,
        type: 'f32',
      },
    });

    return new Filter({
      glProgram: GlProgram.from({
        vertex: defaultFilterVert,
        fragment: FRAGMENT_SHADER,
        name: 'crt-filter',
      }),
      resources: {
        crtUniforms: uniforms,
      },
    });
  }

  update(filter: Filter, options: CrtOptions): void {
    const { uniforms } = filter.resources.crtUniforms as UniformGroup;

    uniforms.uScanlineSpacing = options.scanlineSpacing ?? DEFAULT_SCANLINE_SPACING;
    uniforms.uScanlineStrength =
      options.scanlineStrength ?? DEFAULT_SCANLINE_STRENGTH;
    uniforms.uVignetteStrength =
      options.vignetteStrength ?? DEFAULT_VIGNETTE_STRENGTH;
    uniforms.uVignetteInner = options.vignetteInner ?? DEFAULT_VIGNETTE_INNER;
    uniforms.uVignetteOuter = options.vignetteOuter ?? DEFAULT_VIGNETTE_OUTER;
  }
}
