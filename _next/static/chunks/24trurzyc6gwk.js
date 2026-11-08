(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,41517,e=>{"use strict";let t=`#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`,i=`#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uTravel;
out vec4 color;

float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }

float digit(vec2 cell, float bit) {
  vec2 q = (cell - vec2(.2, .13)) / vec2(.6, .74);
  if (min(q.x, q.y) < 0.0 || max(q.x, q.y) >= 1.0) return 0.0;
  ivec2 pixel = ivec2(q * vec2(3, 5));
  int index = pixel.x + (4 - pixel.y) * 3;
  int mask = bit > .5 ? 29850 : 31599;
  float ink = float((mask >> index) & 1);
  vec2 edge = fract(q * vec2(3, 5));
  return ink * smoothstep(0.0, .12, min(min(edge.x, edge.y), min(1.0-edge.x, 1.0-edge.y)));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = (uv - .5) * vec2(uResolution.x / uResolution.y, 1.0);
  float twist = .11 * sin(uTime * .35) + uTravel * .12;
  p = mat2(cos(twist), -sin(twist), sin(twist), cos(twist)) * p;
  vec3 ray = normalize(vec3(p, -1.1 + uTravel * .18));
  vec3 origin = vec3(.13 * sin(uTime * .3), .08 * cos(uTime * .24), 0);
  float a = dot(ray.xy, ray.xy);
  float b = dot(origin.xy, ray.xy);
  float c = dot(origin.xy, origin.xy) - 1.0;
  float distance = (-b + sqrt(max(0.0, b*b-a*c))) / max(a, .0001);
  vec3 hit = origin + ray * distance;
  float angle = atan(hit.y, hit.x) / 6.2831853 + .5;
  float speed = uTime * 2.8 + uTravel * uTravel * 6.0;
  vec2 grid = vec2(angle * 92.0, hit.z * 9.0 + speed);
  vec2 id = floor(grid);
  float bit = step(.5, hash(id.x * 17.0 + id.y * 113.0 + floor(uTime * 4.0)));
  float glyph = digit(fract(grid), bit);
  float stream = fract(id.y / 24.0 + hash(id.x) - uTime * .16);
  float trail = pow(stream, 4.0);
  float head = smoothstep(.94, .99, stream);
  float fog = exp(-distance * .095) * (1.0 - smoothstep(2.0, 32.0, distance));
  float light = (.12 + trail * .8) * fog;
  vec3 green = mix(vec3(.16, .75, .3), vec3(.76, 1, .81), head);
  vec3 ink = green * glyph * light;
  float halo = pow(trail, 8.0) * fog * .035;
  ink += vec3(.08, .6, .2) * halo;
  float vignette = 1.0 - smoothstep(.35, 1.05, length(p) * .55);
  color = vec4(vec3(.012, .022, .016) + ink * vignette, 1.0);
}`;e.s(["createMatrixIntro",0,function(e,o,n){let r=e.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,powerPreference:"low-power"});if(!r)throw Error("WebGL2 unavailable");let a=r.createProgram();if(!a)throw r.getExtension("WEBGL_lose_context")?.loseContext(),Error("WebGL program unavailable");let l=[],c=0,s=!1,d=!0,m=0,h=0,u=0,f=null,v=null,g=null;function x(){s||(s=!0,cancelAnimationFrame(c),window.removeEventListener("resize",p),document.removeEventListener("visibilitychange",y),e.removeEventListener("webglcontextlost",w),r.deleteProgram(a),l.forEach(e=>r.deleteShader(e)),r.getExtension("WEBGL_lose_context")?.loseContext())}function p(){let t=Math.min(window.devicePixelRatio,1.25,Math.sqrt(24e5/(window.innerWidth*window.innerHeight)));e.width=Math.round(window.innerWidth*t),e.height=Math.round(window.innerHeight*t),r.viewport(0,0,e.width,e.height)}function w(e){e.preventDefault(),x(),n()}function y(){cancelAnimationFrame(c),h=0,document.hidden||s||!d||(c=requestAnimationFrame(T))}function T(t){s||document.hidden||!d||(h&&(m+=Math.min(t-h,80)),h=t,t-u>=1e3/30&&(u=t,r.uniform2f(f,e.width,e.height),r.uniform1f(v,m/1e3),r.uniform1f(g,Math.min(m/1900,1)),r.drawArrays(r.TRIANGLES,0,3)),m>=1900?o():c=requestAnimationFrame(T))}try{for(let[e,o]of[[r.VERTEX_SHADER,t],[r.FRAGMENT_SHADER,i]]){let t=r.createShader(e);if(!t)throw Error("WebGL shader unavailable");if(l.push(t),r.shaderSource(t,o),r.compileShader(t),!r.getShaderParameter(t,r.COMPILE_STATUS))throw Error("Matrix shader did not compile");r.attachShader(a,t)}if(r.linkProgram(a),!r.getProgramParameter(a,r.LINK_STATUS))throw Error("Matrix program did not link");return r.useProgram(a),f=r.getUniformLocation(a,"uResolution"),v=r.getUniformLocation(a,"uTime"),g=r.getUniformLocation(a,"uTravel"),p(),window.addEventListener("resize",p),document.addEventListener("visibilitychange",y),e.addEventListener("webglcontextlost",w),document.hidden||(c=requestAnimationFrame(T)),{dispose:x,pause(){d=!1,cancelAnimationFrame(c)}}}catch(e){throw x(),e}}])}]);