"use strict";

class Shader {
  /**
   * @type {WebGLRenderingContext}
   */
  #gl;

  /**
   * @type {GLenum}
   */
  #glShaderType;

  /**
   * @type {WebGLShader}
   */
  #glShader;

  /**
   * @param gl {WebGLRenderingContext}
   * @param glShaderType {GLenum}
   */
  constructor(gl, glShaderType) {
    this.#gl = gl;
    this.#glShaderType = glShaderType;
  }

  get typeName() {
    const gl = this.#gl;

    switch (this.#glShaderType) {
      case gl.VERTEX_SHADER:   return "vertex";
      case gl.FRAGMENT_SHADER: return "fragment";
      default:                 return "unknown";
    }
  }

  /**
   * @return {WebGLShader}
   */
  get glShader() {
    return this.#glShader;
  }

  /**
   * @return {GLboolean}
   */
  get glShaderCompileStatus() {
    const gl = this.#gl;
    const glShader = this.#glShader;

    if (!glShader) {
      return;
    }

    return gl.getShaderParameter(glShader, gl.COMPILE_STATUS);
  }

  /**
   * @return {string}
   */
  get glShaderInfoLog() {
    const gl = this.#gl;
    const glShader = this.#glShader;

    return gl.getShaderInfoLog(glShader);
  }

  /**
   * @param shaderSourceCode {string}
   */
  compile = (shaderSourceCode) => {
    const gl = this.#gl;
    const glShaderType = this.#glShaderType;

    const glShader = gl.createShader(glShaderType);
    gl.shaderSource(glShader, shaderSourceCode.trim());
    gl.compileShader(glShader);

    this.#glShader = glShader;
  }
}

class ShaderProgram {
  /**
   * @type {WebGLRenderingContext}
   */
  #gl;

  /**
   * @type {WebGLProgram}
   */
  #glProgram;

  /**
   * @param gl {WebGLRenderingContext}
   */
  constructor(gl) {
    this.#gl = gl;
  }

  get gl() {
    return this.#gl;
  }

  /**
   * @param vertexShader {Shader}
   * @param fragmentShader {Shader}
   */
  compile = (vertexShader, fragmentShader) => {
    const gl = this.#gl;

    const glProgram = gl.createProgram();
    gl.attachShader(glProgram, vertexShader.glShader);
    gl.attachShader(glProgram, fragmentShader.glShader);
    gl.linkProgram(glProgram);

    this.#glProgram = glProgram;
  }

  use = () => {
    const gl = this.#gl;
    const glProgram = this.#glProgram;

    gl.useProgram(glProgram);
  }

  /**
   * @param attributeName {string}
   * @return {number}
   */
  getAttributeLocation = (attributeName) => {
    const gl = this.#gl;
    const glProgram = this.#glProgram;

    return gl.getAttribLocation(glProgram, attributeName);
  }

  /**
   * @param uniformName {string}
   * @return {WebGLUniformLocation}
   */
  getUniformLocation = (uniformName) => {
    const gl = this.#gl;
    const glProgram = this.#glProgram;

    return gl.getUniformLocation(glProgram, uniformName);
  }
}

class IsfVertexShader extends Shader {
  /**
   * @param gl {WebGLRenderingContext}
   */
  constructor(gl) {
    super(gl, gl.VERTEX_SHADER);
  }

  async init() {
    const shaderSourceCodeRes = await fetch("./isfVertexShader.vs");
    const shaderSourceCode = await shaderSourceCodeRes.text();

    this.compile(shaderSourceCode);

    if (!this.glShaderCompileStatus) {
      console.error(`Failed to compile vertex shader.\n\n${this.glShaderInfoLog}`);
    }
  }
}

class IsfFragmentShader extends Shader {
  /**
   * @param gl {WebGLRenderingContext}
   */
  constructor(gl) {
    super(gl, gl.FRAGMENT_SHADER);
  }

  /**
   * @param isfFilePath {string}
   */
  async init(isfFilePath) {
    const shaderHeaderSourceCodeRes = await fetch("./isfHeader.fs");
    const shaderHeaderSourceCode = await shaderHeaderSourceCodeRes.text();

    const shaderSourceCodeRes = await fetch(isfFilePath);
    const shaderSourceCode = await shaderSourceCodeRes.text();

    this.compile(shaderHeaderSourceCode + "\n\n" + shaderSourceCode);

    if (!this.glShaderCompileStatus) {
      console.error(`Failed to compile fragment shader.\n\n${this.glShaderInfoLog}`);
    }
  }
}

class IsfProgram extends ShaderProgram {
  /**
   * @type {WebGLUniformLocation}
   */
  #timeUniformLocation;

  /**
   * @type {WebGLUniformLocation}
   */
  #renderSizeUniformLocation;

  /**
   * @param vertexShader {Shader}
   * @param fragmentShader {Shader}
   */
  init = (vertexShader, fragmentShader) => {
    const gl = this.gl;

    this.compile(vertexShader, fragmentShader);

    const positionAttributeLocation = this.getAttributeLocation("position");
    const vertexPositions = [-1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const timeUniformLocation = this.getUniformLocation("TIME");
    const renderSizeUniformLocation = this.getUniformLocation("RENDERSIZE");
    this.#timeUniformLocation = timeUniformLocation;
    this.#renderSizeUniformLocation = renderSizeUniformLocation;
  }

  /**
   * @param time {number}
   */
  setCurrentTime(time) {
    const gl = this.gl;

    gl.uniform1f(this.#timeUniformLocation, time);
  }

  /**
   * @param width {number}
   * @param height {number}
   */
  setRenderSize(width, height) {
    const gl = this.gl;

    gl.uniform2f(this.#renderSizeUniformLocation, width, height);
  }
}

class Application {
  /**
   * @type {HTMLCanvasElement}
   */
  #canvasEl;

  /**
   * @type {WebGLRenderingContext}
   */
  #gl;

  /**
   * @type {IsfProgram}
   */
  #isfProgram;

  /**
   * @type {number}
   */
  #intervalHandle;

  /**
   * @type {number}
   */
  #startTimeMs;

  /**
   * @return {HTMLCanvasElement}
   */
  get canvas() {
    return this.#canvasEl;
  }

  /**
   * @param isfFilePath {string}
   */
  init = async (isfFilePath) => {
    const canvasEl = document.createElement("canvas");
    const gl = canvasEl.getContext("webgl");

    gl.viewport(0, 0, 1920, 1080);
    canvasEl.width = 1920;
    canvasEl.height = 1080;
    canvasEl.style.display = "block";
    canvasEl.style.width = "960px";
    canvasEl.style.height = "540px";
    canvasEl.style.margin = "0";

    const isfVertexShader = new IsfVertexShader(gl);
    const isfFragmentShader = new IsfFragmentShader(gl);
    const isfProgram = new IsfProgram(gl);

    await isfVertexShader.init();
    await isfFragmentShader.init(isfFilePath);
    isfProgram.init(isfVertexShader, isfFragmentShader);
    isfProgram.use();

    this.#canvasEl = canvasEl;
    this.#gl = gl;
    this.#isfProgram = isfProgram;
  }

  run = () => {
    const fps = 60;
    const interval = 1000 / fps;

    window.clearInterval(this.#intervalHandle);

    this.#startTimeMs = Date.now();
    this.#intervalHandle = window.setInterval(this.#draw, interval);
  }

  #draw = () => {
    const gl = this.#gl;
    const isfProgram = this.#isfProgram;

    const currentTimeFromStartMs = Date.now() - this.#startTimeMs;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    isfProgram.setCurrentTime(currentTimeFromStartMs / 1000);
    isfProgram.setRenderSize(1920, 1080);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.flush();
  }
}
