import { Filter, GlProgram, UniformGroup, defaultFilterVert } from 'pixi.js';
import { FilterEffect } from 'dacha';
import { DefineFilterEffect, DefineField } from 'dacha-workbench/decorators';

interface ChromaticAberrationOptions {
  strength?: number;
}

const DEFAULT_STRENGTH = 0.0025;

const FRAGMENT_SHADER = `precision highp float;

  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform vec4 uInputSize;
  uniform vec4 uOutputFrame;
  uniform vec4 uInputClamp;
  uniform float uStrength;

  void main(void)
  {
      vec2 frameScale = uOutputFrame.zw / uInputSize.xy;
      vec2 uv = vTextureCoord / frameScale;
      vec2 centered = uv - 0.5;
      vec2 offset = centered * uStrength * frameScale;

      vec2 uvR = clamp(vTextureCoord - offset, uInputClamp.xy, uInputClamp.zw);
      vec2 uvB = clamp(vTextureCoord + offset, uInputClamp.xy, uInputClamp.zw);

      float r = texture(uTexture, uvR).r;
      vec4 base = texture(uTexture, vTextureCoord);
      float b = texture(uTexture, uvB).b;

      finalColor = vec4(r, base.g, b, base.a);
  }
`;

@DefineFilterEffect({ name: 'ChromaticAberration' })
export default class ChromaticAberration extends FilterEffect {
  @DefineField({ initialValue: DEFAULT_STRENGTH })
  strength: number = DEFAULT_STRENGTH;

  create(options: ChromaticAberrationOptions): Filter {
    const uniforms = new UniformGroup({
      uStrength: {
        value: options.strength ?? DEFAULT_STRENGTH,
        type: 'f32',
      },
    });

    return new Filter({
      glProgram: GlProgram.from({
        vertex: defaultFilterVert,
        fragment: FRAGMENT_SHADER,
        name: 'chromatic-aberration-filter',
      }),
      resources: {
        chromaticAberrationUniforms: uniforms,
      },
    });
  }

  update(filter: Filter, options: ChromaticAberrationOptions): void {
    const { uniforms } = filter.resources.chromaticAberrationUniforms as UniformGroup;

    uniforms.uStrength = options.strength ?? DEFAULT_STRENGTH;
  }
}
