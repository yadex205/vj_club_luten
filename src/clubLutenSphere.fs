/*
{
  "DESCRIPTION": "club_luten sphere visualizer",
  "CREDIT": "Kanon Kakuno <yadex205@yadex205.com>",
  "CATEGORIES": ["club_luten", "GENERATOR"],
}
*/

const float PI = 3.141592;

// @see https://gist.github.com/companje/29408948f1e8be54dd5733a74ca49bb9
float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

mat2 rotate2d(float radian) {
  return mat2(cos(radian), sin(radian), -sin(radian), cos(radian));
}

float sdf(vec3 position) {
  position.xy = mod(position.xy, 8.0 - mod(TIME, 8.0) * 2.0) - 4.0 + mod(TIME, 8.0) * 1.0;
  position.z = mod(position.z, 16.0) - 8.0;
  return length(max(abs(position) - vec3(0.2, 0.2, 1.0), 0.0));
}

void main() {
  // float isScreen1 = step(0.0 + 0.012, isf_FragNormCoord.x) * step(isf_FragNormCoord.x, 0.5 - 0.012) * step(0.5 + 0.0145, isf_FragNormCoord.y) * step(isf_FragNormCoord.y, 1.0 - 0.0145);
  float isScreen1 = step(isf_FragNormCoord.x, 0.5) * step(0.5, isf_FragNormCoord.y);
  // float isScreen2 = step(0.5 + 0.016, isf_FragNormCoord.x) * step(isf_FragNormCoord.x, 1.0 - 0.016) * step(0.5 + 0.0155, isf_FragNormCoord.y) * step(isf_FragNormCoord.y, 1.0 - 0.0155);
  float isScreen2 = step(0.5, isf_FragNormCoord.x) * step(0.5, isf_FragNormCoord.y);
  float isScreen3 = step(isf_FragNormCoord.x, 0.5) * step(isf_FragNormCoord.y, 0.5);
  float isScreen4 = step(0.5, isf_FragNormCoord.x) * step(isf_FragNormCoord.y, 0.5);

  float rayZAdjust = 0.35;

  vec3 rayScreen1 = normalize(vec3(
    map(isf_FragNormCoord.x, 0.0 + 0.012, 0.5 - 0.012, -1.0, 1.0),
    1.0,
    map(isf_FragNormCoord.y, 0.5 + 0.015, 1.0 - 0.015, -1.0 + rayZAdjust, 1.0 + rayZAdjust)
  ));
  vec3 rayScreen2 = normalize(vec3(
    map(isf_FragNormCoord.x, 0.5 + 0.0135, 1.0 - 0.0135, -1.0, 1.0),
    map(isf_FragNormCoord.y, 0.5 + 0.013, 1.0 - 0.0130, -1.0, 1.0),
    -1.0 + rayZAdjust
  ));
  vec3 ray = abs(isScreen1 * rayScreen1 + isScreen2 * rayScreen2);

  vec3 cameraPosition = vec3(0.0, 0.0, mod(TIME * 4.0, 16.0));
  vec3 rayPosition = cameraPosition;
  float theDistance = 1.0;

  for (float i = 1.0; i < 32.0; i++) {
    theDistance = sdf(rayPosition);
    rayPosition += ray * theDistance;
  }

  float isHit = step(theDistance, 0.001);
  float fragColor = isHit * 0.8;

  gl_FragColor = vec4(fragColor, fragColor, fragColor, 1.0);
  // gl_FragColor = vec4(step(theDistance, 0.001), (1.0 - max(isScreen1, isScreen2)) * step(0.5, isf_FragNormCoord.y) * step(0.5, isf_FragNormCoord.x), (1.0 - max(isScreen1, isScreen2)) * step(0.5, isf_FragNormCoord.y) * step(isf_FragNormCoord.x, 0.5), 1.0);
  // gl_FragColor = vec4(
  //   step(0.0 + 0.012, isf_FragNormCoord.x) * step(isf_FragNormCoord.x, 0.5 - 0.012) * step(0.5 + 0.016, isf_FragNormCoord.y) * step(isf_FragNormCoord.y, 1.0 - 0.016),
  //   step(0.5 + 0.012, isf_FragNormCoord.x) * step(isf_FragNormCoord.x, 1.0 - 0.012) * step(0.5 + 0.014, isf_FragNormCoord.y) * step(isf_FragNormCoord.y, 1.0 - 0.014),
  //   0.0,
  //   1.0
  // );
}
