import { Shader } from 'dacha';
import { DefineShader } from 'dacha-workbench/decorators';
import type { ShaderUniformDefinitions, ShaderUniforms } from 'dacha/renderer';

interface DamageFlashOptions {
  hitTime?: number;
  flashColor?: [number, number, number];
  flashDuration?: number;
  stateTint?: [number, number, number];
  stateStrength?: number;
}

const DEFAULT_HIT_TIME = -1000;
const DEFAULT_FLASH_COLOR: [number, number, number] = [1, 1, 1];
const DEFAULT_FLASH_DURATION = 0.1;
const DEFAULT_STATE_TINT: [number, number, number] = [1, 1, 1];
const DEFAULT_STATE_STRENGTH = 0;

const VERTEX_SHADER = `
  precision mediump float;

  attribute vec2 aPosition;
  attribute vec2 aUV;

  uniform mat3 uProjectionMatrix;
  uniform mat3 uWorldTransformMatrix;
  uniform mat3 uTransformMatrix;

  varying vec2 vUV;

  void main() {
    vUV = aUV;

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    vec3 pos = mvp * vec3(aPosition, 1.0);
    gl_Position = vec4(pos.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  varying vec2 vUV;

  uniform sampler2D uSampler;
  uniform vec2 uUVOffset;
  uniform vec2 uUVScale;
  uniform vec3 uTint;
  uniform float uAlpha;
  uniform float uTime;

  uniform float uHitTime;
  uniform vec3 uFlashColor;
  uniform float uFlashDuration;

  uniform vec3 uStateTint;
  uniform float uStateStrength;

  void main() {
    vec4 color = texture2D(uSampler, uUVOffset + vUV * uUVScale);
    color.rgb *= uTint;

    float flash = step(uTime - uHitTime, uFlashDuration) * color.a;
    color.rgb = mix(color.rgb, uFlashColor, flash);

    float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 duotone = luminance * uStateTint;
    color.rgb = mix(color.rgb, duotone, uStateStrength * color.a);

    color *= uAlpha;
    gl_FragColor = color;
  }
`;

@DefineShader({
  name: 'DamageFlash',
})
export default class DamageFlash extends Shader {
  vertex(): string {
    return VERTEX_SHADER;
  }

  fragment(): string {
    return FRAGMENT_SHADER;
  }

  uniforms(options: DamageFlashOptions): ShaderUniformDefinitions {
    return {
      uHitTime: { value: options.hitTime ?? DEFAULT_HIT_TIME, type: 'f32' },
      uFlashColor: {
        value: options.flashColor ?? DEFAULT_FLASH_COLOR,
        type: 'vec3<f32>',
      },
      uFlashDuration: {
        value: options.flashDuration ?? DEFAULT_FLASH_DURATION,
        type: 'f32',
      },
      uStateTint: {
        value: options.stateTint ?? DEFAULT_STATE_TINT,
        type: 'vec3<f32>',
      },
      uStateStrength: {
        value: options.stateStrength ?? DEFAULT_STATE_STRENGTH,
        type: 'f32',
      },
    };
  }

  updateUniforms(uniforms: ShaderUniforms, options: DamageFlashOptions): void {
    uniforms.uHitTime = options.hitTime ?? DEFAULT_HIT_TIME;
    uniforms.uStateTint = options.stateTint ?? DEFAULT_STATE_TINT;
    uniforms.uStateStrength = options.stateStrength ?? DEFAULT_STATE_STRENGTH;
  }
}
