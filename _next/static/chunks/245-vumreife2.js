(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,1423,e=>{"use strict";let t=`#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`,r=`
float hash12(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
`,o=`#version 300 es
precision highp float;
precision highp int;
uniform float uAspect;
uniform float uTime;
uniform int uShape;
uniform vec3 uRamp[8];
uniform int uCount;
uniform float uScale;
uniform float uSoftness;
uniform float uFlow;
uniform vec2 uSeed;
uniform vec4 uTrail[24];
uniform float uRadius;
uniform vec4 uClicks[4];
uniform int uClickEffect;
uniform float uIntro;
uniform float uFrame;
in vec2 vUv;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 outAux;
${r}
vec2 hash22(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy) * 2.0 - 1.0;
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash22(i), f);
  float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return 0.5 + 0.5 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 labToRgb(vec3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 encode(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

vec3 horizon(vec2 p, float time, out float order) {
  float span = 0.5 * max(uAspect, 1.0);
  float x = p.x / span;
  float arch = -0.17 - 0.2 * x * x + 0.02 * sin(time * 0.6);
  float soft = mix(0.05, 0.22, uSoftness);
  float edge = p.y - arch;
  float rim = 0.38 * smoothstep(-soft, 0.42, edge);
  vec2 sun = vec2(0.08 * sin(time * 0.31) * span, 0.58);
  float spread = length((p - sun) / vec2(0.95 * span, 0.75));
  float sky = mix(0.55, 1.0, smoothstep(0.2, 0.95, spread));
  order = clamp(edge * 1.3, 0.0, 1.0);
  return vec3(rim, sky, smoothstep(0.18, 0.62, edge));
}

vec3 pinch(vec2 p, float time, out float order) {
  float span = 0.5 * max(uAspect, 0.75);
  float x = p.x / span;
  float sway = 0.02 * sin(x * 1.7 + time * 0.55);
  float breathe = 1.0 + 0.06 * sin(time * 0.8);
  float width = (0.13 + 0.22 * x * x) * breathe * mix(0.85, 1.2, uSoftness);
  float y = abs(p.y - sway) / width;
  float t = exp(-pow(y, 2.2)) * (0.42 + 0.58 * exp(-x * x * 1.8));
  order = clamp(abs(p.y - sway) * 2.4 + abs(x) * 0.3, 0.0, 1.0);
  return vec3(t, t, 0.0);
}

vec3 rise(vec2 p, float time, out float order) {
  float wide = max(uAspect, 0.9);
  vec2 center = vec2(0.05 * sin(time * 0.45) * wide, -0.7);
  vec2 radius = vec2(0.82 * wide, 0.64 * (1.0 + 0.04 * sin(time * 0.8)));
  float d = length((p - center) / radius);
  float soft = mix(0.6, 1.15, uSoftness);
  float t = clamp(pow(clamp(1.0 - d, 0.0, 1.0), soft) * 1.35, 0.0, 1.0);
  order = clamp((d - 0.2) * 1.3, 0.0, 1.0);
  return vec3(t, t, 0.0);
}

vec3 eclipse(vec2 p, float time, out float order) {
  float fit = min(1.0, uAspect * 1.25);
  float r = 0.23 * fit * (1.0 + 0.015 * sin(time * 0.9));
  float angle = atan(p.y, p.x);
  float rays = noise(vec2(cos(angle), sin(angle)) * 2.2 + time * 0.08) * 0.8 + 0.6;
  float d = length(p) - r;
  float reach = mix(0.07, 0.15, uSoftness) * rays * fit;
  float t = smoothstep(-0.006, 0.006 + 0.02 * uSoftness, d) * exp(-max(d, 0.0) / reach);
  order = clamp(d * 2.0, 0.0, 1.0);
  return vec3(t, t, 0.0);
}

vec4 tone(float t) {
  float x = smoothstep(0.3, 1.0, t) * float(uCount - 1);
  int index = int(floor(x));
  return vec4(mix(uRamp[index], uRamp[min(index + 1, uCount - 1)], fract(x)), smoothstep(0.0, 0.38, t));
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float time = uTime;
  vec2 q = p / uScale;
  vec2 warp = vec2(
    noise(q * 1.6 + uSeed + vec2(0.0, time * 0.3)),
    noise(q * 1.6 + uSeed.yx + vec2(4.3, -time * 0.24))
  ) - 0.5;
  q += warp * uFlow * (uShape == 3 ? 0.04 : 0.18);
  float order = 0.0;
  vec3 shape;
  if (uShape == 0) shape = horizon(q, time, order);
  else if (uShape == 1) shape = pinch(q, time, order);
  else if (uShape == 2) shape = rise(q, time, order);
  else shape = eclipse(q, time, order);

  float reveal = clamp((uIntro * 1.45 - order) / 0.45, 0.0, 1.0);
  reveal = reveal * reveal * (3.0 - 2.0 * reveal);

  float scramble = 0.0;
  for (int i = 0; i < 24; i++) {
    vec4 point = uTrail[i];
    if (point.z <= 0.0) continue;
    vec2 d = p - point.xy;
    scramble = max(scramble, point.z * exp(-dot(d, d) / (uRadius * uRadius)));
  }
  for (int i = 0; i < 4; i++) {
    vec4 c = uClicks[i];
    if (c.w <= 0.0) continue;
    float d = length(p - c.xy);
    if (uClickEffect == 1) {
      scramble = max(scramble, exp(-pow((d - c.z * 0.75) / 0.06, 2.0)) * c.w);
    } else if (uClickEffect == 2) {
      float size = 0.08 + 0.22 * (1.0 - exp(-c.z * 5.0));
      scramble = max(scramble, (1.0 - smoothstep(size * 0.6, size, d)) * c.w);
    }
  }
  vec2 t = clamp(shape.xy * mix(0.7, 1.0, reveal), 0.0, 1.0);
  vec4 mixed = mix(tone(t.x), tone(t.y), shape.z);
  vec3 color = encode(labToRgb(mixed.rgb));
  float alpha = mixed.a * reveal;
  float dither = (hash12(gl_FragCoord.xy + uFrame * 13.7) - 0.5) / 255.0;
  outColor = clamp(vec4(color * alpha + dither, alpha + dither), 0.0, 1.0);
  outAux = vec4(reveal, scramble, 0.0, 1.0);
}`,a=`
uniform sampler2D uField;
uniform sampler2D uAux;
uniform sampler2D uAtlas;
uniform vec2 uResolution;
uniform vec2 uCell;
uniform vec2 uOffset;
uniform vec2 uAtlasGrid;
uniform float uCount;
uniform float uDensity;
uniform float uOpacity;
uniform float uFlicker;
uniform float uDepth;
uniform float uGlyphTime;
uniform float uSeedValue;
uniform float uLight;
${r}
float sampleGlyph(float index, vec2 local, vec2 coord, float soft) {
  float column = mod(index, uAtlasGrid.x);
  float row = floor(index / uAtlasGrid.x);
  vec2 atlasUv = vec2((column + local.x) / uAtlasGrid.x, (row + 1.0 - local.y) / uAtlasGrid.y);
  vec2 continuous = coord / uAtlasGrid;
  float scale = exp2(soft);
  return textureGrad(uAtlas, atlasUv, dFdx(continuous) * scale, dFdy(continuous) * scale).a;
}

vec4 glyphAt(vec2 px) {
  vec2 coord = (px - uOffset) / uCell;
  vec2 cell = floor(coord);
  vec2 local = coord - cell;
  vec2 uv = clamp(((cell + 0.5) * uCell + uOffset) / uResolution, vec2(0.0), vec2(1.0));
  vec4 field = texture(uField, uv);
  vec4 aux = texture(uAux, uv);
  vec3 visible = uLight > 0.5 ? field.rgb + (1.0 - field.a) : field.rgb;
  float luma = dot(visible, vec3(0.2126, 0.7152, 0.0722));
  float value = uLight > 0.5 ? clamp((1.0 - luma) * 1.5, 0.0, 1.0) : luma;
  float pick = hash12(cell + uSeedValue * 7.31);
  float level = hash12(cell * 1.73 + 4.1 + uSeedValue);
  float tick = floor(uGlyphTime * 9.0 + level * 9.0);
  float wobble = (hash12(cell * 2.31 + tick * 17.7) - 0.5) * uFlicker * 0.4 + (level - 0.5) * 0.1;
  float tone = clamp(pow(value, 0.75) + wobble, 0.0, 1.0);
  float index = floor(tone * (uCount - 1.0) + 0.5);
  float decode = max(aux.g, 1.0 - aux.r);
  if (decode > 0.02) {
    float frame = floor(uGlyphTime * 20.0);
    if (hash12(cell * 3.7 + frame * 5.3) < decode * 1.25) index = 1.0 + floor(hash12(cell + frame * 1.37) * (uCount - 1.0));
  }
  float present = step(pick, uDensity * mix(1.0, 0.3 + tone * 1.1, 0.55));
  float cutoff = smoothstep(0.03, 0.1, value);
  float focus = step(hash12(cell * 0.71 + 9.2 + uSeedValue), uDepth);
  float coverage = sampleGlyph(index, local, coord, focus * 1.2);
  float alpha = uOpacity * present * cutoff * coverage * mix(1.0, 0.35 + 0.65 * level, 0.55) * (1.0 - focus * 0.5);
  if (uLight < 0.5) {
    vec3 light = field.rgb * 0.55 + vec3(0.03) * field.a;
    return vec4(light * alpha, 0.6 * field.a * alpha);
  }
  vec3 ink = visible * 0.8;
  return vec4(ink * alpha, alpha);
}
`,i=`#version 300 es
precision highp float;
uniform float uDownscale;
in vec2 vUv;
out vec4 outColor;
${a}
void main() {
  outColor = glyphAt(gl_FragCoord.xy * uDownscale);
}`,l=`#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uStep;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec4 sum = texture(uSource, vUv) * 0.2270270270;
  sum += texture(uSource, vUv + uStep * 1.3846153846) * 0.3162162162;
  sum += texture(uSource, vUv - uStep * 1.3846153846) * 0.3162162162;
  sum += texture(uSource, vUv + uStep * 3.2307692308) * 0.0702702703;
  sum += texture(uSource, vUv - uStep * 3.2307692308) * 0.0702702703;
  outColor = sum;
}`,u=`#version 300 es
precision highp float;
uniform sampler2D uHalo;
uniform float uGlow;
uniform float uGradient;
uniform float uGrain;
uniform float uFrame;
in vec2 vUv;
out vec4 outColor;
${a}
void main() {
  vec4 base = texture(uField, vUv) * uGradient;
  vec4 glyph = glyphAt(gl_FragCoord.xy);
  vec4 halo = texture(uHalo, vUv) * uGlow;
  vec4 color;
  if (uLight < 0.5) {
    color = base + glyph + halo;
  } else {
    color = glyph + base * (1.0 - glyph.a);
    color += halo * 0.6 * (1.0 - color.a);
  }
  float grain = (hash12(gl_FragCoord.xy + uFrame * vec2(17.0, 59.0)) + hash12(gl_FragCoord.xy * 1.31 + uFrame * 7.0) - 1.0) * uGrain;
  float body = clamp(color.a, 0.0, 1.0);
  color.rgb += grain * (0.25 + body) * 0.5;
  color.a = clamp(color.a, 0.0, 1.0);
  color.rgb = clamp(color.rgb, 0.0, color.a);
  outColor = color;
}`,n=[[.01,.13,.045],[.06,.5,.18],[.27,.95,.43],[.75,1,.8]],f=0,c=" .:+01=アイウエオカキクケコサシスセソタチツテトネハミムメモラリルレロワン",m=17,s=.88,d=1,h=.3,v=.08,p=.22,x=.55,E=1,g=.55,T=.55,b=.16,R=.025,A=3,y=!0,w=.12,_=1,S=!1,F='ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',U=e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4,M=(e,t,r)=>{let o=e.createShader(t);return o?(e.shaderSource(o,r),e.compileShader(o),e.getShaderParameter(o,e.COMPILE_STATUS))?o:(e.deleteShader(o),null):null},C=(e,r)=>{let o=M(e,e.VERTEX_SHADER,t),a=M(e,e.FRAGMENT_SHADER,r),i=e.createProgram();if(!o||!a||!i)return e.deleteShader(o),e.deleteShader(a),e.deleteProgram(i),null;if(e.attachShader(i,o),e.attachShader(i,a),e.linkProgram(i),e.deleteShader(o),e.deleteShader(a),!e.getProgramParameter(i,e.LINK_STATUS))return e.deleteProgram(i),null;let l={},u=e.getProgramParameter(i,e.ACTIVE_UNIFORMS);for(let t=0;t<u;t++){let r=e.getActiveUniform(i,t);if(!r)continue;let o=r.name.replace(/\[0\]$/,"");l[o]=e.getUniformLocation(i,o)}return{program:i,uniforms:l}},D=(e,t)=>({textures:Array.from({length:t},()=>{let t=e.createTexture();return e.bindTexture(e.TEXTURE_2D,t),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),t}),framebuffer:e.createFramebuffer(),width:0,height:0}),G=(e,t,r,o)=>{(t.width!==r||t.height!==o)&&(t.width=r,t.height=o,e.bindFramebuffer(e.FRAMEBUFFER,t.framebuffer),t.textures.forEach((t,a)=>{e.bindTexture(e.TEXTURE_2D,t),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,r,o,0,e.RGBA,e.UNSIGNED_BYTE,null),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+a,e.TEXTURE_2D,t,0)}),e.bindFramebuffer(e.FRAMEBUFFER,null))},L=(e,t,r)=>{let o=[...new Set([...t].filter(e=>"\n"!==e&&"\r"!==e))];o.length||o.push(" ");let a=`300 78px ${r}`,i=Math.min(16,o.length),l=Math.ceil(o.length/i),u=document.createElement("canvas");u.width=60*i,u.height=100*l;let n=u.getContext("2d");n&&(n.font=a,n.textAlign="center",n.textBaseline="middle",n.fillStyle="#fff",o.forEach((e,t)=>{let r=Math.floor(t/i);n.fillText(e,t%i*60+30,100*r+50+3)}));let f=e.createTexture();return e.bindTexture(e.TEXTURE_2D,f),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,e.RGBA,e.UNSIGNED_BYTE,u),e.generateMipmap(e.TEXTURE_2D),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),{texture:f,count:o.length,grid:[i,l]}};e.s(["createGradientAscii",0,function(e,t,r){let a=document.createElement("canvas");a.setAttribute("aria-hidden","true");let M=a.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,powerPreference:"low-power"});if(!M)throw Error("WebGL2 unavailable");let P=C(M,o),X=C(M,i),I=C(M,l),N=C(M,u);if(!P||!X||!I||!N){for(let e of[P,X,I,N])e&&M.deleteProgram(e.program);throw M.getExtension("WEBGL_lose_context")?.loseContext(),Error("Gradient ASCII shaders unavailable")}let O=M.createVertexArray(),B=D(M,2),q=D(M,1),k=D(M,1),z={width:1,height:1,ratio:1},V=new Float32Array(24),H=new Float32Array(16),W=[],$=new Float32Array(96),K=[],Y={x:0,y:0,inside:!1},j=null,J=0,Q=0,Z=+!!t,ee=0,et=0,er=0,eo=0,ea=!1,ei=t,el=!0,eu=!1;n.forEach((e,t)=>V.set((([e,t,r])=>{let o=U(e),a=U(t),i=U(r),l=Math.cbrt(.4122214708*o+.5363325363*a+.0514459929*i),u=Math.cbrt(.2119034982*o+.6806995451*a+.1073969566*i),n=Math.cbrt(.0883024619*o+.2817188376*a+.6299787005*i);return[.2104542553*l+.793617785*u-.0040720468*n,1.9779984951*l-2.428592205*u+.4505937099*n,.0259040371*l+.7827717662*u-.808675766*n]})(e),3*t)),j=L(M,c,F),document.fonts.load(`300 64px ${F}`,c).then(()=>{eu||(j&&M.deleteTexture(j.texture),j=L(M,c,F),el=!0,em())},()=>{});let en=(e,t,r)=>{if(!j)return;let o=e.uniforms,a=m*z.ratio,i=.6*a;M.activeTexture(M.TEXTURE0),M.bindTexture(M.TEXTURE_2D,B.textures[0]),M.uniform1i(o.uField,0),M.activeTexture(M.TEXTURE1),M.bindTexture(M.TEXTURE_2D,B.textures[1]),M.uniform1i(o.uAux,1),M.activeTexture(M.TEXTURE2),M.bindTexture(M.TEXTURE_2D,j.texture),M.uniform1i(o.uAtlas,2),M.uniform2f(o.uResolution,t,r),M.uniform2f(o.uCell,i,a),M.uniform2f(o.uOffset,(t-Math.ceil(t/i)*i)/2,(r-Math.ceil(r/a)*a)/2),M.uniform2f(o.uAtlasGrid,j.grid[0],j.grid[1]),M.uniform1f(o.uCount,j.count),M.uniform1f(o.uDensity,s),M.uniform1f(o.uOpacity,d),M.uniform1f(o.uFlicker,ei?0:p),M.uniform1f(o.uDepth,v),M.uniform1f(o.uGlyphTime,Q),M.uniform1f(o.uSeedValue,A),M.uniform1f(o.uLight,+!!S)},ef=()=>{z.width=Math.max(1,e.clientWidth),z.height=Math.max(1,e.clientHeight),z.ratio=Math.min(window.devicePixelRatio||1,1.25),a.width=Math.max(1,Math.round(z.width*z.ratio)),a.height=Math.max(1,Math.round(z.height*z.ratio)),G(M,B,Math.max(1,Math.round(a.width/2)),Math.max(1,Math.round(a.height/2)));let t=Math.max(1,Math.round(a.width/4)),r=Math.max(1,Math.round(a.height/4));G(M,q,t,r),G(M,k,t,r),el=!0,em()},ec=t=>{let r,o,i,l;if(er=0,eu||!ea||document.hidden)return;if(eo&&t-eo<1e3/30-.5)return void em();let u=ei?0:eo?Math.min(.1,Math.max(.001,(t-eo)/1e3)):1/30;eo=t,J+=u*T*.5,Q+=u*Math.max(T,.15),Z=ei?1:Math.min(1,Z+u/2.4),et+=u,!ei&&et>1/24&&(et=0,ee=(ee+1)%97),(e=>{for(K.forEach(t=>{t.age+=e});K.length&&K[K.length-1].age>.7;)K.pop();for(let e=0;e<24;e++){let t=K[e];if(!t){$[4*e+2]=0;continue}let r=1-t.age/.7;$.set([t.x,t.y,r*r,0],4*e)}for(W.forEach(t=>{t.age+=e});W.length&&W[W.length-1].age>1.2;)W.pop();for(let e=0;e<4;e++){let t=W[e];if(!t){H[4*e+3]=0;continue}let r=t.age/1.2,o=Math.min(1,t.age/.08)*(1-r)*(1-r);H.set([t.x,t.y,t.age,o],4*e)}})(u),r=z.width/z.height,M.bindVertexArray(O),M.disable(M.BLEND),M.bindFramebuffer(M.FRAMEBUFFER,B.framebuffer),M.drawBuffers([M.COLOR_ATTACHMENT0,M.COLOR_ATTACHMENT1]),M.viewport(0,0,B.width,B.height),M.useProgram(P.program),o=P.uniforms,M.uniform1f(o.uAspect,r),M.uniform1f(o.uTime,J),M.uniform1i(o.uShape,f),M.uniform3fv(o.uRamp,V),M.uniform1i(o.uCount,n.length),M.uniform1f(o.uScale,E),M.uniform1f(o.uSoftness,x),M.uniform1f(o.uFlow,g),M.uniform2f(o.uSeed,3.17*A,1.91*A),M.uniform4fv(o.uTrail,$),M.uniform1f(o.uRadius,w),M.uniform4fv(o.uClicks,H),M.uniform1i(o.uClickEffect,_),M.uniform1f(o.uIntro,Z),M.uniform1f(o.uFrame,ee),M.drawArrays(M.TRIANGLES,0,3),(i=h>.001)&&(M.bindFramebuffer(M.FRAMEBUFFER,q.framebuffer),M.drawBuffers([M.COLOR_ATTACHMENT0]),M.viewport(0,0,q.width,q.height),M.useProgram(X.program),en(X,a.width,a.height),M.uniform1f(X.uniforms.uDownscale,a.width/q.width),M.drawArrays(M.TRIANGLES,0,3),M.useProgram(I.program),M.activeTexture(M.TEXTURE0),M.uniform1i(I.uniforms.uSource,0),M.bindFramebuffer(M.FRAMEBUFFER,k.framebuffer),M.bindTexture(M.TEXTURE_2D,q.textures[0]),M.uniform2f(I.uniforms.uStep,1/q.width,0),M.drawArrays(M.TRIANGLES,0,3),M.bindFramebuffer(M.FRAMEBUFFER,q.framebuffer),M.bindTexture(M.TEXTURE_2D,k.textures[0]),M.uniform2f(I.uniforms.uStep,0,1/q.height),M.drawArrays(M.TRIANGLES,0,3)),M.bindFramebuffer(M.FRAMEBUFFER,null),M.viewport(0,0,a.width,a.height),M.useProgram(N.program),en(N,a.width,a.height),l=N.uniforms,M.activeTexture(M.TEXTURE3),M.bindTexture(M.TEXTURE_2D,q.textures[0]),M.uniform1i(l.uHalo,3),M.uniform1f(l.uGlow,i?h:0),M.uniform1f(l.uGradient,b),M.uniform1f(l.uGrain,R),M.uniform1f(l.uFrame,ee),M.drawArrays(M.TRIANGLES,0,3),e.dataset.rendered="true",el=!1,ei?eo=0:em()};function em(){er||eu||!ea||document.hidden||!el&&ei||(er=requestAnimationFrame(ec))}function es(){cancelAnimationFrame(er),er=0,eo=0}let ed=t=>{let r=e.getBoundingClientRect(),o=(t.clientX-r.left)/Math.max(1,r.width),a=1-(t.clientY-r.top)/Math.max(1,r.height),i=r.width/Math.max(1,r.height);Y.inside=o>=0&&o<=1&&a>=0&&a<=1,Y.x=(o-.5)*i,Y.y=a-.5},eh=e=>{if(ei||!ea||document.hidden)return;if(ed(e),!Y.inside||!y)return;let t=K[0],r=t?Math.hypot(Y.x-t.x,Y.y-t.y):1/0;if(!(r<.015)){if(t&&t.age<.1){let e=Math.min(6,Math.floor(r/.03));for(let r=1;r<=e;r++){let o=r/(e+1);K.unshift({x:t.x+(Y.x-t.x)*o,y:t.y+(Y.y-t.y)*o,age:0})}}K.unshift({x:Y.x,y:Y.y,age:0}),K.length=Math.min(K.length,24),em()}},ev=e=>{!ei&&ea&&!document.hidden&&(ed(e),Y.inside&&_&&(W.unshift({x:Y.x,y:Y.y,age:0}),W.length>4&&W.pop(),em()))},ep=()=>{document.hidden?es():em()};function ex(e){e.preventDefault(),eb(),r()}let eE=e.parentElement??e,eg=new ResizeObserver(ef),eT=new IntersectionObserver(([e])=>{(ea=e.isIntersecting)?em():es()}),eb=()=>{if(!eu){for(let e of(eu=!0,es(),eg.disconnect(),eT.disconnect(),eE.removeEventListener("pointermove",eh),eE.removeEventListener("pointerdown",ev),document.removeEventListener("visibilitychange",ep),a.removeEventListener("webglcontextlost",ex),[B,q,k]))e.textures.forEach(e=>M.deleteTexture(e)),M.deleteFramebuffer(e.framebuffer);for(let e of(j&&M.deleteTexture(j.texture),M.deleteVertexArray(O),[P,X,I,N]))M.deleteProgram(e.program);M.getExtension("WEBGL_lose_context")?.loseContext(),a.remove(),delete e.dataset.rendered}};return e.appendChild(a),a.addEventListener("webglcontextlost",ex),eE.addEventListener("pointermove",eh,{passive:!0}),eE.addEventListener("pointerdown",ev,{passive:!0}),document.addEventListener("visibilitychange",ep),eg.observe(e),eT.observe(e),ef(),{setPaused(e){ei=e,es(),K.length=0,W.length=0,$.fill(0),H.fill(0),el=!0,em()},dispose:eb}}],1423)}]);