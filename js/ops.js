"use strict";

var CABLES=CABLES||{};
CABLES.OPS=CABLES.OPS||{};

var Ops=Ops || {};
Ops.Gl=Ops.Gl || {};
Ops.Anim=Ops.Anim || {};
Ops.Math=Ops.Math || {};
Ops.Array=Ops.Array || {};
Ops.Boolean=Ops.Boolean || {};
Ops.Devices=Ops.Devices || {};
Ops.Gl.GLTF=Ops.Gl.GLTF || {};
Ops.WebAudio=Ops.WebAudio || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.Shader=Ops.Gl.Shader || {};
Ops.Gl.Textures=Ops.Gl.Textures || {};
Ops.Devices.Mouse=Ops.Devices.Mouse || {};
Ops.Gl.ShaderEffects=Ops.Gl.ShaderEffects || {};
Ops.Gl.TextureEffects=Ops.Gl.TextureEffects || {};
Ops.Gl.TextureEffects.Noise=Ops.Gl.TextureEffects.Noise || {};



// **************************************************************
// 
// Ops.Gl.MainLoop
// 
// **************************************************************

Ops.Gl.MainLoop = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const fpsLimit = op.inValue("FPS Limit", 0);
const trigger = op.outTrigger("trigger");
const width = op.outValue("width");
const height = op.outValue("height");
const reduceFocusFPS = op.inValueBool("Reduce FPS not focussed", true);
const reduceLoadingFPS = op.inValueBool("Reduce FPS loading");
const clear = op.inValueBool("Clear", true);
const clearAlpha = op.inValueBool("ClearAlpha", true);
const fullscreen = op.inValueBool("Fullscreen Button", false);
const active = op.inValueBool("Active", true);
const hdpi = op.inValueBool("Hires Displays", false);

op.onAnimFrame = render;
hdpi.onChange = function ()
{
    if (hdpi.get()) op.patch.cgl.pixelDensity = window.devicePixelRatio;
    else op.patch.cgl.pixelDensity = 1;

    op.patch.cgl.updateSize();
    if (CABLES.UI) gui.setLayout();
};

active.onChange = function ()
{
    op.patch.removeOnAnimFrame(op);

    if (active.get())
    {
        op.setUiAttrib({ "extendTitle": "" });
        op.onAnimFrame = render;
        op.patch.addOnAnimFrame(op);
        op.log("adding again!");
    }
    else
    {
        op.setUiAttrib({ "extendTitle": "Inactive" });
    }
};

const cgl = op.patch.cgl;
let rframes = 0;
let rframeStart = 0;

if (!op.patch.cgl) op.uiAttr({ "error": "No webgl cgl context" });

const identTranslate = vec3.create();
vec3.set(identTranslate, 0, 0, 0);
const identTranslateView = vec3.create();
vec3.set(identTranslateView, 0, 0, -2);

fullscreen.onChange = updateFullscreenButton;
setTimeout(updateFullscreenButton, 100);
let fsElement = null;


let winhasFocus = true;
let winVisible = true;

window.addEventListener("blur", () => { winhasFocus = false; });
window.addEventListener("focus", () => { winhasFocus = true; });
document.addEventListener("visibilitychange", () => { winVisible = !document.hidden; });


function getFpsLimit()
{
    if (reduceLoadingFPS.get() && op.patch.loading.getProgress() < 1.0) return 5;

    if (reduceFocusFPS.get())
    {
        if (!winVisible) return 10;
        if (!winhasFocus) return 30;
    }

    return fpsLimit.get();
}


function updateFullscreenButton()
{
    function onMouseEnter()
    {
        if (fsElement)fsElement.style.display = "block";
    }

    function onMouseLeave()
    {
        if (fsElement)fsElement.style.display = "none";
    }

    op.patch.cgl.canvas.addEventListener("mouseleave", onMouseLeave);
    op.patch.cgl.canvas.addEventListener("mouseenter", onMouseEnter);

    if (fullscreen.get())
    {
        if (!fsElement)
        {
            fsElement = document.createElement("div");

            const container = op.patch.cgl.canvas.parentElement;
            if (container)container.appendChild(fsElement);

            fsElement.addEventListener("mouseenter", onMouseEnter);
            fsElement.addEventListener("click", function (e)
            {
                if (CABLES.UI && !e.shiftKey) gui.cycleRendererSize();
                else cgl.fullScreen();
            });
        }

        fsElement.style.padding = "10px";
        fsElement.style.position = "absolute";
        fsElement.style.right = "5px";
        fsElement.style.top = "5px";
        fsElement.style.width = "20px";
        fsElement.style.height = "20px";
        fsElement.style.cursor = "pointer";
        fsElement.style["border-radius"] = "40px";
        fsElement.style.background = "#444";
        fsElement.style["z-index"] = "9999";
        fsElement.style.display = "none";
        fsElement.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" id=\"Capa_1\" x=\"0px\" y=\"0px\" viewBox=\"0 0 490 490\" style=\"width:20px;height:20px;\" xml:space=\"preserve\" width=\"512px\" height=\"512px\"><g><path d=\"M173.792,301.792L21.333,454.251v-80.917c0-5.891-4.776-10.667-10.667-10.667C4.776,362.667,0,367.442,0,373.333V480     c0,5.891,4.776,10.667,10.667,10.667h106.667c5.891,0,10.667-4.776,10.667-10.667s-4.776-10.667-10.667-10.667H36.416     l152.459-152.459c4.093-4.237,3.975-10.99-0.262-15.083C184.479,297.799,177.926,297.799,173.792,301.792z\" fill=\"#FFFFFF\"/><path d=\"M480,0H373.333c-5.891,0-10.667,4.776-10.667,10.667c0,5.891,4.776,10.667,10.667,10.667h80.917L301.792,173.792     c-4.237,4.093-4.354,10.845-0.262,15.083c4.093,4.237,10.845,4.354,15.083,0.262c0.089-0.086,0.176-0.173,0.262-0.262     L469.333,36.416v80.917c0,5.891,4.776,10.667,10.667,10.667s10.667-4.776,10.667-10.667V10.667C490.667,4.776,485.891,0,480,0z\" fill=\"#FFFFFF\"/><path d=\"M36.416,21.333h80.917c5.891,0,10.667-4.776,10.667-10.667C128,4.776,123.224,0,117.333,0H10.667     C4.776,0,0,4.776,0,10.667v106.667C0,123.224,4.776,128,10.667,128c5.891,0,10.667-4.776,10.667-10.667V36.416l152.459,152.459     c4.237,4.093,10.99,3.975,15.083-0.262c3.992-4.134,3.992-10.687,0-14.82L36.416,21.333z\" fill=\"#FFFFFF\"/><path d=\"M480,362.667c-5.891,0-10.667,4.776-10.667,10.667v80.917L316.875,301.792c-4.237-4.093-10.99-3.976-15.083,0.261     c-3.993,4.134-3.993,10.688,0,14.821l152.459,152.459h-80.917c-5.891,0-10.667,4.776-10.667,10.667s4.776,10.667,10.667,10.667     H480c5.891,0,10.667-4.776,10.667-10.667V373.333C490.667,367.442,485.891,362.667,480,362.667z\" fill=\"#FFFFFF\"/></g></svg>";
    }
    else
    {
        if (fsElement)
        {
            fsElement.style.display = "none";
            fsElement.remove();
            fsElement = null;
        }
    }
}

op.onDelete = function ()
{
    cgl.gl.clearColor(0, 0, 0, 0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
};


function render(time)
{
    if (!active.get()) return;
    if (cgl.aborted || cgl.canvas.clientWidth === 0 || cgl.canvas.clientHeight === 0) return;

    const startTime = performance.now();

    op.patch.config.fpsLimit = getFpsLimit();

    if (cgl.canvasWidth == -1)
    {
        cgl.setCanvas(op.patch.config.glCanvasId);
        return;
    }

    if (cgl.canvasWidth != width.get() || cgl.canvasHeight != height.get())
    {
        width.set(cgl.canvasWidth);
        height.set(cgl.canvasHeight);
    }

    if (CABLES.now() - rframeStart > 1000)
    {
        CGL.fpsReport = CGL.fpsReport || [];
        if (op.patch.loading.getProgress() >= 1.0 && rframeStart !== 0)CGL.fpsReport.push(rframes);
        rframes = 0;
        rframeStart = CABLES.now();
    }
    CGL.MESH.lastShader = null;
    CGL.MESH.lastMesh = null;

    cgl.renderStart(cgl, identTranslate, identTranslateView);

    if (clear.get())
    {
        cgl.gl.clearColor(0, 0, 0, 1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }

    trigger.trigger();

    if (CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();

    if (CGL.Texture.previewTexture)
    {
        if (!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer = new CGL.Texture.texturePreview(cgl);
        CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
    }
    cgl.renderEnd(cgl);

    if (clearAlpha.get())
    {
        cgl.gl.clearColor(1, 1, 1, 1);
        cgl.gl.colorMask(false, false, false, true);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT);
        cgl.gl.colorMask(true, true, true, true);
    }

    if (!cgl.frameStore.phong)cgl.frameStore.phong = {};
    rframes++;

    CGL.profileData.profileMainloopMs = performance.now() - startTime;
}


};

Ops.Gl.MainLoop.prototype = new CABLES.Op();
CABLES.OPS["b0472a1d-db16-4ba6-8787-f300fbdc77bb"]={f:Ops.Gl.MainLoop,objName:"Ops.Gl.MainLoop"};




// **************************************************************
// 
// Ops.Gl.Matrix.OrbitControls
// 
// **************************************************************

Ops.Gl.Matrix.OrbitControls = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const render = op.inTrigger("render");
const minDist = op.inValueFloat("min distance");
const maxDist = op.inValueFloat("max distance");

const minRotY = op.inValue("min rot y", 0);
const maxRotY = op.inValue("max rot y", 0);

// const minRotX=op.inValue("min rot x",0);
// const maxRotX=op.inValue("max rot x",0);

const initialRadius = op.inValue("initial radius", 0);
const initialAxis = op.inValueSlider("initial axis y");
const initialX = op.inValueSlider("initial axis x");

const mul = op.inValueFloat("mul");
const smoothness = op.inValueSlider("Smoothness", 1.0);
const speedX = op.inValue("Speed X", 1);
const speedY = op.inValue("Speed Y", 1);

const active = op.inValueBool("Active", true);

const allowPanning = op.inValueBool("Allow Panning", true);
const allowZooming = op.inValueBool("Allow Zooming", true);
const allowRotation = op.inValueBool("Allow Rotation", true);
const restricted = op.inValueBool("restricted", true);
const pointerLock = op.inValueBool("Pointerlock", false);

const trigger = op.outTrigger("trigger");
const outRadius = op.outValue("radius");
const outXDeg = op.outValue("Rot X");
const outYDeg = op.outValue("Rot Y");

const inReset = op.inTriggerButton("Reset");

op.setPortGroup("Initial Values", [initialAxis, initialX, initialRadius]);
op.setPortGroup("Interaction", [mul, smoothness, speedX, speedY]);
op.setPortGroup("Boundaries", [minRotY, maxRotY, minDist, maxDist]);

mul.set(1);
minDist.set(0.05);
maxDist.set(99999);

inReset.onTriggered = reset;

const cgl = op.patch.cgl;
let eye = vec3.create();
const vUp = vec3.create();
const vCenter = vec3.create();
const viewMatrix = mat4.create();
const tempViewMatrix = mat4.create();
const vOffset = vec3.create();
const finalEyeAbs = vec3.create();

initialAxis.set(0.5);

let mouseDown = false;
let radius = 5;
outRadius.set(radius);

let lastMouseX = 0, lastMouseY = 0;
let percX = 0, percY = 0;

vec3.set(vCenter, 0, 0, 0);
vec3.set(vUp, 0, 1, 0);

const tempEye = vec3.create();
const finalEye = vec3.create();
const tempCenter = vec3.create();
const finalCenter = vec3.create();

let px = 0;
let py = 0;

let divisor = 1;
let element = null;
updateSmoothness();

op.onDelete = unbind;

let doLockPointer = false;

pointerLock.onChange = function ()
{
    doLockPointer = pointerLock.get();
    op.log("doLockPointer", doLockPointer);
};

const halfCircle = Math.PI;
const fullCircle = Math.PI * 2;

function reset()
{
    let off = 0;

    if (px % fullCircle < -halfCircle)
    {
        off = -fullCircle;
        px %= -fullCircle;
    }
    else
    if (px % fullCircle > halfCircle)
    {
        off = fullCircle;
        px %= fullCircle;
    }
    else px %= fullCircle;

    py %= (Math.PI);

    vec3.set(vOffset, 0, 0, 0);
    vec3.set(vCenter, 0, 0, 0);
    vec3.set(vUp, 0, 1, 0);

    percX = (initialX.get() * Math.PI * 2 + off);
    percY = (initialAxis.get() - 0.5);

    radius = initialRadius.get();
    eye = circlePos(percY);
}

function updateSmoothness()
{
    divisor = smoothness.get() * 10 + 1.0;
}

smoothness.onChange = updateSmoothness;

let initializing = true;

function ip(val, goal)
{
    if (initializing) return goal;
    return val + (goal - val) / divisor;
}

let lastPy = 0;
const lastPx = 0;

render.onTriggered = function ()
{
    // if (cgl.frameStore.shadowPass) return trigger.trigger();

    cgl.pushViewMatrix();

    px = ip(px, percX);
    py = ip(py, percY);

    let degY = (py + 0.5) * 180;

    if (minRotY.get() !== 0 && degY < minRotY.get())
    {
        degY = minRotY.get();
        py = lastPy;
    }
    else if (maxRotY.get() !== 0 && degY > maxRotY.get())
    {
        degY = maxRotY.get();
        py = lastPy;
    }
    else
    {
        lastPy = py;
    }

    const degX = (px) * CGL.RAD2DEG;

    outYDeg.set(degY);
    outXDeg.set(degX);

    circlePosi(eye, py);

    vec3.add(tempEye, eye, vOffset);
    vec3.add(tempCenter, vCenter, vOffset);

    finalEye[0] = ip(finalEye[0], tempEye[0]);
    finalEye[1] = ip(finalEye[1], tempEye[1]);
    finalEye[2] = ip(finalEye[2], tempEye[2]);

    finalCenter[0] = ip(finalCenter[0], tempCenter[0]);
    finalCenter[1] = ip(finalCenter[1], tempCenter[1]);
    finalCenter[2] = ip(finalCenter[2], tempCenter[2]);

    const empty = vec3.create();
    // var fpm=mat4.create();

    // mat4.translate(fpm, fpm, finalEye);
    // mat4.rotate(fpm, fpm, px, vUp);
    // mat4.multiply(fpm,fpm, cgl.vMatrix);
    // vec3.transformMat4(finalEyeAbs, empty, fpm);

    // outPosX.set(finalEyeAbs[0]);
    // outPosY.set(finalEyeAbs[1]);
    // outPosZ.set(finalEyeAbs[2]);

    mat4.lookAt(viewMatrix, finalEye, finalCenter, vUp);
    mat4.rotate(viewMatrix, viewMatrix, px, vUp);

    // finaly multiply current scene viewmatrix
    mat4.multiply(cgl.vMatrix, cgl.vMatrix, viewMatrix);

    // vec3.transformMat4(finalEyeAbs, empty, cgl.vMatrix);

    // outPosX.set(finalEyeAbs[0]);
    // outPosY.set(finalEyeAbs[1]);
    // outPosZ.set(finalEyeAbs[2]);

    // var fpm=mat4.create();
    // mat4.identity(fpm);
    // mat4.translate(fpm,fpm,finalEye);
    // mat4.rotate(fpm, fpm, px, vUp);
    // mat4.multiply(fpm,fpm,cgl.vMatrix);

    // // vec3.copy(finalEyeAbs,finalEye);
    // // vec3.set(finalEyeAbs,0,1,0);
    // // mat4.rotate(viewMatrix, viewMatrix, px, vUp);
    // // vec3.transformMat4( finalEyeAbs, finalEye, fpm );

    // // vec3.transformMat4( finalEyeAbs, finalEyeAbs, cgl.vMatrix );
    // // mat4.getTranslation(finalEyeAbs,fpm);
    // var pos=vec3.create();
    // vec3.transformMat4(finalEyeAbs, empty, fpm);

    // outPosX.set(finalEyeAbs[0]);
    // outPosY.set(finalEyeAbs[1]);
    // outPosZ.set(finalEyeAbs[2]);

    trigger.trigger();
    cgl.popViewMatrix();
    initializing = false;
};

function circlePosi(vec, perc)
{
    const mmul = mul.get();
    if (radius < minDist.get() * mmul) radius = minDist.get() * mmul;
    if (radius > maxDist.get() * mmul) radius = maxDist.get() * mmul;

    outRadius.set(radius * mmul);

    let i = 0, degInRad = 0;
    // var vec=vec3.create();
    degInRad = 360 * perc / 2 * CGL.DEG2RAD;
    vec3.set(vec,
        Math.cos(degInRad) * radius * mmul,
        Math.sin(degInRad) * radius * mmul,
        0);
    return vec;
}

function circlePos(perc)
{
    const mmul = mul.get();
    if (radius < minDist.get() * mmul)radius = minDist.get() * mmul;
    if (radius > maxDist.get() * mmul)radius = maxDist.get() * mmul;

    outRadius.set(radius * mmul);

    let i = 0, degInRad = 0;
    const vec = vec3.create();
    degInRad = 360 * perc / 2 * CGL.DEG2RAD;
    vec3.set(vec,
        Math.cos(degInRad) * radius * mmul,
        Math.sin(degInRad) * radius * mmul,
        0);
    return vec;
}

function onmousemove(event)
{
    if (!mouseDown) return;

    const x = event.clientX;
    const y = event.clientY;

    let movementX = (x - lastMouseX);
    let movementY = (y - lastMouseY);

    if (doLockPointer)
    {
        movementX = event.movementX * mul.get();
        movementY = event.movementY * mul.get();
    }

    movementX *= speedX.get();
    movementY *= speedY.get();

    if (event.buttons == 2 && allowPanning.get())
    {
        vOffset[2] += movementX * 0.01 * mul.get();
        vOffset[1] += movementY * 0.01 * mul.get();
    }
    else
    if (event.buttons == 4 && allowZooming.get())
    {
        radius += movementY * 0.05;
        eye = circlePos(percY);
    }
    else
    {
        if (allowRotation.get())
        {
            percX += movementX * 0.003;
            percY += movementY * 0.002;

            if (restricted.get())
            {
                if (percY > 0.5)percY = 0.5;
                if (percY < -0.5)percY = -0.5;
            }
        }
    }

    lastMouseX = x;
    lastMouseY = y;
}

function onMouseDown(event)
{
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    mouseDown = true;

    try { element.setPointerCapture(event.pointerId); }
    catch (e) {}

    if (doLockPointer)
    {
        const el = op.patch.cgl.canvas;
        el.requestPointerLock = el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock;
        if (el.requestPointerLock) el.requestPointerLock();
        else op.warn("no requestPointerLock found");
        // document.addEventListener("mousemove", onmousemove, false);

        document.addEventListener("pointerlockchange", lockChange, false);
        document.addEventListener("mozpointerlockchange", lockChange, false);
        document.addEventListener("webkitpointerlockchange", lockChange, false);
    }
}

function onMouseUp(e)
{
    mouseDown = false;
    // cgl.canvas.style.cursor='url(/ui/img/rotate.png),pointer';

    try { element.releasePointerCapture(e.pointerId); }
    catch (e) {}

    if (doLockPointer)
    {
        document.removeEventListener("pointerlockchange", lockChange, false);
        document.removeEventListener("mozpointerlockchange", lockChange, false);
        document.removeEventListener("webkitpointerlockchange", lockChange, false);

        if (document.exitPointerLock) document.exitPointerLock();
        document.removeEventListener("mousemove", pointerLock, false);
    }
}

function lockChange()
{
    const el = op.patch.cgl.canvas;

    if (document.pointerLockElement === el || document.mozPointerLockElement === el || document.webkitPointerLockElement === el)
    {
        document.addEventListener("mousemove", onmousemove, false);
    }
}

function onMouseEnter(e)
{
    // cgl.canvas.style.cursor='url(/ui/img/rotate.png),pointer';
}

initialRadius.onChange = function ()
{
    radius = initialRadius.get();
    reset();
};

initialX.onChange = function ()
{
    px = percX = (initialX.get() * Math.PI * 2);
};

initialAxis.onChange = function ()
{
    py = percY = (initialAxis.get() - 0.5);
    eye = circlePos(percY);
};

const onMouseWheel = function (event)
{
    if (allowZooming.get())
    {
        const delta = CGL.getWheelSpeed(event) * 0.06;
        radius += (parseFloat(delta)) * 1.2;

        eye = circlePos(percY);
    }
};

const ontouchstart = function (event)
{
    doLockPointer = false;
    if (event.touches && event.touches.length > 0) onMouseDown(event.touches[0]);
};

const ontouchend = function (event)
{
    doLockPointer = false;
    onMouseUp();
};

const ontouchmove = function (event)
{
    doLockPointer = false;
    if (event.touches && event.touches.length > 0) onmousemove(event.touches[0]);
};

active.onChange = function ()
{
    if (active.get())bind();
    else unbind();
};

function setElement(ele)
{
    unbind();
    element = ele;
    bind();
}

function bind()
{
    element.addEventListener("pointermove", onmousemove);
    element.addEventListener("pointerdown", onMouseDown);
    element.addEventListener("pointerup", onMouseUp);
    element.addEventListener("pointerleave", onMouseUp);
    element.addEventListener("pointerenter", onMouseEnter);
    element.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    element.addEventListener("wheel", onMouseWheel, { "passive": true });

    // element.addEventListener("touchmove", ontouchmove, { "passive": true });
    // element.addEventListener("touchstart", ontouchstart, { "passive": true });
    // element.addEventListener("touchend", ontouchend, { "passive": true });
}

function unbind()
{
    if (!element) return;

    element.removeEventListener("pointermove", onmousemove);
    element.removeEventListener("pointerdown", onMouseDown);
    element.removeEventListener("pointerup", onMouseUp);
    element.removeEventListener("pointerleave", onMouseUp);
    element.removeEventListener("pointerenter", onMouseUp);
    element.removeEventListener("wheel", onMouseWheel);

    // element.removeEventListener("touchmove", ontouchmove);
    // element.removeEventListener("touchstart", ontouchstart);
    // element.removeEventListener("touchend", ontouchend);
}

eye = circlePos(0);
setElement(cgl.canvas);

bind();

initialX.set(0.25);
initialRadius.set(0.05);


};

Ops.Gl.Matrix.OrbitControls.prototype = new CABLES.Op();
CABLES.OPS["eaf4f7ce-08a3-4d1b-b9f4-ebc0b7b1cde1"]={f:Ops.Gl.Matrix.OrbitControls,objName:"Ops.Gl.Matrix.OrbitControls"};




// **************************************************************
// 
// Ops.Sequence
// 
// **************************************************************

Ops.Sequence = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const exe=op.inTrigger("exe");
const exes=[];
const triggers=[];
const num=16;
exe.onTriggered=triggerAll;

function triggerAll()
{
    for(var i=0;i<triggers.length;i++) triggers[i].trigger();
}

for(var i=0;i<num;i++)
{
    triggers.push( op.outTrigger("trigger "+i));

    if(i<num-1)
    {
        var newExe=op.inTrigger("exe "+i);
        newExe.onTriggered=triggerAll;
        exes.push( newExe );
    }
}

};

Ops.Sequence.prototype = new CABLES.Op();
CABLES.OPS["a466bc1f-06e9-4595-8849-bffb9fe22f99"]={f:Ops.Sequence,objName:"Ops.Sequence"};




// **************************************************************
// 
// Ops.Gl.Matrix.Transform
// 
// **************************************************************

Ops.Gl.Matrix.Transform = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render = op.inTrigger("render"),
    posX = op.inValue("posX", 0),
    posY = op.inValue("posY", 0),
    posZ = op.inValue("posZ", 0),
    scale = op.inValue("scale", 1),
    rotX = op.inValue("rotX", 0),
    rotY = op.inValue("rotY", 0),
    rotZ = op.inValue("rotZ", 0),
    trigger = op.outTrigger("trigger");

op.setPortGroup("Rotation", [rotX, rotY, rotZ]);
op.setPortGroup("Position", [posX, posY, posZ]);
op.setPortGroup("Scale", [scale]);
op.setUiAxisPorts(posX, posY, posZ);

const cgl = op.patch.cgl;
const vPos = vec3.create();
const vScale = vec3.create();
const transMatrix = mat4.create();
mat4.identity(transMatrix);

let
    doScale = false,
    doTranslate = false,
    translationChanged = true,
    scaleChanged = true,
    rotChanged = true;

rotX.onChange = rotY.onChange = rotZ.onChange = setRotChanged;
posX.onChange = posY.onChange = posZ.onChange = setTranslateChanged;
scale.onChange = setScaleChanged;

render.onTriggered = function ()
{
    // if(!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;

    let updateMatrix = false;
    if (translationChanged)
    {
        updateTranslation();
        updateMatrix = true;
    }
    if (scaleChanged)
    {
        updateScale();
        updateMatrix = true;
    }
    if (rotChanged) updateMatrix = true;

    if (updateMatrix) doUpdateMatrix();

    cgl.pushModelMatrix();
    mat4.multiply(cgl.mMatrix, cgl.mMatrix, transMatrix);

    trigger.trigger();
    cgl.popModelMatrix();

    if (CABLES.UI && CABLES.UI.showCanvasTransforms) gui.setTransform(op.id, posX.get(), posY.get(), posZ.get());

    if (op.isCurrentUiOp())
        gui.setTransformGizmo(
            {
                "posX": posX,
                "posY": posY,
                "posZ": posZ,
            });
};

op.transform3d = function ()
{
    return { "pos": [posX, posY, posZ] };
};

function doUpdateMatrix()
{
    mat4.identity(transMatrix);
    if (doTranslate)mat4.translate(transMatrix, transMatrix, vPos);

    if (rotX.get() !== 0)mat4.rotateX(transMatrix, transMatrix, rotX.get() * CGL.DEG2RAD);
    if (rotY.get() !== 0)mat4.rotateY(transMatrix, transMatrix, rotY.get() * CGL.DEG2RAD);
    if (rotZ.get() !== 0)mat4.rotateZ(transMatrix, transMatrix, rotZ.get() * CGL.DEG2RAD);

    if (doScale)mat4.scale(transMatrix, transMatrix, vScale);
    rotChanged = false;
}

function updateTranslation()
{
    doTranslate = false;
    if (posX.get() !== 0.0 || posY.get() !== 0.0 || posZ.get() !== 0.0) doTranslate = true;
    vec3.set(vPos, posX.get(), posY.get(), posZ.get());
    translationChanged = false;
}

function updateScale()
{
    // doScale=false;
    // if(scale.get()!==0.0)
    doScale = true;
    vec3.set(vScale, scale.get(), scale.get(), scale.get());
    scaleChanged = false;
}

function setTranslateChanged()
{
    translationChanged = true;
}

function setScaleChanged()
{
    scaleChanged = true;
}

function setRotChanged()
{
    rotChanged = true;
}

doUpdateMatrix();


};

Ops.Gl.Matrix.Transform.prototype = new CABLES.Op();
CABLES.OPS["650baeb1-db2d-4781-9af6-ab4e9d4277be"]={f:Ops.Gl.Matrix.Transform,objName:"Ops.Gl.Matrix.Transform"};




// **************************************************************
// 
// Ops.Gl.Meshes.Sphere_v2
// 
// **************************************************************

Ops.Gl.Meshes.Sphere_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    TAU = Math.PI * 2,
    cgl = op.patch.cgl,
    inTrigger = op.inTrigger("render"),
    inRadius = op.inValue("radius", 1),
    inStacks = op.inValue("stacks", 32),
    inSlices = op.inValue("slices", 32),
    inStacklimit = op.inValueSlider("Filloffset", 1),
    inDraw = op.inValueBool("Render", true),
    outTrigger = op.outTrigger("trigger"),
    outGeometry = op.outObject("geometry"),
    UP = vec3.fromValues(0, 1, 0),
    RIGHT = vec3.fromValues(1, 0, 0);
let
    geom = new CGL.Geometry("Sphere"),
    tmpNormal = vec3.create(),
    tmpVec = vec3.create(),
    needsRebuild = true,
    mesh;
function buildMesh()
{
    const
        stacks = Math.max(inStacks.get(), 2),
        slices = Math.max(inSlices.get(), 3),
        stackLimit = Math.min(Math.max(inStacklimit.get() * stacks, 1), stacks),
        radius = inRadius.get();
    let
        positions = [],
        texcoords = [],
        normals = [],
        tangents = [],
        biTangents = [],
        indices = [],
        x, y, z, d, t, a,
        o, u, v, i, j;
    for (i = o = 0; i < stacks + 1; i++)
    {
        v = (i / stacks - 0.5) * Math.PI;
        y = Math.sin(v);
        a = Math.cos(v);
        // for (j = 0; j < slices+1; j++) {
        for (j = slices; j >= 0; j--)
        {
            u = (j / slices) * TAU;
            x = Math.cos(u) * a;
            z = Math.sin(u) * a;

            positions.push(x * radius, y * radius, z * radius);
            // texcoords.push(i/(stacks+1),j/slices);
            texcoords.push(j / slices, i / (stacks + 1));

            d = Math.sqrt(x * x + y * y + z * z);
            normals.push(
                tmpNormal[0] = x / d,
                tmpNormal[1] = y / d,
                tmpNormal[2] = z / d
            );

            if (y == d) t = RIGHT;
            else t = UP;
            vec3.cross(tmpVec, tmpNormal, t);
            vec3.normalize(tmpVec, tmpVec);
            Array.prototype.push.apply(tangents, tmpVec);
            vec3.cross(tmpVec, tmpVec, tmpNormal);
            Array.prototype.push.apply(biTangents, tmpVec);
        }
        if (i == 0 || i > stackLimit) continue;
        for (j = 0; j < slices; j++, o++)
        {
            indices.push(
                o, o + 1, o + slices + 1,
                o + 1, o + slices + 2, o + slices + 1
            );
        }
        o++;
    }

    // set geometry
    geom.clear();
    geom.vertices = positions;
    geom.texCoords = texcoords;
    geom.vertexNormals = normals;
    geom.tangents = tangents;
    geom.biTangents = biTangents;
    geom.verticesIndices = indices;

    outGeometry.set(null);
    outGeometry.set(geom);

    if (!mesh) mesh = new CGL.Mesh(cgl, geom);
    else mesh.setGeom(geom);

    needsRebuild = false;
}

// set event handlers
inTrigger.onTriggered = function ()
{
    if (needsRebuild) buildMesh();
    if (inDraw.get()) mesh.render(cgl.getShader());
    outTrigger.trigger();
};

inStacks.onChange =
inSlices.onChange =
inStacklimit.onChange =
inRadius.onChange = function ()
{
    // only calculate once, even after multiple settings could were changed
    needsRebuild = true;
};

// set lifecycle handlers
op.onDelete = function () { if (mesh)mesh.dispose(); };


};

Ops.Gl.Meshes.Sphere_v2.prototype = new CABLES.Op();
CABLES.OPS["450b4d68-2278-4d9f-9849-0abdfa37ef69"]={f:Ops.Gl.Meshes.Sphere_v2,objName:"Ops.Gl.Meshes.Sphere_v2"};




// **************************************************************
// 
// Ops.Anim.Timer_v2
// 
// **************************************************************

Ops.Anim.Timer_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inSpeed = op.inValue("Speed", 1),
    playPause = op.inValueBool("Play", true),
    reset = op.inTriggerButton("Reset"),
    inSyncTimeline = op.inValueBool("Sync to timeline", false),
    outTime = op.outValue("Time");

op.setPortGroup("Controls", [playPause, reset, inSpeed]);

const timer = new CABLES.Timer();
let lastTime = null;
let time = 0;
let syncTimeline = false;

playPause.onChange = setState;
setState();

function setState()
{
    if (playPause.get())
    {
        timer.play();
        op.patch.addOnAnimFrame(op);
    }
    else
    {
        timer.pause();
        op.patch.removeOnAnimFrame(op);
    }
}

reset.onTriggered = doReset;

function doReset()
{
    time = 0;
    lastTime = null;
    timer.setTime(0);
    outTime.set(0);
}

inSyncTimeline.onChange = function ()
{
    syncTimeline = inSyncTimeline.get();
    playPause.setUiAttribs({ "greyout": syncTimeline });
    reset.setUiAttribs({ "greyout": syncTimeline });
};

op.onAnimFrame = function (tt)
{
    if (timer.isPlaying())
    {
        if (CABLES.overwriteTime !== undefined)
        {
            console.log("overwritten time!", CABLES.overwriteTime);
            outTime.set(CABLES.overwriteTime * inSpeed.get());
        }
        else

        if (syncTimeline)
        {
            outTime.set(tt * inSpeed.get());
        }
        else
        {
            timer.update();
            const timerVal = timer.get();

            if (lastTime === null)
            {
                lastTime = timerVal;
                return;
            }

            const t = Math.abs(timerVal - lastTime);
            lastTime = timerVal;

            time += t * inSpeed.get();
            if (time != time)time = 0;
            outTime.set(time);
        }
    }
};


};

Ops.Anim.Timer_v2.prototype = new CABLES.Op();
CABLES.OPS["aac7f721-208f-411a-adb3-79adae2e471a"]={f:Ops.Anim.Timer_v2,objName:"Ops.Anim.Timer_v2"};




// **************************************************************
// 
// Ops.Math.Sine
// 
// **************************************************************

Ops.Math.Sine = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// input
var value = op.inValue('value');

var phase = op.inValue('phase', 0.0);
var mul = op.inValue('frequency', 1.0);
var amplitude = op.inValue('amplitude', 1.0);
var invert = op.inValueBool("asine", false);

// output
var result = op.outValue('result');

var calculate = Math.sin;

phase.onChange =
value.onChange = function()
{
    result.set(
        amplitude.get() * calculate( ( value.get()*mul.get() ) + phase.get() )
    );
};

invert.onChange = function()
{
    if(invert.get()) calculate = Math.asin;
    else calculate = Math.sin;
}


};

Ops.Math.Sine.prototype = new CABLES.Op();
CABLES.OPS["d24da018-9f3d-428b-85c9-6ff14d77548b"]={f:Ops.Math.Sine,objName:"Ops.Math.Sine"};




// **************************************************************
// 
// Ops.Gl.GLTF.GltfScene_v2
// 
// **************************************************************

Ops.Gl.GLTF.GltfScene_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const gltfCamera = class
{
    constructor(gltf, config)
    {
        this.name = config.name || "unknown";
        this.config = config;
        this.node = gltf.getNode(this.name);

        if (!this.node)
        {
            // console.log("gltf camera - no node!!");
            return;
        }
        // this.nodeOrient=gltf.getNode(this.name+"_Orientation");

        this.pos = vec3.create();
        this.quat = quat.create();
        this.quatOr = quat.create();
        this.vCenter = vec3.create();
        this.vUp = vec3.create();
        this.transMatrix = mat4.create();

        vec3.set(this.pos,
            this.node._node.translation[0],
            this.node._node.translation[1],
            this.node._node.translation[2]);

        quat.set(this.quat,
            this.node._node.rotation[0],
            this.node._node.rotation[1],
            this.node._node.rotation[2],
            this.node._node.rotation[3]);

        // vec3.set(this.quatOr,
        //     this.nodeOrient._node.rotation[0],
        //     this.nodeOrient._node.rotation[1],
        //     this.nodeOrient._node.rotation[2],
        //     this.nodeOrient._node.rotation[3]);

        // quat.set(quat1,x1.get(),y1.get(),z1.get(),w1.get());
        // quat.set(quat2,x2.get(),y2.get(),z2.get(),w2.get());
        // quat.multiply(this.quat,this.quat,this.quatOr);

        // console.log("this.node._node.rotation",this.quat);
    }

    updateAnim(time)
    {
        if (this.node._animTrans)
        {

            vec3.set(this.pos,
                this.node._animTrans[0].getValue(time),
                this.node._animTrans[1].getValue(time),
                this.node._animTrans[2].getValue(time));

            quat.set(this.quat,
                this.node._animRot[0].getValue(time),
                this.node._animRot[1].getValue(time),
                this.node._animRot[2].getValue(time),
                this.node._animRot[3].getValue(time));
        }
    }

    start(time)
    {
        if (cgl.frameStore.shadowPass) return;

        this.updateAnim(time);
        const asp = cgl.getViewPort()[2] / cgl.getViewPort()[3];

        cgl.pushPMatrix();
        mat4.perspective(
            cgl.pMatrix,
            this.config.perspective.yfov,
            asp,
            this.config.perspective.znear,
            this.config.perspective.zfar);

        cgl.pushViewMatrix();
        // mat4.identity(cgl.vMatrix);

        vec3.set(this.vUp, 0, 1, 0);
        vec3.set(this.vCenter, 0, -1, 0);
        vec3.transformQuat(this.vCenter, this.vCenter, this.quat);
        vec3.normalize(this.vCenter, this.vCenter);
        vec3.add(this.vCenter, this.vCenter, this.pos);

        mat4.lookAt(cgl.vMatrix, this.pos, this.vCenter, this.vUp);
        // mat4.multiply(cgl.vMatrix,cgl.vMatrix,this.transMatrix);
    }

    end()
    {
        if (cgl.frameStore.shadowPass) return;
        cgl.popPMatrix();
        cgl.popViewMatrix();
    }
};


// cgl.pushViewMatrix();

// quat.set(vQuat,quatX.get(),quatY.get(),quatZ.get(),quatW.get());

// vec3.set(vUp, vecUpX.get(),vecUpY.get(),vecUpZ.get());
// vec3.set(vEye, eyeX.get(),eyeY.get(),eyeZ.get());

// vec3.set(vCenter,0,-1,0);
// vec3.transformQuat(vCenter, vCenter, vQuat);
// vec3.normalize(vCenter,vCenter);
// vec3.add(vCenter,vCenter,vEye);

// mat4.lookAt(transMatrix, vEye, vCenter, vUp);

// mat4.multiply(cgl.vMatrix,cgl.vMatrix,transMatrix);

const CHUNK_HEADER_SIZE = 8;

const Gltf = class
{
    constructor()
    {
        this.json = {};
        this.accBuffers = [];
        this.meshes = [];
        this.nodes = [];
        this.shaders = [];
        this.timing = [];
        this.cams = [];
        this.startTime = performance.now();
        this.bounds = new CGL.BoundingBox();
        this.loaded = Date.now();
    }

    getNode(n)
    {
        for (let i = 0; i < this.nodes.length; i++)
        {
            if (this.nodes[i].name == n) return this.nodes[i];
        }
    }

    unHideAll()
    {
        for (let i = 0; i < this.nodes.length; i++)
        {
            this.nodes[i].unHide();
        }
    }
};

function Utf8ArrayToStr(array)
{
    if (window.TextDecoder) return new TextDecoder("utf-8").decode(array);

    let out, i, len, c;
    let char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while (i < len)
    {
        c = array[i++];
        switch (c >> 4)
        {
        case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
            // 0xxxxxxx
            out += String.fromCharCode(c);
            break;
        case 12: case 13:
            // 110x xxxx   10xx xxxx
            char2 = array[i++];
            out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
            break;
        case 14:
            // 1110 xxxx  10xx xxxx  10xx xxxx
            char2 = array[i++];
            char3 = array[i++];
            out += String.fromCharCode(((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
            break;
        }
    }

    return out;
}

function readChunk(dv, bArr, arrayBuffer, offset)
{
    const chunk = {};

    chunk.size = dv.getUint32(offset + 0, le);


    // chunk.type = new TextDecoder("utf-8").decode(bArr.subarray(offset+4, offset+4+4));
    chunk.type = Utf8ArrayToStr(bArr.subarray(offset + 4, offset + 4 + 4));

    if (chunk.type == "BIN\0")
    {
        // console.log(chunk.size,arrayBuffer.length,offset);
        // try
        // {
        chunk.dataView = new DataView(arrayBuffer, offset + 8, chunk.size);
        // }
        // catch(e)
        // {
        //     chunk.dataView = null;
        //     console.log(e);
        // }
    }
    else
    if (chunk.type == "JSON")
    {
        const json = Utf8ArrayToStr(bArr.subarray(offset + 8, offset + 8 + chunk.size));

        try
        {
            const obj = JSON.parse(json);
            chunk.data = obj;
            outGenerator.set(obj.asset.generator);
        }
        catch (e)
        {
        }
    }
    else
    {
    }

    return chunk;
}

function loadAnims(gltf)
{
    let k = 0;
    for (let i = 0; i < gltf.json.animations.length; i++)
    {
        const an = gltf.json.animations[i];

        for (let ia = 0; ia < an.channels.length; ia++)
        {
            const chan = an.channels[ia];

            const node = gltf.nodes[chan.target.node];
            const sampler = an.samplers[chan.sampler];

            const acc = gltf.json.accessors[sampler.input];
            const bufferIn = gltf.accBuffers[sampler.input];

            const accOut = gltf.json.accessors[sampler.output];
            const bufferOut = gltf.accBuffers[sampler.output];

            let numComps = 1;
            if (accOut.type == "VEC2")numComps = 2;
            else if (accOut.type == "VEC3")numComps = 3;
            else if (accOut.type == "VEC4")numComps = 4;

            const anims = [];

            for (k = 0; k < numComps; k++) anims.push(new CABLES.TL.Anim());

            if (sampler.interpolation == "LINEAR") {}
            else if (sampler.interpolation == "STEP") for (k = 0; k < numComps; k++) anims[k].defaultEasing = CONSTANTS.ANIM.EASING_ABSOLUTE;
            else console.warn("[gltf] unknown interpolation", sampler.interpolation);

            for (let j = 0; j < bufferIn.length; j++)
            {
                maxTime = Math.max(bufferIn[j], maxTime);

                for (k = 0; k < numComps; k++)
                {
                    anims[k].setValue(bufferIn[j], bufferOut[j * numComps + k]);
                }
            }

            node.setAnim(chan.target.path, anims);
        }
    }
}

function loadCams(gltf)
{
    if (!gltf || !gltf.json.cameras) return;

    for (let i = 0; i < gltf.json.cameras.length; i++)
    {
        gltf.cams.push(new gltfCamera(gltf, gltf.json.cameras[i]));
    }
}

function parseGltf(arrayBuffer)
{
    let j = 0, i = 0;

    const gltf = new Gltf();

    if (!arrayBuffer) return;
    const byteArray = new Uint8Array(arrayBuffer);
    let pos = 0;

    // var string = new TextDecoder("utf-8").decode(byteArray.subarray(pos, 4));
    const string = Utf8ArrayToStr(byteArray.subarray(pos, 4));
    pos += 4;
    if (string != "glTF") return;

    gltf.timing.push("Start parsing", Math.round((performance.now() - gltf.startTime)));

    const dv = new DataView(arrayBuffer);
    const version = dv.getUint32(pos, le);
    pos += 4;
    const size = dv.getUint32(pos, le);
    pos += 4;

    outVersion.set(version);

    const chunks = [];
    gltf.chunks = chunks;

    chunks.push(readChunk(dv, byteArray, arrayBuffer, pos));
    pos += chunks[0].size + CHUNK_HEADER_SIZE;
    gltf.json = chunks[0].data;
    outJson.set(gltf.json);

    chunks.push(readChunk(dv, byteArray, arrayBuffer, pos));

    const views = chunks[0].data.bufferViews;
    const accessors = chunks[0].data.accessors;

    gltf.timing.push("Parse buffers", Math.round((performance.now() - gltf.startTime)));


    if (views)
    {
        for (i = 0; i < accessors.length; i++)
        {
            const acc = accessors[i];
            const view = views[acc.bufferView];

            let numComps = 0;
            if (acc.type == "SCALAR")numComps = 1;
            else if (acc.type == "VEC2")numComps = 2;
            else if (acc.type == "VEC3")numComps = 3;
            else if (acc.type == "VEC4")numComps = 4;
            else console.error("unknown accessor type", acc.type);

            const num = acc.count * numComps;
            let accPos = (view.byteOffset || 0) + (acc.byteOffset || 0);
            let stride = view.byteStride || 0;
            let dataBuff = null;


            // 5120 (BYTE)	1
            // 5121(UNSIGNED_BYTE)	1
            // 5122 (SHORT)	2

            if (chunks[1].dataView)
            {
                if (acc.componentType == 5126 || acc.componentType == 5125) // 4byte FLOAT or INT
                {
                    stride = stride || 4;
                    dataBuff = new Float32Array(num);

                    for (j = 0; j < num; j++)
                    {
                        dataBuff[j] = chunks[1].dataView.getFloat32(accPos, le);

                        if (stride != 4 && (j + 1) % numComps === 0)accPos += stride - (numComps * 4);
                        accPos += 4;
                    }
                }
                else if (acc.componentType == 5123) // UNSIGNED_SHORT
                {
                    stride = stride || 2;

                    dataBuff = new Uint16Array(num);

                    for (j = 0; j < num; j++)
                    {
                        dataBuff[j] = chunks[1].dataView.getUint16(accPos, le);

                        if (stride != 2 && (j + 1) % numComps === 0) accPos += stride - (numComps * 2);

                        accPos += 2;
                    }
                }
                else
                {
                    console.error("unknown component type", acc.componentType);
                }
            }

            gltf.accBuffers.push(dataBuff);
        }
    }

    gltf.timing.push("Parse mesh groups", Math.round((performance.now() - gltf.startTime)));

    gltf.json.meshes = gltf.json.meshes || [];

    if (gltf.json.meshes)
        for (i = 0; i < gltf.json.meshes.length; i++)
        {
            const mesh = new gltfMeshGroup(gltf, gltf.json.meshes[i]);
            gltf.meshes.push(mesh);
        }

    gltf.timing.push("Parse nodes", Math.round((performance.now() - gltf.startTime)));


    for (i = 0; i < gltf.json.nodes.length; i++)
    {
        const node = new gltfNode(gltf.json.nodes[i], gltf);
        gltf.nodes.push(node);
    }

    for (i = 0; i < gltf.nodes.length; i++)
    {
        const node = gltf.nodes[i];
        if (!node.isChild) node.calcBounds(gltf, null, gltf.bounds);
    }

    needsMatUpdate = true;

    gltf.timing.push("load anims", Math.round((performance.now() - gltf.startTime)));

    if (gltf.json.animations) loadAnims(gltf);

    gltf.timing.push("load cameras", Math.round((performance.now() - gltf.startTime)));

    if (gltf.json.cameras) loadCams(gltf);

    gltf.timing.push("finished", Math.round((performance.now() - gltf.startTime)));


    return gltf;
}

var gltfMesh=class
{
    constructor(name,prim,gltf)
    {
        this.test=0;
        this.name=name;
        this.material=prim.material;
        this.mesh=null;
        this.geom=new CGL.Geometry("gltf_"+this.name);
        this.geom.verticesIndices = [];

        if(prim.hasOwnProperty("indices")) this.geom.verticesIndices=gltf.accBuffers[prim.indices];

        this.fillGeomAttribs(gltf,this.geom,prim.attributes);

        if(prim.targets)
            for(var j=0;j<prim.targets.length;j++)
            {
                var tgeom=new CGL.Geometry("gltf_"+this.name);
                if(prim.hasOwnProperty("indices")) tgeom.verticesIndices=gltf.accBuffers[prim.indices];
                this.fillGeomAttribs(gltf,tgeom,prim.targets[j]);
                this.geom.morphTargets.push(tgeom);
            }

        this.morphGeom=this.geom.copy();
        this.bounds=this.geom.getBounds();
    }
    fillGeomAttribs(gltf,geom,attribs)
    {
        if(attribs.hasOwnProperty("POSITION"))geom.vertices=gltf.accBuffers[attribs.POSITION];
        if(attribs.hasOwnProperty("NORMAL"))geom.vertexNormals=gltf.accBuffers[attribs.NORMAL];
        if(attribs.hasOwnProperty("TEXCOORD_0"))geom.texCoords=gltf.accBuffers[attribs.TEXCOORD_0];
        if(attribs.hasOwnProperty("TANGENT"))geom.tangents=gltf.accBuffers[attribs.TANGENT];
        if(attribs.hasOwnProperty("COLOR_0"))geom.vertexColors=gltf.accBuffers[attribs.COLOR_0];

// Implementation note: When normals and tangents are specified,
// client implementations should compute the bitangent by taking
// the cross product of the normal and tangent xyz vectors and
// multiplying against the w component of the tangent:
// bitangent = cross(normal, tangent.xyz) * tangent.w

        if(inNormFormat.get()=="X-ZY")
        {
            for(let i=0;i<geom.vertexNormals.length;i+=3)
            {
                let t=geom.vertexNormals[i+2];
                geom.vertexNormals[i+2]=geom.vertexNormals[i+1];
                geom.vertexNormals[i+1]=-t;
            }

            // for(let i=0;i<geom.tangents.length;i+=3)
            // {
            //     let t=geom.tangents[i+2];
            //     geom.tangents[i+2]=geom.tangents[i+1];
            //     geom.tangents[i+1]=-t;

            // }
        }


        if(inVertFormat.get()=="XZ-Y")
        {
            for(let i=0;i<geom.vertices.length;i+=3)
            {
                let t=geom.vertices[i+2];
                geom.vertices[i+2]=-geom.vertices[i+1];
                geom.vertices[i+1]=t;
            }
        }

        if(!geom.vertexNormals.length || inCalcNormals.get()) geom.calculateNormals();

        geom.calcTangentsBitangents();
    }

    render(cgl,ignoreMaterial)
    {
        if(!this.geom)return;

        if(!this.mesh)
        {
            this.mesh=new CGL.Mesh(cgl,this.geom);
        }
        else
        {
            // update morphTargets
            if(this.geom.morphTargets.length)
            {
                this.test=time*11.7;

                if(this.test>=this.geom.morphTargets.length-1)this.test=0;

                const mt=this.geom.morphTargets[Math.floor(this.test)];
                const mt2=this.geom.morphTargets[Math.floor(this.test+1)];

                if(mt && mt.vertices)
                {
                    const fract=this.test%1;
                    for(var i=0;i<this.morphGeom.vertices.length;i++)
                    {
                        this.morphGeom.vertices[i]=
                            this.geom.vertices[i]+
                            (1.0-fract)*mt.vertices[i]+
                            fract*mt2.vertices[i];
                    }

                    this.mesh.updateVertices(this.morphGeom);
                }
            }


            const useMat=!ignoreMaterial && this.material!=-1 && gltf.shaders[this.material];

            // console.log(gltf.shaders);
            // console.log(this.material);

            if(useMat) cgl.pushShader(gltf.shaders[this.material]);

            this.mesh.render(cgl.getShader(),ignoreMaterial);

            if(useMat) cgl.popShader();

        }
    }

};var gltfMeshGroup=class
{
    constructor(gltf,m)
    {
        this.bounds=new CGL.BoundingBox();
        this.meshes=[];
        this.name=m.name;
        const prims=m.primitives;

        for(var i=0;i<prims.length;i++)
        {
            var mesh=new gltfMesh(this.name,prims[i],gltf);
            this.meshes.push(mesh);
            this.bounds.apply(mesh.bounds);
        }

        // console.log("mesh group bounds:",this.bounds._maxAxis);
    }

    render(cgl, ignoreMat)
    {
        for(var i=0;i<this.meshes.length;i++)
        {
            this.meshes[i].render(cgl,ignoreMat);
        }
    }
};

const gltfNode = class
{
    constructor(node, gltf)
    {
        this.isChild = node.isChild || false;
        this.name = node.name;
        this.hidden = false;
        this.mat = mat4.create();
        this._animMat = mat4.create();
        this._tempMat = mat4.create();
        this._tempQuat = quat.create();
        this._tempRotmat = mat4.create();
        this.mesh = null;
        this.children = [];
        this._node = node;
        this._gltf = gltf;
        this.absMat = mat4.create();

        this.updateMatrix();
    }

    updateMatrix()
    {
        mat4.identity(this.mat);
        if (this._node.translation) mat4.translate(this.mat, this.mat, this._node.translation);

        if (this._node.rotation)
        {
            const rotmat = mat4.create();
            this._rot = this._node.rotation;

            mat4.fromQuat(rotmat, this._node.rotation);
            mat4.mul(this.mat, this.mat, rotmat);
        }

        if (this._node.scale)
        {
            this._scale = this._node.scale;
            mat4.scale(this.mat, this.mat, this._scale);
        }

        if (this._node.hasOwnProperty("mesh"))
        {
            this.mesh = this._gltf.meshes[this._node.mesh];
        }

        if (this._node.children)
        {
            for (let i = 0; i < this._node.children.length; i++)
            {
                this._gltf.json.nodes[i].isChild = true;
                if (this._gltf.nodes[this._node.children[i]]) this._gltf.nodes[this._node.children[i]].isChild = true;
                this.children.push(this._node.children[i]);
            }
        }
    }

    unHide()
    {
        this.hidden = false;
        for (let i = 0; i < this.children.length; i++)
            if (this.children[i].unHide) this.children[i].unHide();
    }

    calcBounds(gltf, mat, bounds)
    {
        const localMat = mat4.create();
        if (mat)
        {
            mat4.copy(localMat, mat);
        }

        // mat=mat||mat4.create();

        if (this.mat)
            mat4.mul(localMat, localMat, this.mat);

        if (this.mesh)
        {
            const bb = this.mesh.bounds.copy();
            bb.mulMat4(localMat);
            bounds.apply(bb);

            boundingPoints.push(bb._min[0], bb._min[1], bb._min[2]);
            boundingPoints.push(bb._max[0], bb._max[1], bb._max[2]);
        }

        for (let i = 0; i < this.children.length; i++)
        {
            if (gltf.nodes[this.children[i]] && gltf.nodes[this.children[i]].calcBounds)
            {
                bounds.apply(gltf.nodes[this.children[i]].calcBounds(gltf, localMat, bounds));
            }
        }

        if (bounds.changed) return bounds;
        else return null;
    }

    setAnim(path, anims)
    {
        if (path == "translation") this._animTrans = anims;
        else if (path == "rotation") this._animRot = anims;
        else if (path == "scale") this._animScale = anims;
        else console.warn("unknown anim path", path, anims);
    }

    modelMatAbs()
    {
        return this.absMat;
        // if(!this._animTrans) return this.mat;
        // else return this._animMat;
    }

    transform(cgl, _time)
    {
        if (!_time)_time = time;

        if (!this._animTrans)
        {
            mat4.mul(cgl.mMatrix, cgl.mMatrix, this.mat);
        }
        else
        {
            mat4.identity(this._animMat);

            const playAnims = true;

            if (playAnims && this._animTrans)
            {
                mat4.translate(this._animMat, this._animMat, [
                    this._animTrans[0].getValue(time),
                    this._animTrans[1].getValue(time),
                    this._animTrans[2].getValue(time)]);
            }
            else
            if (this.translation) mat4.translate(this._animMat, this._animMat, this.translation);

            if (playAnims && this._animRot)
            {
                CABLES.TL.Anim.slerpQuaternion(time, this._tempQuat, this._animRot[0], this._animRot[1], this._animRot[2], this._animRot[3]);

                mat4.fromQuat(this._tempMat, this._tempQuat);
                mat4.mul(this._animMat, this._animMat, this._tempMat);
            }
            else if (this._rot)
            {
                mat4.fromQuat(this._tempRotmat, this._rot);
                mat4.mul(this._animMat, this._animMat, this._tempRotmat);
            }

            if (playAnims && this._animScale)
            {
                mat4.scale(this._animMat, this._animMat, [
                    this._animScale[0].getValue(time),
                    this._animScale[1].getValue(time),
                    this._animScale[2].getValue(time)]);
            }
            else if (this._scale) mat4.scale(this._animMat, this._animMat, this._scale);

            mat4.mul(cgl.mMatrix, cgl.mMatrix, this._animMat);
        }
        mat4.copy(this.absMat, cgl.mMatrix);
    }

    render(cgl, dontTransform, dontDrawMesh, ignoreMaterial, ignoreChilds, drawHidden, _time)
    {
        // dontTransform,drawMesh,ignoreMaterial,


        if (!dontTransform) cgl.pushModelMatrix();
        if (!dontTransform) this.transform(cgl, _time || time);

        if (this.hidden && !drawHidden)
        {

        }
        else
        {
            if (this.mesh && !dontDrawMesh) this.mesh.render(cgl, ignoreMaterial);
        }

        if (!ignoreChilds)
            for (let i = 0; i < this.children.length; i++)
                if (gltf.nodes[this.children[i]])
                    gltf.nodes[this.children[i]].render(cgl, dontTransform, dontDrawMesh, ignoreMaterial, ignoreChilds, drawHidden, _time);

        if (!dontTransform)cgl.popModelMatrix();
    }
};
var tab=null;

function closeTab()
{
    if(tab)gui.mainTabs.closeTab(tab.id);
}

function printNode(html,node,level)
{
    if(!gltf)return;

    html+='<tr class="row">';
    var i=0;
    var ident="";

    for(i=0;i<level;i++)
    {
        // var last=level-1==i;
        // var identClass=last?"identnormal":"identlast";

        var identClass="identBg";
        if(i==0)identClass="identBgLevel0";
        // if(i==level-1)identClass="identBgLast";
        ident+='<td class="ident  '+identClass+'" ><div style=""></div></td>';
    }
    var id=CABLES.uuid();
    html+=ident;
    html+='<td colspan="'+(20-level)+'">';

    if(node.mesh && node.mesh.meshes.length)html+='<span class="icon icon-cube"></span>&nbsp;';
    else html+='<span class="icon icon-circle"></span> &nbsp;';

    html+=node.name;
    html+='</td>';
    html+='<td>';
    html+='</td>';

    // html+='<td>';

    if(node.mesh)
    {
        html+='<td>';
        for(i=0;i<node.mesh.meshes.length;i++)
        {
            html+=node.mesh.meshes[i].name;
            // html+=' ('+node.mesh.meshes[i].geom.vertices.length/3+' verts) ';
        }
        html+='</td>';
        html+='<td>';
        for(i=0;i<node.mesh.meshes.length;i++)
        {
            if(node.mesh.meshes[i].material)
                html+=gltf.json.materials[node.mesh.meshes[i].material].name;
        }
        html+='</td>';

    }
    else
    {
        html+='<td>-</td><td>-</td>';
    }
    html+='<td>';
    if(node._animRot || node._animScale || node._animTrans) html+='Yes';
    else html+='-';

    html+='</td>';
    html+='<td>';
    var hideclass='';
    if(node.hidden)hideclass='node-hidden';

    html+='Expose: ';
    html+='<a onclick="gui.corePatch().getOpById(\''+op.id+'\').exposeNode(\''+node.name+'\',true)" class="treebutton">Hierarchy</a>';
    html+=' <a onclick="gui.corePatch().getOpById(\''+op.id+'\').exposeNode(\''+node.name+'\')" class="treebutton">Node</a>';
    html+='&nbsp;';

    html+='<span class="icon iconhover icon-eye '+hideclass+'" onclick="gui.corePatch().getOpById(\''+op.id+'\').toggleNodeVisibility(\''+node.name+'\');this.classList.toggle(\'node-hidden\');"></span>';
    html+='</td>';

    html+="</tr>";

    if(node.children)
        for(i=0;i<node.children.length;i++)
            html=printNode(html,gltf.nodes[node.children[i]],level+1);

    return html;
}

function printMaterial(mat,idx)
{
    var html='<tr>';
    html+=' <td>'+idx+'</td>';
    html+=' <td>'+mat.name+'</td>';
    // html+=' <td><a onclick="" class="treebutton">Assign</a><td>';



    html+=' <td>';
    if(mat.pbrMetallicRoughness && mat.pbrMetallicRoughness.baseColorFactor)
    {
        var rgb='';
        rgb+=''+Math.round(mat.pbrMetallicRoughness.baseColorFactor[0]*255);
        rgb+=','+Math.round(mat.pbrMetallicRoughness.baseColorFactor[1]*255);
        rgb+=','+Math.round(mat.pbrMetallicRoughness.baseColorFactor[2]*255);

        html+='<div style="width:15px;height:15px;;background-color:rgb('+rgb+')">&nbsp;</a>';

        // html+='<td>';
    }
    html+=' <td style="">'+(gltf.shaders[idx]?"-":'<a onclick="gui.corePatch().getOpById(\''+op.id+'\').assignMaterial(\''+mat.name+'\')" class="treebutton">Assign</a>')+'<td>';
    html+='<td>';



    // console.log();


    html+='</tr>';
    return html;
}

function printInfo()
{
    if(!gltf)return;

    console.log(gltf);

    const sizes={};

    var html='<div style="overflow:scroll;width:100%;height:100%">';


    html+='generator:'+gltf.json.asset.generator;


    if(!gltf.json.materials || gltf.json.materials.length==0)
    {
        html+='<h3>Materials</h3>';
        html+="No materials";
    }
    else
    {
        html+='<h3>Materials ('+gltf.json.materials.length+')</h3>';
        html+='<table class="table treetable">';
        html+='<tr>';
        html+=' <th>Index</th>';
        html+=' <th>Name</th>';
        html+=' <th>Color</th>';
        html+=' <th>Function</th>';
        html+=' <th></th>';
        html+='</tr>';
        for(var i=0;i<gltf.json.materials.length;i++)
        {
            html+=printMaterial(gltf.json.materials[i],i);
        }
        html+='</table>';
    }

    html+='<h3>Nodes ('+gltf.nodes.length+')</h3>';
    html+='<table class="table treetable">';

    html+='<tr>';
    html+=' <th colspan="21">Name</th>';
    html+=' <th>Mesh</th>';
    html+=' <th>Material</th>';
    html+=' <th>Anim</th>';
    html+=' <th>Show</th>';
    html+='</tr>';

    for(var i=0;i<gltf.nodes.length;i++)
    {
        if(!gltf.nodes[i].isChild)
            html=printNode(html,gltf.nodes[i],1);
    }
    html+='</table>';

    html+='<h3>Meshes ('+gltf.json.meshes.length+')</h3>';

    html+='<table class="table treetable">';
    html+='<tr>';
    html+=' <th>Name</th>';
    html+=' <th>Material</th>';
    html+=' <th>Vertices</th>';
    html+=' <th>Attributes</th>';
    html+='</tr>';


    var sizeBufferViews=[];
    sizes.meshes=0;

    for(var i=0;i<gltf.json.meshes.length;i++)
    {
        html+='<tr>';
        html+='<td>'+gltf.json.meshes[i].name+"</td>";

        html+='<td>';
        for(var j=0;j<gltf.json.meshes[i].primitives.length;j++)
        {
            if(gltf.json.meshes[i].primitives[j].material)
                html+=gltf.json.materials[gltf.json.meshes[i].primitives[j].material].name;
                else html+='None';
        }
        html+='</td>';

        html+='<td>';
        for(var j=0;j<gltf.json.meshes[i].primitives.length;j++)
        {
            // html+=gltf.json.meshes[i].primitives[j].indices;
            if(gltf.json.meshes[i].primitives[j].attributes.POSITION)
            {
                html+=gltf.json.accessors[gltf.json.meshes[i].primitives[j].attributes.POSITION].count;

            }
        }
        html+='</td>';

        html+='<td>';
        for(var j=0;j<gltf.json.meshes[i].primitives.length;j++)
            html+=Object.keys(gltf.json.meshes[i].primitives[j].attributes);
        html+='</td>';

        html+='</tr>';


        for(var j=0;j<gltf.json.meshes[i].primitives.length;j++)
        {
            var bufView=gltf.json.accessors[gltf.json.meshes[i].primitives[j].indices].bufferView;

            if(sizeBufferViews.indexOf(bufView)==-1)
            {
                sizeBufferViews.push(bufView);
                sizes.meshes+=gltf.json.bufferViews[bufView].byteLength;
            }


            for(var k in gltf.json.meshes[i].primitives[j].attributes)
            {
                const attr=gltf.json.meshes[i].primitives[j].attributes[k];
                const bufView=gltf.json.accessors[attr].bufferView;

                if(sizeBufferViews.indexOf(bufView)==-1)
                {
                    sizeBufferViews.push(bufView);
                    sizes.meshes+=gltf.json.bufferViews[bufView].byteLength;
                }


            }

        }


    }
    html+='</table>';



    if(gltf.json.animations)
    {
        html+='<h3>Animations ('+gltf.json.animations.length+')</h3>';
        html+='<table class="table treetable">';
        html+='<tr>';
        html+='  <th>Name</th>';
        html+='  <th>Target node</th>';
        html+='  <th>Path</th>';
        html+='  <th>Interpolation</th>';
        html+='  <th>Keys</th>';
        html+='</tr>';

        sizes.animations=0;

        for(var i=0;i<gltf.json.animations.length;i++)
        {
            for(var j=0;j< gltf.json.animations[i].samplers.length;j++)
            {
                var bufView=gltf.json.accessors[gltf.json.animations[i].samplers[j].input].bufferView;
                if(sizeBufferViews.indexOf(bufView)==-1)
                {
                    sizeBufferViews.push(bufView);
                    sizes.animations+=gltf.json.bufferViews[bufView].byteLength;
                }

                var bufView=gltf.json.accessors[gltf.json.animations[i].samplers[j].output].bufferView;
                if(sizeBufferViews.indexOf(bufView)==-1)
                {
                    sizeBufferViews.push(bufView);
                    sizes.animations+=gltf.json.bufferViews[bufView].byteLength;
                }

            }




            for(var j=0;j< gltf.json.animations[i].channels.length;j++)
            {
                html+='<tr>';
                html+='  <td>'+gltf.json.animations[i].name+' ('+i+')</td>';

                html+='  <td>'+gltf.nodes[gltf.json.animations[i].channels[j].target.node].name+'</td>';
                html+='  <td>';
                html+=gltf.json.animations[i].channels[j].target.path+' ';
                html+='  </td>';

                const smplidx=gltf.json.animations[i].channels[j].sampler;
                const smplr=gltf.json.animations[i].samplers[smplidx];

                html+='  <td>'+smplr.interpolation+'</td>'


                html+='  <td>'+gltf.json.accessors[smplr.output].count;+'</td>'



                html+='</tr>';

            }
        }
        html+='</table>';

    }
    else
    {
        html+='<h3>Animations (0)</h3>';
    }

    if(gltf.json.images)
    {
        html+='<h3>Images ('+gltf.json.images.length+')</h3>';
        html+='<table class="table treetable">';

        html+='<tr>';
        html+='  <th>name</th>';
        html+='  <th>type</th>';
        html+='  <th>func</th>';

        html+='</tr>';

        sizes.images=0;

        for(var i=0;i<gltf.json.images.length;i++)
        {
            if(gltf.json.images[i].bufferView)
                sizes.images+=gltf.json.bufferViews[gltf.json.images[i].bufferView].byteLength;

            html+='<tr>';
            html+='<td>'+gltf.json.images[i].name+'</td>';
            html+='<td>'+gltf.json.images[i].mimeType+'</td>';
            html+='<td>';
            html+='<a onclick="gui.corePatch().getOpById(\''+op.id+'\').exposeTexture(\''+gltf.json.images[i].name+'\')" class="treebutton">Expose</a>';
            html+='</td>';

            html+='<tr>';
        }
        html+='</table>';
    }


    if(gltf.json.cameras)
    {
        html+='<h3>Cameras ('+gltf.json.cameras.length+')</h3>';
        html+='<table class="table treetable">';

        html+='<tr>';
        html+='  <th>name</th>';
        html+='  <th>type</th>';
        html+='  <th>info</th>';
        html+='</tr>';

        for(var i=0;i<gltf.json.cameras.length;i++)
        {
            html+='<tr>';
            html+='<td>'+gltf.json.cameras[i].name+'</td>';
            html+='<td>'+gltf.json.cameras[i].type+'</td>';
            html+='<td>';
            html+='yfov: '+Math.round(gltf.json.cameras[i].perspective.yfov*100)/100;
            html+=", ";
            html+='zfar: '+Math.round(gltf.json.cameras[i].perspective.zfar*100)/100;
            html+=", ";
            html+='znear: '+Math.round(gltf.json.cameras[i].perspective.znear*100)/100;
            html+='</td>';

            html+='<tr>';
        }
        html+='</table>';
    }



    // html+='data size: '+;
    const sizeBin=gltf.json.buffers[0].byteLength;
    html+='<h3>Binary Data ('+readableSize(sizeBin)+')</h3>';


    html+='<table class="table treetable">';
    html+='<tr>';
    html+='  <th>name</th>';
    html+='  <th>size</th>';
    html+='  <th>%</th>';
    html+='</tr>';
    var sizeUnknown=sizeBin;
    for(var i in sizes)
    {
        // html+=i+':'+Math.round(sizes[i]/1024);
        html+='<tr>';
        html+='<td>'+i+'</td>';
        html+='<td>'+readableSize(sizes[i])+' </td>';
        html+='<td>'+Math.round(sizes[i]/sizeBin*100)+'% </td>';
        html+='<tr>';
        sizeUnknown-=sizes[i];
    }

    if(sizeUnknown!=0)
    {
        html+='<tr>';
        html+='<td>unknown</td>';
        html+='<td>'+readableSize(sizeUnknown)+' </td>';
        html+='<td>'+Math.round(sizeUnknown/sizeBin*100)+'% </td>';
        html+='<tr>';
    }

    html+='</table>';
    html+='</div>';

    // CABLES.UI.MODAL.show(html);

    // closeTab();
    tab=new CABLES.UI.Tab("GLTF",{"icon":"cube","infotext":"tab_gltf","padding":true,"singleton":true});
    gui.mainTabs.addTab(tab,true);
    tab.html(html);

    console.log(gltf);
}

function readableSize(n)
{
    if(n>1024)return Math.round(n/1024)+' kb';
    if(n>1024*500)return Math.round(n/1024)+' mb';
    else return n+' bytes';

}


// https://raw.githubusercontent.com/KhronosGroup/glTF/master/specification/2.0/figures/gltfOverview-2.0.0b.png

const
    dataPort = op.inString("data"),
    inExec = op.inTrigger("Render"),
    inFile = op.inUrl("glb File", [".glb"]),
    inRender = op.inBool("Draw", true),
    inCamera = op.inDropDown("Camera", ["Ncaone"], "None"),
    inShow = op.inTriggerButton("Show Structure"),
    inCenter = op.inSwitch("Center", ["None", "XYZ", "XZ"], "XYZ"),
    inRescale = op.inBool("Rescale", true),
    inRescaleSize = op.inFloat("Rescale Size", 2.5),

    inTime = op.inFloat("Time"),
    inTimeLine = op.inBool("Sync to timeline", false),
    inLoop = op.inBool("Loop", true),

    inNormFormat = op.inSwitch("Normals Format", ["XYZ", "X-ZY"], "XYZ"),
    inVertFormat = op.inSwitch("Vertices Format", ["XYZ", "XZ-Y"], "XYZ"),
    inCalcNormals = op.inBool("Calc Normals", false),

    inMaterials = op.inObject("Materials"),
    inHideNodes = op.inArray("Hide Nodes"),

    nextBefore = op.outTrigger("Render Before"),
    next = op.outTrigger("Next"),
    outGenerator = op.outString("Generator"),
    outVersion = op.outNumber("GLTF Version"),
    outAnimLength = op.outNumber("Anim Length", 0),
    outAnimTime = op.outNumber("Anim Time", 0),
    outJson = op.outObject("Json"),
    outPoints = op.outArray("BoundingPoints"),
    outBounds = op.outObject("Bounds"),
    outAnimFinished = op.outTrigger("Finished"),
    outLoaded = op.outBool("Loaded");

op.setPortGroup("Timing", [inTime, inTimeLine, inLoop]);

const le = true; // little endian
const cgl = op.patch.cgl;
inFile.onChange =
    inVertFormat.onChange =
    inCalcNormals.onChange =
    inNormFormat.onChange = reloadSoon;

let cam = null;
let boundingPoints = [];
let gltf = null;
let maxTime = 0;
let time = 0;
let needsMatUpdate = true;
let timedLoader = null;
let loadingId = null;
let data = null;
const scale = vec3.create();
let lastTime = 0;
let doCenter = false;

const boundsCenter = vec3.create();

inShow.onTriggered = printInfo;
dataPort.setUiAttribs({ "hideParam": true, "hidePort": true });
dataPort.onChange = loadData;
inHideNodes.onChange = hideNodesFromData;

op.setPortGroup("Transform", [inRescale, inRescaleSize, inCenter]);

inCenter.onChange = updateCenter;

function updateCamera()
{
    const arr = ["None"];
    if (gltf && gltf.json.cameras)
    {
        for (let i = 0; i < gltf.json.cameras.length; i++)
        {
            arr.push(gltf.json.cameras[i].name);
        }
    }
    inCamera.uiAttribs.values = arr;
}

function updateCenter()
{
    doCenter = inCenter.get() != "None";

    if (gltf && gltf.bounds)
    {
        boundsCenter.set(gltf.bounds.center);
        boundsCenter[0] = -boundsCenter[0];
        boundsCenter[1] = -boundsCenter[1];
        boundsCenter[2] = -boundsCenter[2];
        if (inCenter.get() == "XZ") boundsCenter[1] = -gltf.bounds.minY;
    }
}

inRescale.onChange = function ()
{
    inRescaleSize.setUiAttribs({ "greyout": !inRescale.get() });
};

inMaterials.onChange = function ()
{
    needsMatUpdate = true;
};

op.onDelete = function ()
{
    closeTab();
};

inTimeLine.onChange = function ()
{
    inTime.setUiAttribs({ "greyout": inTimeLine.get() });
};

inCamera.onChange = setCam;

function setCam()
{
    cam = null;
    if (!gltf) return;

    for (let i = 0; i < gltf.cams.length; i++)
    {
        if (gltf.cams[i].name == inCamera.get())cam = gltf.cams[i];
    }
}

inExec.onTriggered = function ()
{
    if (inTimeLine.get()) time = op.patch.timer.getTime();
    else time = Math.max(0, inTime.get());

    if (inLoop.get())
    {
        time %= maxTime;
        if (time < lastTime)outAnimFinished.trigger();
    }
    else
    {
        if (maxTime > 0 && time >= maxTime)outAnimFinished.trigger();
    }
    lastTime = time;

    cgl.pushModelMatrix();

    outAnimTime.set(time || 0);

    if (gltf && gltf.bounds)
    {
        if (inRescale.get())
        {
            const sc = inRescaleSize.get() / gltf.bounds.maxAxis;
            gltf.scale = sc;
            vec3.set(scale, sc, sc, sc);
            mat4.scale(cgl.mMatrix, cgl.mMatrix, scale);
        }
        if (doCenter)
        {
            mat4.translate(cgl.mMatrix, cgl.mMatrix, boundsCenter);
        }
    }

    cgl.frameStore.currentScene = gltf;
    nextBefore.trigger();

    if (needsMatUpdate) updateMaterials();

    if (cam) cam.start(time);

    if (gltf && inRender.get())
    {
        gltf.time = time;

        if (gltf.bounds && cgl.shouldDrawHelpers(op))
        {
            if (CABLES.UI.renderHelper)cgl.pushShader(CABLES.GL_MARKER.getDefaultShader(cgl));
            else cgl.pushShader(CABLES.GL_MARKER.getSelectedShader(cgl));
            gltf.bounds.render(cgl);
            cgl.popShader();
        }

        for (let i = 0; i < gltf.nodes.length; i++)
            if (!gltf.nodes[i].isChild) gltf.nodes[i].render(cgl);
    }

    next.trigger();
    cgl.frameStore.currentScene = null;

    cgl.popModelMatrix();

    if (cam)cam.end();
};

function loadBin(addCacheBuster)
{
    if (!loadingId)loadingId = cgl.patch.loading.start("gltf" + inFile.get(), inFile.get());

    let url = op.patch.getFilePath(String(inFile.get()));
    if (addCacheBuster)url += "?rnd=" + CABLES.generateUUID();

    outLoaded.set(false);
    const oReq = new XMLHttpRequest();
    oReq.open("GET", url, true);
    oReq.responseType = "arraybuffer";
    closeTab();

    cgl.patch.loading.addAssetLoadingTask(() =>
    {
        oReq.onload = function (oEvent)
        {
            boundingPoints = [];

            maxTime = 0;
            const arrayBuffer = oReq.response;
            gltf = parseGltf(arrayBuffer);
            cgl.patch.loading.finished(loadingId);
            loadingId = null;
            needsMatUpdate = true;
            op.refreshParams();
            outAnimLength.set(maxTime);
            hideNodesFromData();
            if (tab)printInfo();

            updateCamera();
            setCam();
            outPoints.set(boundingPoints);
            if (gltf)
            {
                gltf.loaded = Date.now();
                if (gltf.bounds)outBounds.set(gltf.bounds);
            }
            updateCenter();
            outLoaded.set(true);
            // op.log("finished loading gltf");
        };

        oReq.send(null);
    });
}

op.onFileChanged = function (fn)
{
    if (fn && fn.length > 3 && inFile.get() && inFile.get().indexOf(fn) > -1) reloadSoon(true);
};

op.onFileChanged = function (fn)
{
    if (inFile.get() && inFile.get().indexOf(fn) > -1)
    {
        reloadSoon(true);
    }
};

function reloadSoon(nocache)
{
    clearTimeout(timedLoader);
    timedLoader = setTimeout(function () { loadBin(nocache); }, 30);
}

function updateMaterials()
{
    if (!gltf) return;

    gltf.shaders = {};

    for (let j = 0; j < inMaterials.links.length; j++)
    {
        const op = inMaterials.links[j].portOut.parent;
        const portShader = op.getPort("Shader");
        const portName = op.getPort("Material Name");

        if (portShader && portName && portShader.get())
        {
            const name = portName.get();
            if (gltf.json.materials)
                for (let i = 0; i < gltf.json.materials.length; i++)
                    if (gltf.json.materials[i].name == name)
                    {
                        if (gltf.shaders[i])
                        {
                            op.warn("double material assignment:", name);
                        }
                        gltf.shaders[i] = portShader.get();
                    }
        }
    }
    needsMatUpdate = false;
    if (tab)printInfo();
}

function hideNodesFromArray()
{
    const hideArr = inHideNodes.get();

    if (!gltf || !data || !data.hiddenNodes) return;
    if (!hideArr)
    {
        return;
    }

    for (let i = 0; i < hideArr.length; i++)
    {
        const n = gltf.getNode(hideArr[i]);
        if (n)n.hidden = true;
    }
}

function hideNodesFromData()
{
    if (!data)loadData();
    if (!gltf) return;

    gltf.unHideAll();

    if (data && data.hiddenNodes)
    {
        for (const i in data.hiddenNodes)
        {
            const n = gltf.getNode(i);
            if (n) n.hidden = true;
            else op.warn("node to be hidden not found", i, n);
        }
    }
    hideNodesFromArray();
}

function loadData()
{
    data = dataPort.get();

    if (!data || data === "")data = {};
    else data = JSON.parse(data);

    if (gltf)hideNodesFromData();

    return data;
}

function saveData()
{
    dataPort.set(JSON.stringify(data));
}

function findParents(nodes, childNodeIndex)
{
    for (let i = 0; i < gltf.nodes.length; i++)
    {
        if (gltf.nodes[i].children.indexOf(childNodeIndex) >= 0)
        {
            nodes.push(gltf.nodes[i]);
            if (gltf.nodes[i].isChild) findParents(nodes, i);
        }
    }
}

op.exposeTexture = function (name)
{
    const newop = gui.corePatch().addOp("Ops.Gl.GLTF.GltfTexture");
    newop.getPort("Name").set(name);
    op.patch.link(op, next.name, newop, "Render");
    gui.patch().focusOp(newop.id, true);
};

op.exposeNode = function (name, tree)
{
    if (tree)
    {
        for (let i = 0; i < gltf.nodes.length; i++)
        {
            if (gltf.nodes[i].name == name)
            {
                const node = gltf.nodes[i];
                const arrHierarchy = [];
                findParents(arrHierarchy, i);

                arrHierarchy.push(node, node);

                let prevPort = next.name;
                let prevOp = op;
                for (let j = 0; j < arrHierarchy.length; j++)
                {
                    const newop = gui.corePatch().addOp("Ops.Gl.GLTF.GltfNode_v2");
                    newop.getPort("Node Name").set(arrHierarchy[j].name);
                    op.patch.link(prevOp, prevPort, newop, "Render");

                    if (j == arrHierarchy.length - 1)
                    {
                        newop.getPort("Transformation").set(false);
                    }
                    else
                    {
                        newop.getPort("Draw Mesh").set(false);
                        newop.getPort("Draw Childs").set(false);
                    }

                    prevPort = "Next";
                    prevOp = newop;
                }
            }
        }
    }
    else
    {
        const newop = gui.corePatch().addOp("Ops.Gl.GLTF.GltfNode_v2");
        newop.getPort("Node Name").set(name);
        op.patch.link(op, next.name, newop, "Render");
        gui.patch().focusOp(newop.id, true);
    }
    CABLES.UI.MODAL.hide();
};

op.assignMaterial = function (name)
{
    const newop = gui.corePatch().addOp("Ops.Gl.GLTF.GltfSetMaterial");
    newop.getPort("Material Name").set(name);
    op.patch.link(op, inMaterials.name, newop, "Material");
    gui.patch().focusOp(newop.id, true);
    CABLES.UI.MODAL.hide();
};

op.toggleNodeVisibility = function (name)
{
    const n = gltf.getNode(name);
    n.hidden = !n.hidden;
    data.hiddenNodes = data.hiddenNodes || {};

    if (n)
        if (n.hidden)data.hiddenNodes[name] = true;
        else delete data.hiddenNodes[name];

    saveData();
};


};

Ops.Gl.GLTF.GltfScene_v2.prototype = new CABLES.Op();
CABLES.OPS["daafedce-998a-4b34-8af3-6b62a66948ed"]={f:Ops.Gl.GLTF.GltfScene_v2,objName:"Ops.Gl.GLTF.GltfScene_v2"};




// **************************************************************
// 
// Ops.Gl.Meshes.LinesArray
// 
// **************************************************************

Ops.Gl.Meshes.LinesArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render=op.inTrigger('render'),
    width=op.inValueFloat("width",10),
    height=op.inValueFloat("height",1),
    doLog=op.inValueBool("Logarithmic",false),
    pivotX=op.inValueSelect("pivot x",["center","left","right"],"center"),
    pivotY=op.inValueSelect("pivot y",["center","top","bottom"],"center"),
    nColumns=op.inValueInt("num columns",10),
    nRows=op.inValueInt("num rows",10),
    axis=op.inValueSelect("axis",["xy","xz"],"xy"),
    trigger=op.outTrigger('trigger'),
    outPointArrays=op.outArray("Point Arrays");

const cgl=op.patch.cgl;
var meshes=[];

op.setPortGroup("Size",[width,height]);
op.setPortGroup("Alignment",[pivotX,pivotY]);

axis.onChange=
    pivotX.onChange=
    pivotY.onChange=
    width.onChange=
    height.onChange=
    nRows.onChange=
    nColumns.onChange=
    doLog.onChange=rebuildDelayed;

rebuild();

render.onTriggered=function()
{
    for(var i=0;i<meshes.length;i++) meshes[i].render(cgl.getShader());
    trigger.trigger();
};

var delayRebuild=0;
function rebuildDelayed()
{
    clearTimeout(delayRebuild);
    delayRebuild=setTimeout(rebuild,60);
}

function rebuild()
{
    var x=0;
    var y=0;

    if(pivotX.get()=='center') x=0;
    if(pivotX.get()=='right') x=-width.get()/2;
    if(pivotX.get()=='left') x=+width.get()/2;

    if(pivotY.get()=='center') y=0;
    if(pivotY.get()=='top') y=-height.get()/2;
    if(pivotY.get()=='bottom') y=+height.get()/2;

    var numRows=parseInt(nRows.get(),10);
    var numColumns=parseInt(nColumns.get(),10);

    var stepColumn=width.get()/numColumns;
    var stepRow=height.get()/numRows;

    var c,r;
    meshes.length=0;

    var vx,vy,vz;
    var verts=[];
    var tc=[];
    var indices=[];
    var count=0;

    function addMesh()
    {
        var geom=new CGL.Geometry();
        geom.vertices=verts;
        geom.texCoords=tc;
        geom.verticesIndices=indices;

        var mesh=new CGL.Mesh(cgl, geom, cgl.gl.LINES);
        mesh.setGeom(geom);
        meshes.push(mesh);

        verts.length=0;
        tc.length=0;
        indices.length=0;
        count=0;
        lvx=null;
    }

    var min=Math.log(1/numRows);
    var max=Math.log(1);
    // op.log(min,max);

    var lines=[];

    for(r=numRows;r>=0;r--)
    {
        // op.log(r/numRows);
        var lvx=null,lvy=null,lvz=null;
        var ltx=null,lty=null;
        var log=0;
        var doLoga=doLog.get();

        var linePoints=[];
        lines.push(linePoints);


        for(c=numColumns;c>=0;c--)
        {
            vx = c * stepColumn - width.get()  / 2 + x;
            if(doLoga)
                vy=(Math.log((r/numRows) )/min)*height.get() - height.get() /2+y;
            else
                vy = r * stepRow    - height.get() / 2 + y;

            var tx = c/numColumns;
            var ty = 1.0-r/numRows;
            if(doLoga) ty = (Math.log((r/numRows) )/min);

            vz=0.0;

            if(axis.get()=='xz')
            {
                vz=vy;
                vy= 0.0 ;
            }
            if(axis.get()=='xy') vz=0.0;

            if(lvx!==null)
            {
                verts.push( lvx );
                verts.push( lvy );
                verts.push( lvz );

                linePoints.push(lvx,lvy,lvz);

                verts.push( vx );
                verts.push( vy );
                verts.push( vz );

                tc.push( ltx );
                tc.push( lty );

                tc.push( tx );
                tc.push( ty );

                indices.push(count);
                count++;
                indices.push(count);
                count++;
            }

            if(count>64000)
            {
                addMesh();
            }

            ltx=tx;
            lty=ty;

            lvx=vx;
            lvy=vy;
            lvz=vz;
        }
    }

    outPointArrays.set(lines);

    addMesh();

    // op.log(meshes.length,' meshes');


}


};

Ops.Gl.Meshes.LinesArray.prototype = new CABLES.Op();
CABLES.OPS["a75265c2-957b-4719-9d03-7bbf00ace364"]={f:Ops.Gl.Meshes.LinesArray,objName:"Ops.Gl.Meshes.LinesArray"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Noise.FBMNoise
// 
// **************************************************************

Ops.Gl.TextureEffects.Noise.FBMNoise = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={fbmnoise_frag:"UNI sampler2D tex;\nUNI float anim;\n\nUNI float scale;\nUNI float repeat;\n\nUNI float scrollX;\nUNI float scrollY;\n\nUNI float amount;\n\nUNI bool layer1;\nUNI bool layer2;\nUNI bool layer3;\nUNI bool layer4;\nUNI vec3 color;\nUNI float aspect;\n\nIN vec2 texCoord;\n\n\n{{CGL.BLENDMODES}}\n\n// csdcsdcds\n// adapted from warp shader by inigo quilez/iq\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.\n\n// See here for a tutorial on how to make this: http://www.iquilezles.org/www/articles/warp/warp.htm\n\nconst mat2 m = mat2( 0.80,  0.60, -0.60,  0.80 );\n\nfloat noise( in vec2 x )\n{\n\treturn sin(1.5*x.x)*sin(1.5*x.y);\n}\n\nfloat fbm4( vec2 p )\n{\n    float f = 0.0;\n    f += 0.5000*noise( p ); p = m*p*2.02;\n    f += 0.2500*noise( p ); p = m*p*2.03;\n    f += 0.1250*noise( p ); p = m*p*2.01;\n    f += 0.0625*noise( p );\n    return f/0.9375;\n}\n\nfloat fbm6( vec2 p )\n{\n    float f = 0.0;\n    f += 0.500000*(0.5+0.5*noise( p )); p = m*p*2.02;\n    f += 0.250000*(0.5+0.5*noise( p )); p = m*p*2.03;\n    f += 0.125000*(0.5+0.5*noise( p )); p = m*p*2.01;\n    f += 0.062500*(0.5+0.5*noise( p )); p = m*p*2.04;\n    f += 0.031250*(0.5+0.5*noise( p )); p = m*p*2.01;\n    f += 0.015625*(0.5+0.5*noise( p ));\n    return f/0.96875;\n}\n\nvoid main()\n{\n    // vec4 col=texture(tex,texCoord+2.0*fbm4(texCoord+2.0*fbm6(texCoord+anim)));\n\n    vec2 tc=texCoord;\n\t#ifdef DO_TILEABLE\n\t    tc=abs(texCoord-0.5);\n\t#endif\n\n\n    vec2 p=(tc-0.5)*scale;\n\n\n    p.y/=aspect;\n    vec2 q = vec2( fbm4( p + vec2(0.3+scrollX,0.20+scrollY) ),\n                   fbm4( p + vec2(3.1+scrollX,1.3+scrollY) ) );\n\n    vec2 q2 = vec2( fbm4( p + vec2(2.0+scrollX,1.0+scrollY) ),\n                   fbm4( p + vec2(3.1+scrollX,1.3+scrollY) ) );\n\n    vec2 q3 = vec2( fbm4( p + vec2(9.0+scrollX,4.0+scrollY) ),\n                   fbm4( p + vec2(3.1+scrollX,4.3+scrollY) ) );\n\n\n\n    float v= fbm4( ( p + 4.0*q +anim*0.1)*repeat);\n    float v2= fbm4( (p + 4.0*q2 +anim*0.1)*repeat );\n\n    float v3= fbm6( (p + 4.0*q3 +anim*0.1)*repeat );\n    float v4= fbm6( (p + 4.0*q2 +anim*0.1)*repeat );\n\n\n\n\n    vec4 base=texture(tex,texCoord);\n\n    vec4 finalColor;\n    float colVal=0.0;\n    float numLayers=0.0;\n\n    if(layer1)\n    {\n        colVal+=v;\n        numLayers++;\n    }\n\n    if(layer2)\n    {\n        colVal+=v2;\n        numLayers++;\n    }\n\n    if(layer3)\n    {\n        colVal+=v3;\n        numLayers++;\n    }\n\n    if(layer4)\n    {\n        colVal+=v4;\n        numLayers++;\n    }\n\n    finalColor=vec4( color*vec3(colVal/numLayers),1.0);\n\n\n    outColor = cgl_blend(base,finalColor,amount);;\n\n}\n",};
const
    render = op.inTrigger("render"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op, "Blend Mode", "normal"),
    amount = op.inValueSlider("Amount", 1),
    r = op.inValueSlider("r", 1.0),
    g = op.inValueSlider("g", 1.0),
    b = op.inValueSlider("b", 1.0),
    trigger = op.outTrigger("trigger");

r.setUiAttribs({ "colorPick": true });

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl);

shader.setSource(shader.getDefaultVertexShader(), attachments.fbmnoise_frag);
const textureUniform = new CGL.Uniform(shader, "t", "tex", 0);

const uniScale = new CGL.Uniform(shader, "f", "scale", op.inValue("scale", 2));
const uniAnim = new CGL.Uniform(shader, "f", "anim", op.inValue("anim", 0));
const uniScrollX = new CGL.Uniform(shader, "f", "scrollX", op.inValue("scrollX", 9));
const uniScrollY = new CGL.Uniform(shader, "f", "scrollY", op.inValue("scrollY", 0));
const uniRepeat = new CGL.Uniform(shader, "f", "repeat", op.inValue("repeat", 1));
const uniAspect = new CGL.Uniform(shader, "f", "aspect", op.inValue("aspect", 1));

const uniLayer1 = new CGL.Uniform(shader, "b", "layer1", op.inValueBool("Layer 1", true));
const uniLayer2 = new CGL.Uniform(shader, "b", "layer2", op.inValueBool("Layer 2", true));
const uniLayer3 = new CGL.Uniform(shader, "b", "layer3", op.inValueBool("Layer 3", true));
const uniLayer4 = new CGL.Uniform(shader, "b", "layer4", op.inValueBool("Layer 4", true));

const uniColor = new CGL.Uniform(shader, "3f", "color", r, g, b);

const amountUniform = new CGL.Uniform(shader, "f", "amount", amount);

const tile = op.inValueBool("Tileable", false);
tile.onChange = updateTileable;
function updateTileable()
{
    if (tile.get())shader.define("DO_TILEABLE");
    else shader.removeDefine("DO_TILEABLE");
}

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount);

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    uniAspect.set(cgl.currentTextureEffect.getCurrentSourceTexture().width / cgl.currentTextureEffect.getCurrentSourceTexture().height);

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.Noise.FBMNoise.prototype = new CABLES.Op();
CABLES.OPS["7073186c-b776-48c2-a01e-041df88ad88a"]={f:Ops.Gl.TextureEffects.Noise.FBMNoise,objName:"Ops.Gl.TextureEffects.Noise.FBMNoise"};




// **************************************************************
// 
// Ops.Math.Multiply
// 
// **************************************************************

Ops.Math.Multiply = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const number1 = op.inValueFloat("number1", 1);
const number2 = op.inValueFloat("number2", 2);
const result = op.outValue("result");

number1.onChange = number2.onChange = update;
update();

function update()
{
    const n1 = number1.get();
    const n2 = number2.get();

    result.set(n1 * n2);
}


};

Ops.Math.Multiply.prototype = new CABLES.Op();
CABLES.OPS["1bbdae06-fbb2-489b-9bcc-36c9d65bd441"]={f:Ops.Math.Multiply,objName:"Ops.Math.Multiply"};




// **************************************************************
// 
// Ops.Gl.ShaderEffects.VertexDisplacementMap_v3
// 
// **************************************************************

Ops.Gl.ShaderEffects.VertexDisplacementMap_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={vertdisplace_body_vert:"\nvec2 MOD_tc=texCoord;\n\n#ifdef MOD_FLIPY\n    MOD_tc.y=1.0-MOD_tc.y;\n#endif\n\n\nfloat MOD_texVal=texture2D( MOD_texture, vec2(MOD_tc.x+MOD_offsetX,MOD_tc.y+MOD_offsetY) ).b;\n// float MOD_texVal=texture2D( MOD_texture, vec2(pos.xy)/4.0 ).b;\n\n#ifdef MOD_HEIGHTMAP_INVERT\n   MOD_texVal=1.0-MOD_texVal;\n#endif\n\n#ifdef MOD_NORMALIZE\n   MOD_texVal=(MOD_texVal-0.5)*2.0;\n#endif\n\n#ifdef MOD_DISPLACE_METH_MULXYZ\n   MOD_texVal+=1.0;\n   pos.xyz *= MOD_texVal * MOD_extrude;\n    // .endl()+'   norm=normalize(norm+normalize(pos.xyz+vec3(MOD_texVal)* MOD_extrude));'\n#endif\n\n#ifdef MOD_DISPLACE_METH_MULXY\n   MOD_texVal+=1.0;\n   pos.xy *= MOD_texVal * MOD_extrude;\n    // .endl()+'   norm=normalize(norm+normalize(pos.xyz+vec3(MOD_texVal)* MOD_extrude));'\n#endif\n\n#ifdef MOD_DISPLACE_METH_ADDZ\n   pos.z+=(MOD_texVal * MOD_extrude);\n#endif\n\n#ifdef MOD_DISPLACE_METH_ADDY\n   pos.y+=(MOD_texVal * MOD_extrude);\n#endif\n\n\n#ifdef MOD_DISPLACE_METH_ADDXY\n   pos.xy+=(MOD_texVal * MOD_extrude);\n#endif\n\n\n#ifdef MOD_DISPLACE_METH_ADDX\n   pos.x+=(MOD_texVal * MOD_extrude);\n#endif\n\n#ifdef MOD_DISPLACE_METH_SUBX\n   pos.x-=(MOD_texVal * MOD_extrude);\n#endif\n\n\n#ifdef MOD_DISPLACE_METH_MULY\n   pos.y+=((MOD_texVal-0.5) * MOD_extrude);\n#endif\n\n#ifdef MOD_DISPLACE_METH_MULZ\n   pos.z+=((MOD_texVal-0.5) * MOD_extrude);\n#endif\n\n#ifdef MOD_DISPLACE_METH_NORMAL\n   pos.xyz+=norm*MOD_texVal*MOD_extrude;\n#endif\n\n#ifdef MOD_DISPLACE_METH_NORMAL_XY\n   pos.xy+=(pos.xy*MOD_texVal*MOD_extrude).xy;\n    // .endl()+'   pos.x+=(norm*MOD_texVal*MOD_extrude).x;'\n#endif\n\n#ifdef MOD_DISPLACE_METH_NORMAL_RGB\n\n    vec3 MOD_texValRGB=texture2D( MOD_texture, vec2(MOD_tc.x+MOD_offsetX,MOD_tc.y+MOD_offsetY) ).rgb;\n    // pos.xyz+=((MOD_texValRGB-0.5)*2.0);//*pos.xyz*0.2;//vec2(MOD_texVal*MOD_extrude)*normalize(pos.xy);\n\n    // MOD_texValRGB.x-=0.5*MOD_texValRGB.y;\n    // MOD_texValRGB.y-=0.5*MOD_texValRGB.x;\n    // MOD_texValRGB.z=0.0;\n\n    // okish\n    // MOD_texValRGB.x-=0.177;\n    // MOD_texValRGB.y-=0.17;\n    // pos.xyz+=((MOD_texValRGB));\n\n    // MOD_texValRGB.r=1.0-MOD_texValRGB.r;\n    // MOD_texValRGB.g=1.0-MOD_texValRGB.g;\n\n\n    MOD_texValRGB=((MOD_texValRGB-0.5)*2.0);\n    MOD_texValRGB.b=0.0;\n\n    // pos.xyz+=MOD_texValRGB;\n\n    // pos.xy+=(normalize(pos.xyz).xy*MOD_texValRGB.rg*MOD_extrude).xy;\n    pos.xyz+=(normalize(pos.xyz).xyz*MOD_texValRGB.grb*MOD_extrude).xyz;\n\n\n#endif\n\n#ifdef MOD_DISPLACE_METH_14\n\n    vec3 MOD_texValRGB=texture2D( MOD_texture, vec2(MOD_tc.x+MOD_offsetX,MOD_tc.y+MOD_offsetY) ).rgb;\n\n\n    // MOD_texValRGB=1.0-MOD_texValRGB;\n    // pos.xyz+=vec2(MOD_texValRGB*MOD_extrude)*normalize(pos.xy);\n\n    // pos.xyz+=vec2(MOD_texValRGB*MOD_extrude)*normalize(pos.xy);\n\n    MOD_texValRGB=(MOD_texValRGB-0.5)*2.0;\n\n    // MOD_texValRGB-=1.0;\n\n\n    // MOD_texValRGB.x*=0.8;\n    // MOD_texValRGB.y*=0.8;\n    // MOD_texValRGB=normalize(MOD_texValRGB);\n\n// pos.xy+=vec2(MOD_texVal*MOD_extrude)*normalize(pos.xy);\n\n    vec3 npos=vec3(0.0,0.0,0.0);\n\n    // npos.xyz=attrTangent;\n    // npos.xyz=(attrTangent.xyz*(MOD_texValRGB.x));\n    // npos.xyz+=(attrBiTangent*(MOD_texValRGB.x));\n\n\n\n\n\n    npos=(attrVertNormal*(MOD_texValRGB.r));\n\n    npos*=MOD_extrude;\n\n    pos.xyz=(npos);\n\n    pos.y+=1.0;\n\n\n\n\n\n\n\n    // MOD_texValRGB\n\n    // pos*=rotationZ( 3.14 );\n\n\n\n    // MOD_texValRGB.x*=0.2;\n    // MOD_texValRGB.y*=0.2;\n    // MOD_texValRGB.z*=0.3;\n\n    // MOD_texValRGB*=0.3;\n\n\n\n\n    // pos.xyz+=pos.xyz*MOD_texValRGB;\n\n    // pos.xyz+=MOD_extrude*vec3(\n    //     rot(pos.xyz,MOD_texValRGB.x*3.0).x,\n    //     rot(pos.xyz,MOD_texValRGB.y*3.0).y,\n    //     rot(pos.xyz,MOD_texValRGB.z*3.0).z);\n\n\n    // pos.xyz+=MOD_extrude*vec3(\n        // rot(pos.xyz,MOD_texValRGB.x*3.0));\n\n\n\n#endif\n\n#ifdef MOD_DISPLACE_METH_NORMAL2\n    // meth 12\n\n    pos.xy+=vec2(MOD_texVal*MOD_extrude)*normalize(pos.xy);\n\n#endif\n\n\nMOD_displHeightMapColor=MOD_texVal;\n\n#ifdef CALC_NORMALS\n    norm+=MOD_calcNormal(MOD_texture,MOD_tc);\n#endif",vertdisplace_head_vert:"OUT float MOD_displHeightMapColor;\n\n// mat4 MOD_rotationX( in float angle ) {\n// \treturn mat4(\t1.0,\t\t0,\t\t\t0,\t\t\t0,\n// \t\t\t \t\t0, \tcos(angle),\t-sin(angle),\t\t0,\n// \t\t\t\t\t0, \tsin(angle),\t cos(angle),\t\t0,\n// \t\t\t\t\t0, \t\t\t0,\t\t\t  0, \t\t1);\n// }\n\n// mat4 MOD_rotationY( in float angle ) {\n// \treturn mat4(\tcos(angle),\t\t0,\t\tsin(angle),\t0,\n// \t\t\t \t\t\t\t0,\t\t1.0,\t\t\t 0,\t0,\n// \t\t\t\t\t-sin(angle),\t0,\t\tcos(angle),\t0,\n// \t\t\t\t\t\t\t0, \t\t0,\t\t\t\t0,\t1);\n// }\n\n// mat4 MOD_rotationZ( in float angle ) {\n// \treturn mat4(\tcos(angle),\t\t-sin(angle),\t0,\t0,\n// \t\t\t \t\tsin(angle),\t\tcos(angle),\t\t0,\t0,\n// \t\t\t\t\t\t\t0,\t\t\t\t0,\t\t1,\t0,\n// \t\t\t\t\t\t\t0,\t\t\t\t0,\t\t0,\t1);\n// }\n\nvec3 MOD_calcNormal(sampler2D tex,vec2 uv)\n{\n    float strength=13.0;\n    float texelSize=1.0/512.0;\n\n    float tl = abs(texture(tex, uv + texelSize * vec2(-1.0, -1.0)).x);   // top left\n    float  l = abs(texture(tex, uv + texelSize * vec2(-1.0,  0.0)).x);   // left\n    float bl = abs(texture(tex, uv + texelSize * vec2(-1.0,  1.0)).x);   // bottom left\n    float  t = abs(texture(tex, uv + texelSize * vec2( 0.0, -1.0)).x);   // top\n    float  b = abs(texture(tex, uv + texelSize * vec2( 0.0,  1.0)).x);   // bottom\n    float tr = abs(texture(tex, uv + texelSize * vec2( 1.0, -1.0)).x);   // top right\n    float  r = abs(texture(tex, uv + texelSize * vec2( 1.0,  0.0)).x);   // right\n    float br = abs(texture(tex, uv + texelSize * vec2( 1.0,  1.0)).x);   // bottom right\n\n    //     // Compute dx using Sobel:\n    //     //           -1 0 1\n    //     //           -2 0 2\n    //     //           -1 0 1\n    float dX = tr + 2.0*r + br -tl - 2.0*l - bl;\n\n    //     // Compute dy using Sobel:\n    //     //           -1 -2 -1\n    //     //            0  0  0\n    //     //            1  2  1\n    float dY = bl + 2.0*b + br -tl - 2.0*t - tr;\n\n    //     // Build the normalized normal\n\n    vec3 N = normalize(vec3(dX,dY, 1.0 / strength));\n\n    //     //convert (-1.0 , 1.0) to (0.0 , 1.0), if needed\n    N= N * 0.5 + 0.5;\n\n   return N;\n}\n",};

const
    render = op.inTrigger("render"),
    texture = op.inTexture("texture"),
    meth = op.inValueSelect("mode", ["normal", "normal xy", "mul xyz", "mul xy", "sub x", "add x", "add xy", "add y", "add z", "mul y", "mul z", "sub z", "normal2", "normal RGB", "m14"], "normal"),
    extrude = op.inValue("extrude", 0.5),
    flip = op.inValueBool("flip", false),
    calcNormals = op.inValueBool("Calc Normals", false),
    removeZero = op.inValueBool("Ignore Zero Values"),
    invert = op.inValueBool("invert"),
    offsetX = op.inValueFloat("offset X"),
    offsetY = op.inValueFloat("offset Y"),
    colorize = op.inValueBool("colorize", false),
    colorizeMin = op.inValueSlider("Colorize Min", 0),
    colorizeMax = op.inValueSlider("Colorize Max", 1),
    next = op.outTrigger("trigger");

const cgl = op.patch.cgl;

var uniExtrude, uniTexture;
const moduleFrag = null;
const moduleVert = null;

var uniTexture = null;
const uniTextureFrag = null;
var uniExtrude = null;
const uniOffsetX = null;
const uniOffsetY = null;
const uniColorizeMin = null;
const uniColorizeMax = null;

op.setPortGroup("Colorize", [colorize, colorizeMin, colorizeMax]);

op.toWorkPortsNeedToBeLinked(texture, next, render);


render.onTriggered = dorender;

colorize.onChange =
    invert.onChange =
    removeZero.onChange =
    flip.onChange =
    calcNormals.onChange =
    meth.onChange = updateDefines;

const srcHeadVert = attachments.vertdisplace_head_vert;
// ""
//     .endl() + "OUT float MOD_displHeightMapColor;"
//     .endl();

const srcBodyVert = attachments.vertdisplace_body_vert;

const srcHeadFrag = ""
    .endl() + "IN float MOD_displHeightMapColor;"
    .endl() + "float MOD_map(float value, float inMin, float inMax, float outMin, float outMax) { return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);}"

    .endl();

const srcBodyFrag = ""
    .endl() + "#ifdef MOD_HEIGHTMAP_COLORIZE"
    .endl() + "   col.rgb*=MOD_map( MOD_displHeightMapColor, 0.0,1.0 , MOD_colorizeMin,MOD_colorizeMax);"
    .endl() + "#endif"
    .endl() + "#ifdef MOD_DISPLACE_REMOVE_ZERO"
    .endl() + "   if(MOD_displHeightMapColor==0.0)discard;"
    .endl() + "#endif"
    .endl();


const mod = new CGL.ShaderModifier(cgl, op.name);
mod.addModule({
    "title": op.name,
    "name": "MODULE_VERTEX_POSITION",
    "srcHeadVert": srcHeadVert,
    "srcBodyVert": srcBodyVert
});

mod.addModule({
    "title": op.name,
    "name": "MODULE_COLOR",
    "srcHeadFrag": srcHeadFrag,
    "srcBodyFrag": srcBodyFrag

});


mod.addUniformVert("t", "MOD_texture", 0);
mod.addUniformVert("f", "MOD_extrude", extrude);
mod.addUniformVert("f", "MOD_offsetX", offsetX);
mod.addUniformVert("f", "MOD_offsetY", offsetY);

mod.addUniformFrag("f", "MOD_colorizeMin", colorizeMin);
mod.addUniformFrag("f", "MOD_colorizeMax", colorizeMax);

updateDefines();


function updateDefines()
{
    mod.toggleDefine("MOD_HEIGHTMAP_COLORIZE", colorize.get());
    mod.toggleDefine("MOD_HEIGHTMAP_INVERT", invert.get());
    mod.toggleDefine("MOD_DISPLACE_REMOVE_ZERO", removeZero.get());

    mod.toggleDefine("MOD_FLIPY", flip.get());
    mod.toggleDefine("MOD_DISPLACE_METH_MULXYZ", meth.get() == "mul xyz");
    mod.toggleDefine("MOD_DISPLACE_METH_MULXY", meth.get() == "mul xy");
    mod.toggleDefine("MOD_DISPLACE_METH_ADDZ", meth.get() == "add z");
    mod.toggleDefine("MOD_DISPLACE_METH_ADDY", meth.get() == "add y");
    mod.toggleDefine("MOD_DISPLACE_METH_ADDX", meth.get() == "add x");
    mod.toggleDefine("MOD_DISPLACE_METH_ADDXY", meth.get() == "add xy");
    mod.toggleDefine("MOD_DISPLACE_METH_SUBX", meth.get() == "sub x");
    mod.toggleDefine("MOD_DISPLACE_METH_MULY", meth.get() == "mul y");
    mod.toggleDefine("MOD_DISPLACE_METH_MULZ", meth.get() == "mul z");
    mod.toggleDefine("MOD_DISPLACE_METH_NORMAL", meth.get() == "normal");
    mod.toggleDefine("MOD_DISPLACE_METH_NORMAL_XY", meth.get() == "normal xy");
    mod.toggleDefine("MOD_DISPLACE_METH_NORMAL2", meth.get() == "normal2");

    mod.toggleDefine("MOD_DISPLACE_METH_NORMAL_RGB", meth.get() == "normal RGB");
    mod.toggleDefine("MOD_DISPLACE_METH_14", meth.get() == "m14");

    mod.toggleDefine("CALC_NORMALS", calcNormals.get());
}

function dorender()
{
    mod.bind();

    if (texture.get()) mod.pushTexture("MOD_texture", texture.get().tex);
    else mod.pushTexture("MOD_texture", CGL.Texture.getEmptyTexture(cgl).tex);

    next.trigger();

    mod.unbind();
}


};

Ops.Gl.ShaderEffects.VertexDisplacementMap_v3.prototype = new CABLES.Op();
CABLES.OPS["2a6f08a1-dee0-4d3a-af7d-41791539c4fb"]={f:Ops.Gl.ShaderEffects.VertexDisplacementMap_v3,objName:"Ops.Gl.ShaderEffects.VertexDisplacementMap_v3"};




// **************************************************************
// 
// Ops.Gl.Shader.BasicMaterial_v3
// 
// **************************************************************

Ops.Gl.Shader.BasicMaterial_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={basicmaterial_frag:"{{MODULES_HEAD}}\n\nIN vec2 texCoord;\n\n#ifdef HAS_TEXTURES\n    IN vec2 texCoordOrig;\n    #ifdef HAS_TEXTURE_DIFFUSE\n        UNI sampler2D tex;\n    #endif\n    #ifdef HAS_TEXTURE_OPACITY\n        UNI sampler2D texOpacity;\n   #endif\n#endif\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n    vec4 col=color;\n\n    #ifdef HAS_TEXTURES\n        vec2 uv=texCoord;\n\n        #ifdef CROP_TEXCOORDS\n            if(uv.x<0.0 || uv.x>1.0 || uv.y<0.0 || uv.y>1.0) discard;\n        #endif\n\n        #ifdef HAS_TEXTURE_DIFFUSE\n            col=texture(tex,uv);\n\n            #ifdef COLORIZE_TEXTURE\n                col.r*=color.r;\n                col.g*=color.g;\n                col.b*=color.b;\n            #endif\n        #endif\n        col.a*=color.a;\n        #ifdef HAS_TEXTURE_OPACITY\n            #ifdef TRANSFORMALPHATEXCOORDS\n                uv=texCoordOrig;\n            #endif\n            #ifdef ALPHA_MASK_ALPHA\n                col.a*=texture(texOpacity,uv).a;\n            #endif\n            #ifdef ALPHA_MASK_LUMI\n                col.a*=dot(vec3(0.2126,0.7152,0.0722), texture(texOpacity,uv).rgb);\n            #endif\n            #ifdef ALPHA_MASK_R\n                col.a*=texture(texOpacity,uv).r;\n            #endif\n            #ifdef ALPHA_MASK_G\n                col.a*=texture(texOpacity,uv).g;\n            #endif\n            #ifdef ALPHA_MASK_B\n                col.a*=texture(texOpacity,uv).b;\n            #endif\n            // #endif\n        #endif\n    #endif\n\n    {{MODULE_COLOR}}\n\n    #ifdef DISCARDTRANS\n        if(col.a<0.2) discard;\n    #endif\n\n    outColor = col;\n}\n",basicmaterial_vert:"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\nIN float attrVertIndex;\n\n{{MODULES_HEAD}}\n\nOUT vec3 norm;\nOUT vec2 texCoord;\nOUT vec2 texCoordOrig;\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\n#ifdef HAS_TEXTURES\n    UNI float diffuseRepeatX;\n    UNI float diffuseRepeatY;\n    UNI float texOffsetX;\n    UNI float texOffsetY;\n#endif\n\nvoid main()\n{\n    mat4 mMatrix=modelMatrix;\n    mat4 mvMatrix;\n\n    norm=attrVertNormal;\n    texCoordOrig=attrTexCoord;\n    texCoord=attrTexCoord;\n    #ifdef HAS_TEXTURES\n        texCoord.x=texCoord.x*diffuseRepeatX+texOffsetX;\n        texCoord.y=(1.0-texCoord.y)*diffuseRepeatY+texOffsetY;\n    #endif\n\n    vec4 pos = vec4(vPosition, 1.0);\n\n    #ifdef BILLBOARD\n       vec3 position=vPosition;\n       mvMatrix=viewMatrix*modelMatrix;\n\n       gl_Position = projMatrix * mvMatrix * vec4((\n           position.x * vec3(\n               mvMatrix[0][0],\n               mvMatrix[1][0],\n               mvMatrix[2][0] ) +\n           position.y * vec3(\n               mvMatrix[0][1],\n               mvMatrix[1][1],\n               mvMatrix[2][1]) ), 1.0);\n    #endif\n\n    {{MODULE_VERTEX_POSITION}}\n\n    #ifndef BILLBOARD\n        mvMatrix=viewMatrix * mMatrix;\n    #endif\n\n\n    #ifndef BILLBOARD\n        // gl_Position = projMatrix * viewMatrix * modelMatrix * pos;\n        gl_Position = projMatrix * mvMatrix * pos;\n    #endif\n}\n",};
const render = op.inTrigger("render");

const trigger = op.outTrigger("trigger");
const shaderOut = op.outObject("shader", null, "shader");

shaderOut.ignoreValueSerialize = true;

op.toWorkPortsNeedToBeLinked(render);

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "basicmaterialnew");
shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG"]);
shader.setSource(attachments.basicmaterial_vert, attachments.basicmaterial_frag);
shaderOut.set(shader);

render.onTriggered = doRender;


// rgba colors
const r = op.inValueSlider("r", Math.random());
const g = op.inValueSlider("g", Math.random());
const b = op.inValueSlider("b", Math.random());
const a = op.inValueSlider("a", 1);
r.setUiAttribs({ "colorPick": true });

// const uniColor=new CGL.Uniform(shader,'4f','color',r,g,b,a);
shader.addUniformFrag("4f", "color", r, g, b, a);

// diffuse outTexture

const diffuseTexture = op.inTexture("texture");
let diffuseTextureUniform = null;
diffuseTexture.onChange = updateDiffuseTexture;

const colorizeTexture = op.inValueBool("colorizeTexture", false);

// opacity texture
const textureOpacity = op.inTexture("textureOpacity");
let textureOpacityUniform = null;

const alphaMaskSource = op.inSwitch("Alpha Mask Source", ["Luminance", "R", "G", "B", "A"], "Luminance");
alphaMaskSource.setUiAttribs({ "greyout": true });
textureOpacity.onChange = updateOpacity;

const texCoordAlpha = op.inValueBool("Opacity TexCoords Transform", false);
const discardTransPxl = op.inValueBool("Discard Transparent Pixels");


// texture coords

const
    diffuseRepeatX = op.inValue("diffuseRepeatX", 1),
    diffuseRepeatY = op.inValue("diffuseRepeatY", 1),
    diffuseOffsetX = op.inValue("Tex Offset X", 0),
    diffuseOffsetY = op.inValue("Tex Offset Y", 0),
    cropRepeat = op.inBool("Crop TexCoords", false);


shader.addUniformFrag("f", "diffuseRepeatX", diffuseRepeatX);
shader.addUniformFrag("f", "diffuseRepeatY", diffuseRepeatY);
shader.addUniformFrag("f", "texOffsetX", diffuseOffsetX);
shader.addUniformFrag("f", "texOffsetY", diffuseOffsetY);

const doBillboard = op.inValueBool("billboard", false);

alphaMaskSource.onChange =
    doBillboard.onChange =
    discardTransPxl.onChange =
    texCoordAlpha.onChange =
    cropRepeat.onChange =
    colorizeTexture.onChange = updateDefines;


op.setPortGroup("Color", [r, g, b, a]);
op.setPortGroup("Color Texture", [diffuseTexture, colorizeTexture]);
op.setPortGroup("Opacity", [textureOpacity, alphaMaskSource, discardTransPxl, texCoordAlpha]);
op.setPortGroup("Texture Transform", [diffuseRepeatX, diffuseRepeatY, diffuseOffsetX, diffuseOffsetY, cropRepeat]);


updateOpacity();
updateDiffuseTexture();


op.preRender = function ()
{
    shader.bind();
    doRender();
};

function doRender()
{
    if (!shader) return;

    cgl.pushShader(shader);
    shader.popTextures();

    if (diffuseTextureUniform && diffuseTexture.get()) shader.pushTexture(diffuseTextureUniform, diffuseTexture.get().tex);
    if (textureOpacityUniform && textureOpacity.get()) shader.pushTexture(textureOpacityUniform, textureOpacity.get().tex);
    trigger.trigger();

    cgl.popShader();
}

function updateOpacity()
{
    if (textureOpacity.get())
    {
        if (textureOpacityUniform !== null) return;
        shader.removeUniform("texOpacity");
        shader.define("HAS_TEXTURE_OPACITY");
        if (!textureOpacityUniform)textureOpacityUniform = new CGL.Uniform(shader, "t", "texOpacity");

        alphaMaskSource.setUiAttribs({ "greyout": false });
        texCoordAlpha.setUiAttribs({ "greyout": false });
    }
    else
    {
        shader.removeUniform("texOpacity");
        shader.removeDefine("HAS_TEXTURE_OPACITY");
        textureOpacityUniform = null;

        alphaMaskSource.setUiAttribs({ "greyout": true });
        texCoordAlpha.setUiAttribs({ "greyout": true });
    }

    updateDefines();
}

function updateDiffuseTexture()
{
    if (diffuseTexture.get())
    {
        if (!shader.hasDefine("HAS_TEXTURE_DIFFUSE"))shader.define("HAS_TEXTURE_DIFFUSE");
        if (!diffuseTextureUniform)diffuseTextureUniform = new CGL.Uniform(shader, "t", "texDiffuse");

        diffuseRepeatX.setUiAttribs({ "greyout": false });
        diffuseRepeatY.setUiAttribs({ "greyout": false });
        diffuseOffsetX.setUiAttribs({ "greyout": false });
        diffuseOffsetY.setUiAttribs({ "greyout": false });
        colorizeTexture.setUiAttribs({ "greyout": false });
    }
    else
    {
        shader.removeUniform("texDiffuse");
        shader.removeDefine("HAS_TEXTURE_DIFFUSE");
        diffuseTextureUniform = null;

        diffuseRepeatX.setUiAttribs({ "greyout": true });
        diffuseRepeatY.setUiAttribs({ "greyout": true });
        diffuseOffsetX.setUiAttribs({ "greyout": true });
        diffuseOffsetY.setUiAttribs({ "greyout": true });
        colorizeTexture.setUiAttribs({ "greyout": true });
    }
}

function updateDefines()
{
    shader.toggleDefine("CROP_TEXCOORDS", cropRepeat.get());
    shader.toggleDefine("COLORIZE_TEXTURE", colorizeTexture.get());
    shader.toggleDefine("TRANSFORMALPHATEXCOORDS", texCoordAlpha.get());
    shader.toggleDefine("DISCARDTRANS", discardTransPxl.get());
    shader.toggleDefine("BILLBOARD", doBillboard.get());

    shader.toggleDefine("ALPHA_MASK_ALPHA", alphaMaskSource.get() == "A");
    shader.toggleDefine("ALPHA_MASK_LUMI", alphaMaskSource.get() == "Luminance");
    shader.toggleDefine("ALPHA_MASK_R", alphaMaskSource.get() == "R");
    shader.toggleDefine("ALPHA_MASK_G", alphaMaskSource.get() == "G");
    shader.toggleDefine("ALPHA_MASK_B", alphaMaskSource.get() == "B");
}


};

Ops.Gl.Shader.BasicMaterial_v3.prototype = new CABLES.Op();
CABLES.OPS["ec55d252-3843-41b1-b731-0482dbd9e72b"]={f:Ops.Gl.Shader.BasicMaterial_v3,objName:"Ops.Gl.Shader.BasicMaterial_v3"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Blur
// 
// **************************************************************

Ops.Gl.TextureEffects.Blur = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={blur_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float dirX;\nUNI float dirY;\nUNI float amount;\n\n#ifdef HAS_MASK\n    UNI sampler2D imageMask;\n#endif\n\nfloat random(vec3 scale, float seed)\n{\n    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);\n}\n\nvoid main()\n{\n    vec4 color = vec4(0.0);\n    float total = 0.0;\n\n    float am=amount;\n    #ifdef HAS_MASK\n        am=amount*texture(imageMask,texCoord).r;\n        if(am<=0.02)\n        {\n            outColor=texture(tex, texCoord);\n            return;\n        }\n    #endif\n\n    vec2 delta=vec2(dirX*am*0.01,dirY*am*0.01);\n\n\n    float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);\n\n    #ifdef MOBILE\n        offset = 0.1;\n    #endif\n\n    #if defined(FASTBLUR) && !defined(MOBILE)\n        const float range=5.0;\n    #else\n        const float range=20.0;\n    #endif\n\n    for (float t = -range; t <= range; t+=1.0)\n    {\n        float percent = (t + offset - 0.5) / range;\n        float weight = 1.0 - abs(percent);\n        vec4 smpl = texture(tex, texCoord + delta * percent);\n\n        smpl.rgb *= smpl.a;\n\n        color += smpl * weight;\n        total += weight;\n    }\n\n    outColor= color / total;\n\n    outColor.rgb /= outColor.a + 0.00001;\n\n\n\n}\n",};
const render=op.inTrigger('render');
const trigger=op.outTrigger('trigger');
const amount=op.inValueFloat("amount");
const direction=op.inSwitch("direction",['both','vertical','horizontal'],'both');
const fast=op.inValueBool("Fast",true);
const cgl=op.patch.cgl;

amount.set(10);

var shader=new CGL.Shader(cgl);

shader.define("FASTBLUR");

fast.onChange=function()
{
    if(fast.get()) shader.define("FASTBLUR");
    else shader.removeDefine("FASTBLUR");
};

shader.setSource(shader.getDefaultVertexShader(),attachments.blur_frag);
var textureUniform=new CGL.Uniform(shader,'t','tex',0);

var uniDirX=new CGL.Uniform(shader,'f','dirX',0);
var uniDirY=new CGL.Uniform(shader,'f','dirY',0);

var uniWidth=new CGL.Uniform(shader,'f','width',0);
var uniHeight=new CGL.Uniform(shader,'f','height',0);

var uniAmount=new CGL.Uniform(shader,'f','amount',amount.get());
amount.onChange=function(){ uniAmount.setValue(amount.get()); };

var textureAlpha=new CGL.Uniform(shader,'t','imageMask',1);

var showingError = false;

function fullScreenBlurWarning ()
{
    if(cgl.currentTextureEffect.getCurrentSourceTexture().width == cgl.canvasWidth &&
        cgl.currentTextureEffect.getCurrentSourceTexture().height == cgl.canvasHeight)
    {
        op.setUiError('warning','Full screen blurs are slow! Try reducing the resolution to 1/2 or a 1/4',0);
    }
    else
    {
        op.setUiError('warning',null);
    }
};

var dir=0;
direction.onChange=function()
{
    if(direction.get()=='both')dir=0;
    if(direction.get()=='horizontal')dir=1;
    if(direction.get()=='vertical')dir=2;
};

var mask=op.inTexture("mask");

mask.onChange=function()
{
    if(mask.get() && mask.get().tex) shader.define('HAS_MASK');
        else shader.removeDefine('HAS_MASK');
};

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);

    uniWidth.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().width);
    uniHeight.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().height);

    fullScreenBlurWarning();

    // first pass
    if(dir===0 || dir==2)
    {

        cgl.currentTextureEffect.bind();
        cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );


        if(mask.get() && mask.get().tex)
        {
            cgl.setTexture(1, mask.get().tex );
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, mask.get().tex );
        }


        uniDirX.setValue(0.0);
        uniDirY.setValue(1.0);

        cgl.currentTextureEffect.finish();
    }

    // second pass
    if(dir===0 || dir==1)
    {

        cgl.currentTextureEffect.bind();
        cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );


        if(mask.get() && mask.get().tex)
        {
            cgl.setTexture(1, mask.get().tex );
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, mask.get().tex );
        }

        uniDirX.setValue(1.0);
        uniDirY.setValue(0.0);

        cgl.currentTextureEffect.finish();
    }

    cgl.popShader();
    trigger.trigger();
};





};

Ops.Gl.TextureEffects.Blur.prototype = new CABLES.Op();
CABLES.OPS["54f26f53-f637-44c1-9bfb-a2f2b722e998"]={f:Ops.Gl.TextureEffects.Blur,objName:"Ops.Gl.TextureEffects.Blur"};




// **************************************************************
// 
// Ops.Devices.Mouse.Mouse_v2
// 
// **************************************************************

Ops.Devices.Mouse.Mouse_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    active = op.inValueBool("Active", true),
    relative = op.inValueBool("relative"),
    normalize = op.inValueBool("normalize"),
    flipY = op.inValueBool("flip y", true),
    area = op.inValueSelect("Area", ["Canvas", "Document", "Parent Element"], "Canvas"),
    rightClickPrevDef = op.inBool("right click prevent default", true),
    touchscreen = op.inValueBool("Touch support", true),
    smooth = op.inValueBool("smooth"),
    smoothSpeed = op.inValueFloat("smoothSpeed", 20),
    multiply = op.inValueFloat("multiply", 1),
    outMouseX = op.outValue("x", 0),
    outMouseY = op.outValue("y", 0),
    mouseDown = op.outValueBool("button down"),
    mouseClick = op.outTrigger("click"),
    mouseUp = op.outTrigger("Button Up"),
    mouseClickRight = op.outTrigger("click right"),
    mouseOver = op.outValueBool("mouseOver"),
    outButton = op.outValue("button");

op.setPortGroup("Behavior", [relative, normalize, flipY, area, rightClickPrevDef, touchscreen]);
op.setPortGroup("Smoothing", [smooth, smoothSpeed, multiply]);

let smoothTimer = 0;
const cgl = op.patch.cgl;
let listenerElement = null;

function setValue(x, y)
{
    if (normalize.get())
    {
        let w = cgl.canvas.width / cgl.pixelDensity;
        let h = cgl.canvas.height / cgl.pixelDensity;
        if (listenerElement == document.body)
        {
            w = listenerElement.clientWidth / cgl.pixelDensity;
            h = listenerElement.clientHeight / cgl.pixelDensity;
        }
        outMouseX.set(((x || 0) / w * 2.0 - 1.0) * multiply.get());
        outMouseY.set(((y || 0) / h * 2.0 - 1.0) * multiply.get());
    }
    else
    {
        outMouseX.set((x || 0) * multiply.get());
        outMouseY.set((y || 0) * multiply.get());
    }
}

smooth.onChange = function ()
{
    if (smooth.get()) smoothTimer = setInterval(updateSmooth, 5);
    else if (smoothTimer)clearTimeout(smoothTimer);
};

let smoothX, smoothY;
let lineX = 0, lineY = 0;

normalize.onChange = function ()
{
    mouseX = 0;
    mouseY = 0;
    setValue(mouseX, mouseY);
};

var mouseX = cgl.canvas.width / 2;
var mouseY = cgl.canvas.height / 2;

lineX = mouseX;
lineY = mouseY;

outMouseX.set(mouseX);
outMouseY.set(mouseY);

let relLastX = 0;
let relLastY = 0;
let offsetX = 0;
let offsetY = 0;
addListeners();

area.onChange = addListeners;

let speed = 0;

function updateSmooth()
{
    speed = smoothSpeed.get();
    if (speed <= 0)speed = 0.01;
    const distanceX = Math.abs(mouseX - lineX);
    const speedX = Math.round(distanceX / speed, 0);
    lineX = (lineX < mouseX) ? lineX + speedX : lineX - speedX;

    const distanceY = Math.abs(mouseY - lineY);
    const speedY = Math.round(distanceY / speed, 0);
    lineY = (lineY < mouseY) ? lineY + speedY : lineY - speedY;

    setValue(lineX, lineY);
}

function onMouseEnter(e)
{
    mouseDown.set(false);
    mouseOver.set(true);
    speed = smoothSpeed.get();
}

function onMouseDown(e)
{
    outButton.set(e.which);
    mouseDown.set(true);
}

function onMouseUp(e)
{
    outButton.set(0);
    mouseDown.set(false);
    mouseUp.trigger();
}

function onClickRight(e)
{
    mouseClickRight.trigger();
    if (rightClickPrevDef.get()) e.preventDefault();
}

function onmouseclick(e)
{
    mouseClick.trigger();
}


function onMouseLeave(e)
{
    relLastX = 0;
    relLastY = 0;

    speed = 100;

    // disabled for now as it makes no sense that the mouse bounces back to the center
    // if(area.get()!='Document')
    // {
    //     // leave anim
    //     if(smooth.get())
    //     {
    //         mouseX=cgl.canvas.width/2;
    //         mouseY=cgl.canvas.height/2;
    //     }

    // }
    mouseOver.set(false);
    mouseDown.set(false);
}

relative.onChange = function ()
{
    offsetX = 0;
    offsetY = 0;
};

function onmousemove(e)
{
    mouseOver.set(true);

    if (!relative.get())
    {
        if (area.get() != "Document")
        {
            offsetX = e.offsetX;
            offsetY = e.offsetY;
        }
        else
        {
            offsetX = e.clientX;
            offsetY = e.clientY;
        }

        if (smooth.get())
        {
            mouseX = offsetX;

            if (flipY.get()) mouseY = listenerElement.clientHeight - offsetY;
            else mouseY = offsetY;
        }
        else
        {
            if (flipY.get()) setValue(offsetX, listenerElement.clientHeight - offsetY);
            else setValue(offsetX, offsetY);
        }
    }
    else
    {
        if (relLastX != 0 && relLastY != 0)
        {
            offsetX = e.offsetX - relLastX;
            offsetY = e.offsetY - relLastY;
        }
        else
        {

        }

        relLastX = e.offsetX;
        relLastY = e.offsetY;

        mouseX += offsetX;
        mouseY += offsetY;

        if (mouseY > 460)mouseY = 460;
    }
}

function ontouchstart(event)
{
    mouseDown.set(true);

    if (event.touches && event.touches.length > 0) onMouseDown(event.touches[0]);
}

function ontouchend(event)
{
    mouseDown.set(false);
    onMouseUp();
}

touchscreen.onChange = function ()
{
    removeListeners();
    addListeners();
};

function removeListeners()
{
    if (!listenerElement) return;
    listenerElement.removeEventListener("touchend", ontouchend);
    listenerElement.removeEventListener("touchstart", ontouchstart);

    listenerElement.removeEventListener("click", onmouseclick);
    listenerElement.removeEventListener("mousemove", onmousemove);
    listenerElement.removeEventListener("mouseleave", onMouseLeave);
    listenerElement.removeEventListener("mousedown", onMouseDown);
    listenerElement.removeEventListener("mouseup", onMouseUp);
    listenerElement.removeEventListener("mouseenter", onMouseEnter);
    listenerElement.removeEventListener("contextmenu", onClickRight);
    listenerElement = null;
}

function addListeners()
{
    if (listenerElement || !active.get())removeListeners();
    if (!active.get()) return;

    listenerElement = cgl.canvas;
    if (area.get() == "Document") listenerElement = document.body;
    if (area.get() == "Parent Element") listenerElement = cgl.canvas.parentElement;

    if (touchscreen.get())
    {
        listenerElement.addEventListener("touchend", ontouchend);
        listenerElement.addEventListener("touchstart", ontouchstart);
    }

    listenerElement.addEventListener("click", onmouseclick);
    listenerElement.addEventListener("mousemove", onmousemove);
    listenerElement.addEventListener("mouseleave", onMouseLeave);
    listenerElement.addEventListener("mousedown", onMouseDown);
    listenerElement.addEventListener("mouseup", onMouseUp);
    listenerElement.addEventListener("mouseenter", onMouseEnter);
    listenerElement.addEventListener("contextmenu", onClickRight);
}

active.onChange = function ()
{
    if (listenerElement)removeListeners();
    if (active.get())addListeners();
};

op.onDelete = function ()
{
    removeListeners();
};

addListeners();


};

Ops.Devices.Mouse.Mouse_v2.prototype = new CABLES.Op();
CABLES.OPS["9fa3fc46-3147-4e3a-8ee8-a93ea9e8786e"]={f:Ops.Devices.Mouse.Mouse_v2,objName:"Ops.Devices.Mouse.Mouse_v2"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Noise.Noise
// 
// **************************************************************

Ops.Gl.TextureEffects.Noise.Noise = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={noise_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\nUNI float time;\n\n{{CGL.BLENDMODES}}\n{{MODULES_HEAD}}\n\n{{CGL.RANDOM_TEX}}\n\nvoid main()\n{\n    vec4 rnd;\n\n    #ifndef RGB\n        float r=cgl_random(texCoord.xy+vec2(time));\n        rnd=vec4( r,r,r,1.0 );\n    #endif\n\n    #ifdef RGB\n        rnd=vec4(cgl_random3(texCoord.xy+vec2(time)),1.0);\n    #endif\n\n    vec4 base=texture(tex,texCoord);\n    vec4 col=vec4( _blend(base.rgb,rnd.rgb) ,1.0);\n\n    outColor=vec4( mix( col.rgb, base.rgb ,1.0-base.a*amount),1.0);\n}",};
const
    render=op.inTrigger('Render'),
    blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
    amount=op.inValueSlider("Amount",1),
    animated=op.inValueBool("Animated",true),
    inRGB=op.inValueBool("RGB",false),
    trigger=op.outTrigger("Next");

const
    cgl=op.patch.cgl,
    shader=new CGL.Shader(cgl),
    amountUniform=new CGL.Uniform(shader,'f','amount',amount),
    timeUniform=new CGL.Uniform(shader,'f','time',1.0),
    textureUniform=new CGL.Uniform(shader,'t','tex',0);

shader.setSource(shader.getDefaultVertexShader(),attachments.noise_frag);

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

op.toWorkPortsNeedToBeLinked(render);

inRGB.onChange=function()
{
    if(inRGB.get())shader.define("RGB");
    else shader.removeDefine("RGB");
};

shader.bindTextures=function()
{
    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );
};

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    if(animated.get()) timeUniform.setValue(op.patch.freeTimer.get()/1000%100);
        else timeUniform.setValue(0);

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};



};

Ops.Gl.TextureEffects.Noise.Noise.prototype = new CABLES.Op();
CABLES.OPS["81253441-cc73-42fa-b903-6d23806873d9"]={f:Ops.Gl.TextureEffects.Noise.Noise,objName:"Ops.Gl.TextureEffects.Noise.Noise"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.ImageCompose
// 
// **************************************************************

Ops.Gl.TextureEffects.ImageCompose = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const render = op.inTrigger("render");
const useVPSize = op.inBool("use viewport size");
const width = op.inValueInt("width");
const height = op.inValueInt("height");

const tfilter = op.inSwitch("filter", ["nearest", "linear", "mipmap"], "linear");
const twrap = op.inValueSelect("wrap", ["clamp to edge", "repeat", "mirrored repeat"]);
const fpTexture = op.inValueBool("HDR");

const trigger = op.outTrigger("trigger");
const texOut = op.outTexture("texture_out");

const bgAlpha = op.inValueSlider("Background Alpha", 0);
const outRatio = op.outValue("Aspect Ratio");

op.setPortGroup("Texture Size", [useVPSize, width, height]);
op.setPortGroup("Texture Settings", [twrap, tfilter, fpTexture]);

const cgl = op.patch.cgl;
texOut.set(CGL.Texture.getEmptyTexture(cgl));
let effect = null;
let tex = null;

let w = 8, h = 8;
const prevViewPort = [0, 0, 0, 0];
let reInitEffect = true;

const bgFrag = ""
    .endl() + "uniform float a;"
    .endl() + "void main()"
    .endl() + "{"
    .endl() + "   outColor= vec4(0.0,0.0,0.0,a);"
    .endl() + "}";
const bgShader = new CGL.Shader(cgl, "imgcompose bg");
bgShader.setSource(bgShader.getDefaultVertexShader(), bgFrag);
const uniBgAlpha = new CGL.Uniform(bgShader, "f", "a", bgAlpha);

let selectedFilter = CGL.Texture.FILTER_LINEAR;
let selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

function initEffect()
{
    if (effect)effect.delete();
    if (tex)tex.delete();

    effect = new CGL.TextureEffect(cgl, { "isFloatingPointTexture": fpTexture.get() });

    tex = new CGL.Texture(cgl,
        {
            "name": "image compose",
            "isFloatingPointTexture": fpTexture.get(),
            "filter": selectedFilter,
            "wrap": selectedWrap,
            "width": Math.ceil(width.get()),
            "height": Math.ceil(height.get()),
        });

    effect.setSourceTexture(tex);
    texOut.set(CGL.Texture.getEmptyTexture(cgl));
    // texOut.set(effect.getCurrentSourceTexture());

    // texOut.set(effect.getCurrentSourceTexture());

    reInitEffect = false;

    // op.log("reinit effect");
    // tex.printInfo();
}

fpTexture.onChange = function ()
{
    reInitEffect = true;

    // var e1=cgl.gl.getExtension('EXT_color_buffer_float');
    // var e2=cgl.gl.getExtension('EXT_float_blend');
};

function updateResolution()
{
    if (!effect)initEffect();

    if (useVPSize.get())
    {
        w = cgl.getViewPort()[2];
        h = cgl.getViewPort()[3];
    }
    else
    {
        w = Math.ceil(width.get());
        h = Math.ceil(height.get());
    }

    if ((w != tex.width || h != tex.height) && (w !== 0 && h !== 0))
    {
        height.set(h);
        width.set(w);
        tex.setSize(w, h);
        outRatio.set(w / h);
        effect.setSourceTexture(tex);
        // texOut.set(null);
        texOut.set(CGL.Texture.getEmptyTexture(cgl));
        texOut.set(tex);
    }

    if (texOut.get() && selectedFilter != CGL.Texture.FILTER_NEAREST)
    {
        if (!texOut.get().isPowerOfTwo()) op.setUiError("hintnpot", "texture dimensions not power of two! - texture filtering when scaling will not work on ios devices.", 0);
        else op.setUiError("hintnpot", null, 0);
    }
    else op.setUiError("hintnpot", null, 0);

    // if (texOut.get())
    //     if (!texOut.get().isPowerOfTwo())
    //     {
    //         if (!op.uiAttribs.hint)
    //             op.uiAttr(
    //                 {
    //                     "hint": "texture dimensions not power of two! - texture filtering will not work.",
    //                     "warning": null
    //                 });
    //     }
    //     else
    //     if (op.uiAttribs.hint)
    //     {
    //         op.uiAttr({ "hint": null, "warning": null }); // todo only when needed...
    //     }
}

function updateSizePorts()
{
    if (useVPSize.get())
    {
        width.setUiAttribs({ "greyout": true });
        height.setUiAttribs({ "greyout": true });
    }
    else
    {
        width.setUiAttribs({ "greyout": false });
        height.setUiAttribs({ "greyout": false });
    }
}

useVPSize.onChange = function ()
{
    updateSizePorts();
    if (useVPSize.get())
    {
        width.onChange = null;
        height.onChange = null;
    }
    else
    {
        width.onChange = updateResolution;
        height.onChange = updateResolution;
    }
    updateResolution();
};

op.preRender = function ()
{
    doRender();
    bgShader.bind();
};

var doRender = function ()
{
    if (!effect || reInitEffect)
    {
        initEffect();
    }
    const vp = cgl.getViewPort();
    prevViewPort[0] = vp[0];
    prevViewPort[1] = vp[1];
    prevViewPort[2] = vp[2];
    prevViewPort[3] = vp[3];

    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA, cgl.gl.ONE_MINUS_SRC_ALPHA);

    updateResolution();

    cgl.currentTextureEffect = effect;
    effect.setSourceTexture(tex);

    effect.startEffect();

    // render background color...
    cgl.pushShader(bgShader);
    cgl.currentTextureEffect.bind();
    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);
    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();

    texOut.set(effect.getCurrentSourceTexture());
    // texOut.set(effect.getCurrentTargetTexture());

    // if(effect.getCurrentSourceTexture.filter==CGL.Texture.FILTER_MIPMAP)
    // {
    //         this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, effect.getCurrentSourceTexture.tex);
    //         effect.getCurrentSourceTexture.updateMipMap();
    //     // else
    //     // {
    //     //     this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, this._textureSource.tex);;
    //     //     this._textureSource.updateMipMap();
    //     // }

    //     this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, null);
    // }

    effect.endEffect();

    cgl.setViewPort(prevViewPort[0], prevViewPort[1], prevViewPort[2], prevViewPort[3]);

    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA, cgl.gl.ONE_MINUS_SRC_ALPHA);

    cgl.currentTextureEffect = null;
};

function onWrapChange()
{
    if (twrap.get() == "repeat") selectedWrap = CGL.Texture.WRAP_REPEAT;
    if (twrap.get() == "mirrored repeat") selectedWrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
    if (twrap.get() == "clamp to edge") selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reInitEffect = true;
    updateResolution();
}

twrap.set("repeat");
twrap.onChange = onWrapChange;

function onFilterChange()
{
    if (tfilter.get() == "nearest") selectedFilter = CGL.Texture.FILTER_NEAREST;
    if (tfilter.get() == "linear") selectedFilter = CGL.Texture.FILTER_LINEAR;
    if (tfilter.get() == "mipmap") selectedFilter = CGL.Texture.FILTER_MIPMAP;

    reInitEffect = true;
    updateResolution();
    // effect.setSourceTexture(tex);
    // updateResolution();
}

tfilter.set("linear");
tfilter.onChange = onFilterChange;

useVPSize.set(true);
render.onTriggered = doRender;
op.preRender = doRender;

width.set(640);
height.set(360);
onFilterChange();
onWrapChange();
updateSizePorts();


};

Ops.Gl.TextureEffects.ImageCompose.prototype = new CABLES.Op();
CABLES.OPS["5c04608d-1e42-4e36-be00-1be4a81fc309"]={f:Ops.Gl.TextureEffects.ImageCompose,objName:"Ops.Gl.TextureEffects.ImageCompose"};




// **************************************************************
// 
// Ops.Gl.Meshes.TextMesh_v2
// 
// **************************************************************

Ops.Gl.Meshes.TextMesh_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={textmesh_frag:"UNI sampler2D tex;\n#ifdef DO_MULTEX\n    UNI sampler2D texMul;\n#endif\n#ifdef DO_MULTEX_MASK\n    UNI sampler2D texMulMask;\n#endif\nIN vec2 texCoord;\nIN vec2 texPos;\nUNI float r;\nUNI float g;\nUNI float b;\nUNI float a;\n\nvoid main()\n{\n   vec4 col=texture(tex,texCoord);\n   col.a=col.r;\n   col.r*=r;\n   col.g*=g;\n   col.b*=b;\n   col*=a;\n   if(col.a==0.0)discard;\n\n\n    #ifdef DO_MULTEX\n        col*=texture(texMul,texPos);\n    #endif\n\n    #ifdef DO_MULTEX_MASK\n        col*=texture(texMulMask,texPos).r;\n    #endif\n\n\n\n   outColor=col;\n}",textmesh_vert:"UNI sampler2D tex;\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\nUNI float scale;\nIN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN mat4 instMat;\nIN vec2 attrTexOffsets;\nIN vec2 attrTexSize;\nIN vec2 attrTexPos;\nOUT vec2 texPos;\n\nOUT vec2 texCoord;\n\nvoid main()\n{\n   texCoord=(attrTexCoord*(attrTexSize)) + attrTexOffsets;\n   mat4 instModelMat=instMat;\n   instModelMat[3][0]*=scale;\n\n   texPos=attrTexPos;\n\n   vec4 vert=vec4( vPosition.x*(attrTexSize.x/attrTexSize.y)*scale,vPosition.y*scale,vPosition.z*scale, 1. );\n\n   mat4 mvMatrix=viewMatrix * modelMatrix * instModelMat;\n\n   #ifndef BILLBOARD\n       gl_Position = projMatrix * mvMatrix * vert;\n   #endif\n}\n",};
const
    render = op.inTrigger("Render"),
    str = op.inString("Text", "cables"),
    scale = op.inValueFloat("Scale", 1),
    inFont = op.inString("Font", "Arial"),
    align = op.inValueSelect("align", ["left", "center", "right"], "center"),
    valign = op.inValueSelect("vertical align", ["Top", "Middle", "Bottom"], "Middle"),
    lineHeight = op.inValueFloat("Line Height", 1),
    letterSpace = op.inValueFloat("Letter Spacing"),

    tfilter = op.inSwitch("filter", ["nearest", "linear", "mipmap"], "mipmap"),
    aniso = op.inSwitch("Anisotropic", [0, 1, 2, 4, 8, 16], 0),

    inMulTex = op.inTexture("Texture Color"),
    inMulTexMask = op.inTexture("Texture Mask"),
    next = op.outTrigger("Next"),
    textureOut = op.outTexture("texture"),
    outLines = op.outNumber("Total Lines", 0),
    outWidth = op.outNumber("Width", 0),
    loaded = op.outValue("Font Available", 0);

const cgl = op.patch.cgl;


op.setPortGroup("Masking", [inMulTex, inMulTexMask]);


const textureSize = 1024;
let fontLoaded = false;
let needUpdate = true;

align.onChange =
    str.onChange =
    lineHeight.onChange = generateMeshLater;


function generateMeshLater()
{
    needUpdate = true;
}

let canvasid = null;
CABLES.OpTextureMeshCanvas = {};
let valignMode = 0;


const geom = null;
let mesh = null;

let createMesh = true;
let createTexture = true;

aniso.onChange =
tfilter.onChange = () =>
{
    getFont().texture = null;
    createTexture = true;
};

inMulTexMask.onChange =
inMulTex.onChange = function ()
{
    shader.toggleDefine("DO_MULTEX", inMulTex.get());
    shader.toggleDefine("DO_MULTEX_MASK", inMulTexMask.get());
};

textureOut.set(null);
inFont.onChange = function ()
{
    createTexture = true;
    createMesh = true;
    checkFont();
};

op.patch.on("fontLoaded", (fontName) =>
{
    if (fontName == inFont.get())
    {
        createTexture = true;
        createMesh = true;
    }
});


function checkFont()
{
    const oldFontLoaded = fontLoaded;
    try
    {
        fontLoaded = document.fonts.check("20px \"" + inFont.get() + "\"");
    }
    catch (ex)
    {
        op.error(ex);
    }

    if (!oldFontLoaded && fontLoaded)
    {
        loaded.set(true);
        createTexture = true;
        createMesh = true;
    }

    if (!fontLoaded) setTimeout(checkFont, 250);
}


valign.onChange = function ()
{
    if (valign.get() == "Middle")valignMode = 0;
    else if (valign.get() == "Top")valignMode = 1;
    else if (valign.get() == "Bottom")valignMode = 2;
};

function getFont()
{
    canvasid = "" + inFont.get();
    if (CABLES.OpTextureMeshCanvas.hasOwnProperty(canvasid))
        return CABLES.OpTextureMeshCanvas[canvasid];

    const fontImage = document.createElement("canvas");
    fontImage.dataset.font = inFont.get();
    fontImage.id = "texturetext_" + CABLES.generateUUID();
    fontImage.style.display = "none";
    const body = document.getElementsByTagName("body")[0];
    body.appendChild(fontImage);
    const _ctx = fontImage.getContext("2d");
    CABLES.OpTextureMeshCanvas[canvasid] =
        {
            "ctx": _ctx,
            "canvas": fontImage,
            "chars": {},
            "characters": "?",
            "fontSize": 320
        };
    return CABLES.OpTextureMeshCanvas[canvasid];
}

op.onDelete = function ()
{
    if (canvasid && CABLES.OpTextureMeshCanvas[canvasid])
        CABLES.OpTextureMeshCanvas[canvasid].canvas.remove();
};

var shader = new CGL.Shader(cgl, "TextMesh");
shader.setSource(attachments.textmesh_vert, attachments.textmesh_frag);
const uniTex = new CGL.Uniform(shader, "t", "tex", 0);
const uniTexMul = new CGL.Uniform(shader, "t", "texMul", 1);
const uniTexMulMask = new CGL.Uniform(shader, "t", "texMulMask", 2);
const uniScale = new CGL.Uniform(shader, "f", "scale", scale);

const
    r = op.inValueSlider("r", 1),
    g = op.inValueSlider("g", 1),
    b = op.inValueSlider("b", 1),
    a = op.inValueSlider("a", 1),
    runiform = new CGL.Uniform(shader, "f", "r", r),
    guniform = new CGL.Uniform(shader, "f", "g", g),
    buniform = new CGL.Uniform(shader, "f", "b", b),
    auniform = new CGL.Uniform(shader, "f", "a", a);
r.setUiAttribs({ "colorPick": true });

op.setPortGroup("Display", [scale, inFont]);
op.setPortGroup("Alignment", [align, valign]);
op.setPortGroup("Color", [r, g, b, a]);


let height = 0;
const vec = vec3.create();
let lastTextureChange = -1;
let disabled = false;

render.onTriggered = function ()
{
    if (needUpdate)
    {
        generateMesh();
        needUpdate = false;
    }
    const font = getFont();
    if (font.lastChange != lastTextureChange)
    {
        createMesh = true;
        lastTextureChange = font.lastChange;
    }

    if (createTexture) generateTexture();
    if (createMesh)generateMesh();

    if (mesh && mesh.numInstances > 0)
    {
        cgl.pushBlendMode(CGL.BLEND_NORMAL, true);
        cgl.setShader(shader);
        cgl.setTexture(0, textureOut.get().tex);

        const mulTex = inMulTex.get();
        if (mulTex)cgl.setTexture(1, mulTex.tex);

        const mulTexMask = inMulTexMask.get();
        if (mulTexMask)cgl.setTexture(2, mulTexMask.tex);

        if (valignMode === 2) vec3.set(vec, 0, height, 0);
        else if (valignMode === 1) vec3.set(vec, 0, 0, 0);
        else if (valignMode === 0) vec3.set(vec, 0, height / 2, 0);

        vec[1] -= lineHeight.get();
        cgl.pushModelMatrix();
        mat4.translate(cgl.mMatrix, cgl.mMatrix, vec);
        if (!disabled)mesh.render(cgl.getShader());

        cgl.popModelMatrix();

        cgl.setTexture(0, null);
        cgl.setPreviousShader();
        cgl.popBlendMode();
    }

    next.trigger();
};

letterSpace.onChange = function ()
{
    createMesh = true;
};


function generateMesh()
{
    const theString = String(str.get() + "");
    if (!textureOut.get()) return;

    const font = getFont();
    if (!font.geom)
    {
        font.geom = new CGL.Geometry("textmesh");

        font.geom.vertices = [
            1.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            1.0, 0.0, 0.0,
            0.0, 0.0, 0.0
        ];

        font.geom.texCoords = new Float32Array([
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ]);

        font.geom.verticesIndices = [
            0, 1, 2,
            2, 1, 3
        ];
    }

    if (!mesh)mesh = new CGL.Mesh(cgl, font.geom);

    const strings = (theString).split("\n");
    outLines.set(strings.length);

    const transformations = [];
    const tcOffsets = [];// new Float32Array(str.get().length*2);
    const tcSize = [];// new Float32Array(str.get().length*2);
    const texPos = [];
    let charCounter = 0;
    createTexture = false;
    const m = mat4.create();

    let maxWidth = 0;

    for (let s = 0; s < strings.length; s++)
    {
        const txt = strings[s];
        const numChars = txt.length;

        let pos = 0;
        let offX = 0;
        let width = 0;

        for (var i = 0; i < numChars; i++)
        {
            const chStr = txt.substring(i, i + 1);
            const char = font.chars[String(chStr)];
            if (char)
            {
                width += (char.texCoordWidth / char.texCoordHeight);
                width += letterSpace.get();
            }
        }


        width -= letterSpace.get();

        height = 0;

        if (align.get() == "left") offX = 0;
        else if (align.get() == "right") offX = width;
        else if (align.get() == "center") offX = width / 2;

        height = (s + 1) * lineHeight.get();

        for (var i = 0; i < numChars; i++)
        {
            const chStr = txt.substring(i, i + 1);
            const char = font.chars[String(chStr)];

            if (!char)
            {
                createTexture = true;
                return;
            }
            else
            {
                texPos.push(pos / width * 0.99 + 0.005, (1.0 - (s / (strings.length - 1))) * 0.99 + 0.005);
                tcOffsets.push(char.texCoordX, 1 - char.texCoordY - char.texCoordHeight);
                tcSize.push(char.texCoordWidth, char.texCoordHeight);

                mat4.identity(m);
                mat4.translate(m, m, [pos - offX, 0 - s * lineHeight.get(), 0]);

                pos += (char.texCoordWidth / char.texCoordHeight) + letterSpace.get();
                maxWidth = Math.max(maxWidth, pos - offX);

                transformations.push(Array.prototype.slice.call(m));

                charCounter++;
            }
        }
    }

    const transMats = [].concat.apply([], transformations);

    disabled = false;
    if (transMats.length == 0)disabled = true;

    mesh.numInstances = transMats.length / 16;

    if (mesh.numInstances == 0)
    {
        disabled = true;
        return;
    }

    outWidth.set(maxWidth * scale.get());
    mesh.setAttribute("instMat", new Float32Array(transMats), 16, { "instanced": true });
    mesh.setAttribute("attrTexOffsets", new Float32Array(tcOffsets), 2, { "instanced": true });
    mesh.setAttribute("attrTexSize", new Float32Array(tcSize), 2, { "instanced": true });
    mesh.setAttribute("attrTexPos", new Float32Array(texPos), 2, { "instanced": true });

    createMesh = false;

    if (createTexture) generateTexture();
}

function printChars(fontSize, simulate)
{
    const font = getFont();
    if (!simulate) font.chars = {};

    const ctx = font.ctx;

    ctx.font = fontSize + "px " + inFont.get();
    ctx.textAlign = "left";

    var posy = 0, i = 0;
    let posx = 0;
    const lineHeight = fontSize * 1.4;
    const result =
        {
            "fits": true
        };

    for (var i = 0; i < font.characters.length; i++)
    {
        const chStr = String(font.characters.substring(i, i + 1));
        const chWidth = (ctx.measureText(chStr).width);

        if (posx + chWidth >= textureSize)
        {
            posy += lineHeight + 2;
            posx = 0;
        }

        if (!simulate)
        {
            font.chars[chStr] =
                {
                    "str": chStr,
                    "texCoordX": posx / textureSize,
                    "texCoordY": posy / textureSize,
                    "texCoordWidth": chWidth / textureSize,
                    "texCoordHeight": lineHeight / textureSize,
                };

            ctx.fillText(chStr, posx, posy + fontSize);
        }

        posx += chWidth + 12;
    }

    if (posy > textureSize - lineHeight)
    {
        result.fits = false;
    }

    result.spaceLeft = textureSize - posy;

    return result;
}


function generateTexture()
{
    let filter = CGL.Texture.FILTER_LINEAR;
    if (tfilter.get() == "nearest") filter = CGL.Texture.FILTER_NEAREST;
    if (tfilter.get() == "mipmap") filter = CGL.Texture.FILTER_MIPMAP;

    const font = getFont();
    let string = String(str.get());
    if (string == null || string == undefined)string = "";
    for (let i = 0; i < string.length; i++)
    {
        const ch = string.substring(i, i + 1);
        if (font.characters.indexOf(ch) == -1)
        {
            font.characters += ch;
            createTexture = true;
        }
    }

    const ctx = font.ctx;
    font.canvas.width = font.canvas.height = textureSize;

    if (!font.texture)
        font.texture = CGL.Texture.createFromImage(cgl, font.canvas,
            {
                "filter": filter,
                "anisotropic": parseFloat(aniso.get())
            });

    font.texture.setSize(textureSize, textureSize);

    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, textureSize, textureSize);
    ctx.fillStyle = "rgba(255,255,255,255)";

    let fontSize = font.fontSize + 40;
    let simu = printChars(fontSize, true);

    while (!simu.fits)
    {
        fontSize -= 5;
        simu = printChars(fontSize, true);
    }

    printChars(fontSize, false);

    ctx.restore();

    font.texture.initTexture(font.canvas, filter);
    font.texture.unpackAlpha = true;
    textureOut.set(font.texture);

    font.lastChange = CABLES.now();

    createMesh = true;
    createTexture = false;
}


};

Ops.Gl.Meshes.TextMesh_v2.prototype = new CABLES.Op();
CABLES.OPS["2390f6b3-2122-412e-8c8d-5c2f574e8bd1"]={f:Ops.Gl.Meshes.TextMesh_v2,objName:"Ops.Gl.Meshes.TextMesh_v2"};




// **************************************************************
// 
// Ops.Gl.Shader.MatCapMaterialNew_v3
// 
// **************************************************************

Ops.Gl.Shader.MatCapMaterialNew_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={matcap_frag:"{{MODULES_HEAD}}\n\n#ifdef HAS_TEXTURES\n    IN vec2 texCoord;\n#endif\n\nIN vec3 transformedNormal;\nIN vec3 viewSpacePosition;\n\nUNI vec4 inColor;\n\nUNI sampler2D texMatcap;\n\n#ifdef HAS_DIFFUSE_TEXTURE\n   UNI sampler2D texDiffuse;\n#endif\n\n#ifdef USE_SPECULAR_TEXTURE\n   UNI sampler2D texSpec;\n   UNI sampler2D texSpecMatCap;\n#endif\n\n#ifdef HAS_AO_TEXTURE\n    UNI sampler2D texAo;\n    UNI float aoIntensity;\n#endif\n\n#ifdef HAS_NORMAL_TEXTURE\n    IN vec3 vBiTangent;\n    IN vec3 vTangent;\n    IN mat3 normalMatrix;\n\n    UNI sampler2D texNormal;\n    UNI float normalMapIntensity;\n#endif\n\n#ifdef HAS_TEXTURE_OPACITY\n    UNI sampler2D texOpacity;\n#endif\n\n#ifdef CALC_SSNORMALS\n    IN vec3 eye_relative_pos;\n\n    // from https://www.enkisoftware.com/devlogpost-20150131-1-Normal_generation_in_the_pixel_shader\n    vec3 CalculateScreenSpaceNormals() {\n    \tvec3 dFdxPos = dFdx(eye_relative_pos);\n    \tvec3 dFdyPos = dFdy(eye_relative_pos);\n    \tvec3 screenSpaceNormal = normalize( cross(dFdxPos, dFdyPos));\n        return normalize(screenSpaceNormal);\n    }\n#endif\n\n// * taken & modified from https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderLib/meshmatcap_frag.glsl.js\nvec2 getMatCapUV(vec3 viewSpacePosition, vec3 normal) {\n    vec3 viewDir = normalize(-viewSpacePosition);\n\tvec3 x = normalize(vec3(viewDir.z, 0.0, - viewDir.x));\n\tvec3 y = normalize(cross(viewDir, x));\n\tvec2 uv = vec2(dot(x, normal), dot(y, normal)) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks\n\treturn uv;\n}\n\nvoid main()\n{\n    vec3 viewSpaceNormal = normalize(transformedNormal);\n\n    #ifdef HAS_TEXTURES\n        vec2 texCoords = texCoord;\n        {{MODULE_BEGIN_FRAG}}\n    #endif\n\n\n    #ifdef CALC_SSNORMALS\n        viewSpaceNormal = CalculateScreenSpaceNormals();\n    #endif\n\n\n   #ifdef HAS_NORMAL_TEXTURE\n        vec3 normalFromMap = texture( texNormal, texCoord ).xyz * 2.0 - 1.0;\n        normalFromMap = normalize(normalFromMap);\n\n        vec3 tangent;\n        vec3 binormal;\n\n        #ifdef CALC_TANGENT\n            vec3 c1 = cross(normalFromMap, vec3(0.0, 0.0, 1.0));\n            vec3 c2 = cross(normalFromMap, vec3(0.0, 1.0, 0.0));\n\n            tangent = c1;\n            tangent = normalize(tangent);\n            binormal = cross(viewSpaceNormal, tangent);\n            binormal = normalize(binormal);\n        #endif\n\n        #ifndef CALC_TANGENT\n            tangent = normalize(normalMatrix * vTangent);\n            vec3 bitangent = normalize(normalMatrix * vBiTangent);\n            binormal = normalize(cross(viewSpaceNormal, bitangent));\n        #endif\n\n        normalFromMap = normalize(\n            tangent * normalFromMap.x\n            + binormal * normalFromMap.y\n            + viewSpaceNormal * normalFromMap.z\n        );\n\n        vec3 mixedNormal = normalize(viewSpaceNormal + normalFromMap * normalMapIntensity);\n\n        viewSpaceNormal = mixedNormal;\n    #endif\n\n    vec4 col = texture(texMatcap, getMatCapUV(viewSpacePosition, viewSpaceNormal));\n\n    #ifdef HAS_DIFFUSE_TEXTURE\n        col = col*texture(texDiffuse, texCoords);\n    #endif\n\n    col.rgb *= inColor.rgb;\n\n\n    #ifdef HAS_AO_TEXTURE\n        col = col\n            * mix(\n                vec4(1.0,1.0,1.0,1.0),\n                texture(texAo, texCoords),\n                aoIntensity\n            );\n    #endif\n\n    #ifdef USE_SPECULAR_TEXTURE\n        vec4 spec = texture(texSpecMatCap, getMatCapUV(viewSpacePosition, viewSpaceNormal));\n        spec *= texture(texSpec, texCoords);\n        col += spec;\n    #endif\n\n    col.a *= inColor.a;\n\n    #ifdef HAS_TEXTURE_OPACITY\n        #ifdef TRANSFORMALPHATEXCOORDS\n            texCoords=vec2(texCoord.s,1.0-texCoord.t);\n            texCoords.y = 1. - texCoords.y;\n        #endif\n        #ifdef ALPHA_MASK_ALPHA\n            col.a*=texture(texOpacity,texCoords).a;\n        #endif\n        #ifdef ALPHA_MASK_LUMI\n            col.a*=dot(vec3(0.2126,0.7152,0.0722), texture(texOpacity,texCoords).rgb);\n        #endif\n        #ifdef ALPHA_MASK_R\n            col.a*=texture(texOpacity,texCoords).r;\n        #endif\n        #ifdef ALPHA_MASK_G\n            col.a*=texture(texOpacity,texCoords).g;\n        #endif\n        #ifdef ALPHA_MASK_B\n            col.a*=texture(texOpacity,texCoords).b;\n        #endif\n\n        #ifdef DISCARDTRANS\n            if(col.a < 0.2) discard;\n        #endif\n    #endif\n\n    {{MODULE_COLOR}}\n\n    outColor = col;\n}",matcap_vert:"IN vec3 vPosition;\n\n#ifdef HAS_TEXTURES\n    IN vec2 attrTexCoord;\n#endif\n\nIN vec3 attrVertNormal;\nIN float attrVertIndex;\n\n#ifdef HAS_NORMAL_TEXTURE\n    IN vec3 attrTangent;\n    IN vec3 attrBiTangent;\n    OUT vec3 vBiTangent;\n    OUT vec3 vTangent;\n#endif\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\nUNI vec3 camPos;\n\n#ifdef HAS_TEXTURES\n    UNI vec2 texOffset;\n    UNI vec2 texRepeat;\n    OUT vec2 texCoord;\n#endif\n\nOUT mat3 normalMatrix;\nOUT vec3 viewSpacePosition;\nOUT vec3 transformedNormal;\n\n{{MODULES_HEAD}}\n\n#ifdef CALC_SSNORMALS\n    // from https://www.enkisoftware.com/devlogpost-20150131-1-Normal_generation_in_the_pixel_shader\n    OUT vec3 eye_relative_pos;\n#endif\n\nmat3 transposeMat3(mat3 m) {\n    return mat3(m[0][0], m[1][0], m[2][0],\n        m[0][1], m[1][1], m[2][1],\n        m[0][2], m[1][2], m[2][2]);\n}\n\n mat3 inverseMat3(mat3 m) {\n    float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];\n    float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];\n    float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];\n\n    float b01 = a22 * a11 - a12 * a21;\n    float b11 = -a22 * a10 + a12 * a20;\n    float b21 = a21 * a10 - a11 * a20;\n\n    float det = a00 * b01 + a01 * b11 + a02 * b21;\n\n    return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),\n        b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),\n        b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;\n}\n\nvoid main()\n{\n    #ifdef HAS_TEXTURES\n        texCoord = texRepeat * vec2(attrTexCoord.x, attrTexCoord.y) + texOffset;\n        texCoord.y = 1. - texCoord.y;\n    #endif\n\n    mat4 mMatrix = modelMatrix;\n    mat4 mvMatrix;\n\n    #ifdef HAS_NORMAL_TEXTURE\n        vec3 tangent = attrTangent;\n        vec3 bitangent = attrBiTangent;\n        vTangent = attrTangent;\n        vBiTangent = attrBiTangent;\n    #endif\n\n    vec4 pos = vec4(vPosition, 1.);\n    vec3 norm = attrVertNormal;\n\n    {{MODULE_VERTEX_POSITION}}\n\n    mvMatrix = viewMatrix * mMatrix;\n    vec3 normal = attrVertNormal;\n\n    normalMatrix = transposeMat3(inverseMat3(mat3(mvMatrix)));\n\n    vec3 fragPos = vec3((mvMatrix) * pos);\n    viewSpacePosition = normalize(fragPos);\n\n    #ifdef CALC_SSNORMALS\n        eye_relative_pos = -(vec3(viewMatrix * vec4(camPos, 1.)) - fragPos);\n    #endif\n\n    transformedNormal = normalize(mat3(normalMatrix) * normal);\n\n   gl_Position = projMatrix * mvMatrix * pos;\n\n}",};
const cgl = op.patch.cgl;

const
    render = op.inTrigger("Render"),
    textureMatcap = op.inTexture("MatCap"),
    textureDiffuse = op.inTexture("Diffuse"),
    textureNormal = op.inTexture("Normal"),
    textureSpec = op.inTexture("Specular Mask"),
    textureSpecMatCap = op.inTexture("Specular MatCap"),
    textureAo = op.inTexture("AO Texture"),
    textureOpacity = op.inTexture("Opacity Texture"),
    r = op.inValueSlider("r", 1),
    g = op.inValueSlider("g", 1),
    b = op.inValueSlider("b", 1),
    pOpacity = op.inValueSlider("Opacity", 1),
    aoIntensity = op.inValueSlider("AO Intensity", 1.0),
    normalMapIntensity = op.inFloatSlider("Normal Map Intensity", 1),
    repeatX = op.inValue("Repeat X", 1),
    repeatY = op.inValue("Repeat Y", 1),
    offsetX = op.inValue("Offset X", 0),
    offsetY = op.inValue("Offset Y", 0),
    ssNormals = op.inValueBool("Screen Space Normals"),
    calcTangents = op.inValueBool("Calc normal tangents", true),
    texCoordAlpha = op.inValueBool("Opacity TexCoords Transform", false),
    discardTransPxl = op.inValueBool("Discard Transparent Pixels"),

    next = op.outTrigger("Next"),
    shaderOut = op.outObject("Shader");

r.setUiAttribs({ "colorPick": true });

const alphaMaskSource = op.inSwitch("Alpha Mask Source", ["Luminance", "R", "G", "B", "A"], "Luminance");
alphaMaskSource.setUiAttribs({ "greyout": true });


op.setPortGroup("Texture Opacity", [alphaMaskSource, texCoordAlpha, discardTransPxl]);
op.setPortGroup("Texture Transforms", [aoIntensity, normalMapIntensity, repeatX, repeatY, offsetX, offsetY, calcTangents, ssNormals]);
op.setPortGroup("Texture Maps", [textureDiffuse, textureNormal, textureSpec, textureSpecMatCap, textureAo, textureOpacity]);
op.setPortGroup("Color", [r, g, b, pOpacity]);


const shader = new CGL.Shader(cgl, "MatCapMaterialNew");
const uniOpacity = new CGL.Uniform(shader, "f", "opacity", pOpacity);

shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG"]);
shader.setSource(attachments.matcap_vert, attachments.matcap_frag);
shaderOut.set(shader);

const textureMatcapUniform = new CGL.Uniform(shader, "t", "texMatcap");
let textureDiffuseUniform = null;
let textureNormalUniform = null;
let normalMapIntensityUniform = null;
let textureSpecUniform = null;
let textureSpecMatCapUniform = null;
let textureAoUniform = null;
const offsetUniform = new CGL.Uniform(shader, "2f", "texOffset", offsetX, offsetY);
const repeatUniform = new CGL.Uniform(shader, "2f", "texRepeat", repeatX, repeatY);

const aoIntensityUniform = new CGL.Uniform(shader, "f", "aoIntensity", aoIntensity);
const colorUniform = new CGL.Uniform(shader, "4f", "inColor", r, g, b, pOpacity);

calcTangents.onChange = updateDefines;
updateDefines();

function updateDefines()
{
    if (calcTangents.get()) shader.define("CALC_TANGENT");
    else shader.removeDefine("CALC_TANGENT");
}

ssNormals.onChange = function ()
{
    if (ssNormals.get())
    {
        if (cgl.glVersion < 2)
        {
            cgl.gl.getExtension("OES_standard_derivatives");
            shader.enableExtension("GL_OES_standard_derivatives");
        }

        shader.define("CALC_SSNORMALS");
    }
    else shader.removeDefine("CALC_SSNORMALS");
};

textureMatcap.onChange = updateMatcap;

function updateMatcap()
{
    if (!cgl.defaultMatcapTex)
    {
        const pixels = new Uint8Array(256 * 4);
        for (let x = 0; x < 16; x++)
        {
            for (let y = 0; y < 16; y++)
            {
                let c = y * 16;
                c *= Math.min(1, (x + y / 3) / 8);
                pixels[(x + y * 16) * 4 + 0] = pixels[(x + y * 16) * 4 + 1] = pixels[(x + y * 16) * 4 + 2] = c;
                pixels[(x + y * 16) * 4 + 3] = 255;
            }
        }

        cgl.defaultMatcapTex = new CGL.Texture(cgl);
        cgl.defaultMatcapTex.initFromData(pixels, 16, 16, CGL.Texture.FILTER_LINEAR, CGL.Texture.WRAP_REPEAT);
    }
}

textureDiffuse.onChange = function ()
{
    if (textureDiffuse.get())
    {
        if (textureDiffuseUniform !== null) return;
        shader.define("HAS_DIFFUSE_TEXTURE");
        shader.removeUniform("texDiffuse");
        textureDiffuseUniform = new CGL.Uniform(shader, "t", "texDiffuse");
    }
    else
    {
        shader.removeDefine("HAS_DIFFUSE_TEXTURE");
        shader.removeUniform("texDiffuse");
        textureDiffuseUniform = null;
    }
};

textureNormal.onChange = function ()
{
    if (textureNormal.get())
    {
        if (textureNormalUniform !== null) return;
        shader.define("HAS_NORMAL_TEXTURE");
        shader.removeUniform("texNormal");
        textureNormalUniform = new CGL.Uniform(shader, "t", "texNormal");
        if (!normalMapIntensityUniform) normalMapIntensityUniform = new CGL.Uniform(shader, "f", "normalMapIntensity", normalMapIntensity);
    }
    else
    {
        shader.removeDefine("HAS_NORMAL_TEXTURE");
        shader.removeUniform("texNormal");
        textureNormalUniform = null;
    }
};

textureAo.onChange = function ()
{
    if (textureAo.get())
    {
        if (textureAoUniform !== null) return;
        shader.define("HAS_AO_TEXTURE");
        shader.removeUniform("texAo");
        textureAoUniform = new CGL.Uniform(shader, "t", "texAo");
    }
    else
    {
        shader.removeDefine("HAS_AO_TEXTURE");
        shader.removeUniform("texAo");
        textureAoUniform = null;
    }
};

textureSpec.onChange = textureSpecMatCap.onChange = function ()
{
    if (textureSpec.get() && textureSpecMatCap.get())
    {
        if (textureSpecUniform !== null) return;
        shader.define("USE_SPECULAR_TEXTURE");
        shader.removeUniform("texSpec");
        shader.removeUniform("texSpecMatCap");
        textureSpecUniform = new CGL.Uniform(shader, "t", "texSpec");
        textureSpecMatCapUniform = new CGL.Uniform(shader, "t", "texSpecMatCap");
    }
    else
    {
        shader.removeDefine("USE_SPECULAR_TEXTURE");
        shader.removeUniform("texSpec");
        shader.removeUniform("texSpecMatCap");
        textureSpecUniform = null;
        textureSpecMatCapUniform = null;
    }
};

// TEX OPACITY

function updateAlphaMaskMethod()
{
    if (alphaMaskSource.get() == "Alpha Channel") shader.define("ALPHA_MASK_ALPHA");
    else shader.removeDefine("ALPHA_MASK_ALPHA");

    if (alphaMaskSource.get() == "Luminance") shader.define("ALPHA_MASK_LUMI");
    else shader.removeDefine("ALPHA_MASK_LUMI");

    if (alphaMaskSource.get() == "R") shader.define("ALPHA_MASK_R");
    else shader.removeDefine("ALPHA_MASK_R");

    if (alphaMaskSource.get() == "G") shader.define("ALPHA_MASK_G");
    else shader.removeDefine("ALPHA_MASK_G");

    if (alphaMaskSource.get() == "B") shader.define("ALPHA_MASK_B");
    else shader.removeDefine("ALPHA_MASK_B");
}
alphaMaskSource.onChange = updateAlphaMaskMethod;
textureOpacity.onChange = updateOpacity;

let textureOpacityUniform = null;

function updateOpacity()
{
    if (textureOpacity.get())
    {
        if (textureOpacityUniform !== null) return;
        shader.removeUniform("texOpacity");
        shader.define("HAS_TEXTURE_OPACITY");
        if (!textureOpacityUniform) textureOpacityUniform = new CGL.Uniform(shader, "t", "texOpacity");

        alphaMaskSource.setUiAttribs({ "greyout": false });
        discardTransPxl.setUiAttribs({ "greyout": false });
        texCoordAlpha.setUiAttribs({ "greyout": false });
    }
    else
    {
        shader.removeUniform("texOpacity");
        shader.removeDefine("HAS_TEXTURE_OPACITY");
        textureOpacityUniform = null;

        alphaMaskSource.setUiAttribs({ "greyout": true });
        discardTransPxl.setUiAttribs({ "greyout": true });
        texCoordAlpha.setUiAttribs({ "greyout": true });
    }
    updateAlphaMaskMethod();
}

discardTransPxl.onChange = function ()
{
    if (discardTransPxl.get()) shader.define("DISCARDTRANS");
    else shader.removeDefine("DISCARDTRANS");
};

texCoordAlpha.onChange = function ()
{
    if (texCoordAlpha.get()) shader.define("TRANSFORMALPHATEXCOORDS");
    else shader.removeDefine("TRANSFORMALPHATEXCOORDS");
};


function checkUiErrors()
{
    if (textureSpec.get() && !textureSpecMatCap.get())
    {
        op.setUiError("specNoMatCapSpec", "You connected a specular texture but have not connected a specular matcap texture. You need to connect both texture inputs for the specular input to work.", 1);
        op.setUiError("noSpecMatCapSpec", null);
    }
    else if (!textureSpec.get() && textureSpecMatCap.get())
    {
        op.setUiError("noSpecMatCapSpec", "You connected a specular matcap texture but have not connected a specular texture. You need to connect both texture inputs for the specular input to work.", 1);
        op.setUiError("specNoMatCapSpec", null);
    }
    else if (textureSpec.get() && textureSpecMatCap.get())
    {
        op.setUiError("specNoMatCapSpec", null);
        op.setUiError("noSpecMatCapSpec", null);
    }
    else
    {
        op.setUiError("specNoMatCapSpec", null);
        op.setUiError("noSpecMatCapSpec", null);
    }
}

render.onTriggered = function ()
{
    checkUiErrors();

    if (!cgl.defaultMatcapTex) updateMatcap();
    shader.popTextures();


    const tex = textureMatcap.get() || cgl.defaultMatcapTex;
    shader.pushTexture(textureMatcapUniform, tex.tex);

    if (textureDiffuse.get() && textureDiffuseUniform) shader.pushTexture(textureDiffuseUniform, textureDiffuse.get().tex);
    if (textureNormal.get() && textureNormalUniform) shader.pushTexture(textureNormalUniform, textureNormal.get().tex);
    if (textureSpec.get() && textureSpecUniform) shader.pushTexture(textureSpecUniform, textureSpec.get().tex);
    if (textureSpecMatCap.get() && textureSpecMatCapUniform) shader.pushTexture(textureSpecMatCapUniform, textureSpecMatCap.get().tex);
    if (textureAo.get() && textureAoUniform) shader.pushTexture(textureAoUniform, textureAo.get().tex);
    if (textureOpacity.get() && textureOpacityUniform) shader.pushTexture(textureOpacityUniform, textureOpacity.get().tex);


    cgl.pushShader(shader);
    next.trigger();
    cgl.popShader();
};


};

Ops.Gl.Shader.MatCapMaterialNew_v3.prototype = new CABLES.Op();
CABLES.OPS["c1dd6e76-61b4-471a-b8d1-f550a5a9a4f4"]={f:Ops.Gl.Shader.MatCapMaterialNew_v3,objName:"Ops.Gl.Shader.MatCapMaterialNew_v3"};




// **************************************************************
// 
// Ops.Gl.RandomCluster
// 
// **************************************************************

Ops.Gl.RandomCluster = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTrigger("exe"),
    num = op.inValueInt("num"),
    seed = op.inValueFloat("random seed", 1),
    round = op.inValueBool("round", false),
    size = op.inValueFloat("size", 10),
    scaleX = op.inValueFloat("scaleX", 1),
    scaleY = op.inValueFloat("scaleY", 1),
    scaleZ = op.inValueFloat("scaleZ", 1),
    trigger = op.outTrigger("trigger"),
    idx = op.outValue("index"),
    rnd = op.outValue("rnd"),
    rotX = op.inValueSlider("Rotate X", 1),
    rotY = op.inValueSlider("Rotate Y", 1),
    rotZ = op.inValueSlider("Rotate Z", 1),
    scrollX = op.inValue("Scroll X", 0);

op.setPortGroup("Area", [size, scaleX, scaleY, scaleZ]);
op.setPortGroup("Rotation", [rotX, rotY, rotZ]);
op.setPortGroup("Parameters", [num, round, seed]);
op.toWorkPortsNeedToBeLinked(exe, trigger);

const cgl = op.patch.cgl;
const randoms = [];
const origRandoms = [];
const randomsRot = [];
const randomsFloats = [];

const transVec = vec3.create();
const mat = mat4.create();

function doRender()
{
    if (cgl.shouldDrawHelpers(op))
    {
        CABLES.GL_MARKER.drawCube(op,
            size.get() / 2 * scaleX.get(),
            size.get() / 2 * scaleY.get(),
            size.get() / 2 * scaleZ.get());
    }

    if (scrollX.get() != 0)
    {
        for (let i = 0; i < origRandoms.length; i++)
        {
            randoms[i][0] = origRandoms[i][0] + scrollX.get();
            randoms[i][0] = (randoms[i][0] % size.get()) - (size.get() / 2);
        }
    }

    for (let i = 0; i < randoms.length; i++)
    {
        cgl.pushModelMatrix();

        mat4.translate(cgl.mMatrix, cgl.mMatrix, randoms[i]);

        if (randomsRot[i][0]) mat4.rotateX(cgl.mMatrix, cgl.mMatrix, randomsRot[i][0]);
        if (randomsRot[i][1]) mat4.rotateY(cgl.mMatrix, cgl.mMatrix, randomsRot[i][1]);
        if (randomsRot[i][2]) mat4.rotateZ(cgl.mMatrix, cgl.mMatrix, randomsRot[i][2]);

        idx.set(i);
        rnd.set(randomsFloats[i]);

        trigger.trigger();
        // op.patch.instancing.increment();

        cgl.popModelMatrix();
    }
    // op.patch.instancing.popLoop();
}

exe.onTriggered = doRender;

function getRandomPos()
{
    return vec3.fromValues(
        scaleX.get() * (Math.seededRandom() - 0.5) * size.get(),
        scaleY.get() * (Math.seededRandom() - 0.5) * size.get(),
        scaleZ.get() * (Math.seededRandom() - 0.5) * size.get()
    );
}


function reset()
{
    randoms.length = 0;
    randomsRot.length = 0;
    randomsFloats.length = 0;
    origRandoms.length = 0;

    Math.randomSeed = seed.get();

    const makeRound = round.get();

    for (let i = 0; i < num.get(); i++)
    {
        randomsFloats.push(Math.seededRandom());

        let v = getRandomPos();

        if (makeRound)
            while (vec3.len(v) > size.get() / 2)
                v = getRandomPos();

        origRandoms.push([v[0], v[1], v[2]]);
        randoms.push(v);

        randomsRot.push(vec3.fromValues(
            Math.seededRandom() * 360 * CGL.DEG2RAD * rotX.get(),
            Math.seededRandom() * 360 * CGL.DEG2RAD * rotY.get(),
            Math.seededRandom() * 360 * CGL.DEG2RAD * rotZ.get()
        ));
    }
}

seed.onChange = reset;
num.onChange = reset;
size.onChange = reset;
scaleX.onChange = reset;
scaleZ.onChange = reset;
scaleY.onChange = reset;
round.onChange = reset;
rotX.onChange = reset;
rotY.onChange = reset;
rotZ.onChange = reset;

num.set(100);


};

Ops.Gl.RandomCluster.prototype = new CABLES.Op();
CABLES.OPS["ca3bc984-e596-48fb-b53d-502eb13979b0"]={f:Ops.Gl.RandomCluster,objName:"Ops.Gl.RandomCluster"};




// **************************************************************
// 
// Ops.Gl.Meshes.Rectangle_v2
// 
// **************************************************************

Ops.Gl.Meshes.Rectangle_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render = op.inTrigger("render"),
    trigger = op.outTrigger("trigger"),
    width = op.inValue("width", 1),
    height = op.inValue("height", 1),
    pivotX = op.inSwitch("pivot x", ["left", "center", "right"]),
    pivotY = op.inSwitch("pivot y", ["top", "center", "bottom"]),
    nColumns = op.inValueInt("num columns", 1),
    nRows = op.inValueInt("num rows", 1),
    axis = op.inSwitch("axis", ["xy", "xz"], "xy"),
    active = op.inValueBool("Active", true),
    geomOut = op.outObject("geometry", null, "geometry");

geomOut.ignoreValueSerialize = true;

const cgl = op.patch.cgl;
axis.set("xy");
pivotX.set("center");
pivotY.set("center");

op.setPortGroup("Pivot", [pivotX, pivotY]);
op.setPortGroup("Size", [width, height]);
op.setPortGroup("Structure", [nColumns, nRows]);
op.toWorkPortsNeedToBeLinked(render);


const geom = new CGL.Geometry("rectangle");
let mesh = null;
let needsRebuild = false;

axis.onChange =
    pivotX.onChange =
    pivotY.onChange =
    width.onChange =
    height.onChange =
    nRows.onChange =
    nColumns.onChange = rebuildLater;
rebuild();

function rebuildLater()
{
    needsRebuild = true;
}

op.preRender =
render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;
    if (needsRebuild)rebuild();
    if (active.get() && mesh) mesh.render(cgl.getShader());
    trigger.trigger();
};

function rebuild()
{
    let w = width.get();
    let h = parseFloat(height.get());
    let x = 0;
    let y = 0;

    if (typeof w == "string")w = parseFloat(w);
    if (typeof h == "string")h = parseFloat(h);

    if (pivotX.get() == "center") x = 0;
    else if (pivotX.get() == "right") x = -w / 2;
    else if (pivotX.get() == "left") x = +w / 2;

    if (pivotY.get() == "center") y = 0;
    else if (pivotY.get() == "top") y = -h / 2;
    else if (pivotY.get() == "bottom") y = +h / 2;

    const verts = [];
    const tc = [];
    const norms = [];
    const tangents = [];
    const biTangents = [];
    const indices = [];

    const numRows = Math.round(nRows.get());
    const numColumns = Math.round(nColumns.get());

    const stepColumn = w / numColumns;
    const stepRow = h / numRows;

    let c, r, a;
    a = axis.get();
    for (r = 0; r <= numRows; r++)
    {
        for (c = 0; c <= numColumns; c++)
        {
            verts.push(c * stepColumn - width.get() / 2 + x);
            if (a == "xz") verts.push(0.0);
            verts.push(r * stepRow - height.get() / 2 + y);
            if (a == "xy") verts.push(0.0);

            tc.push(c / numColumns);
            tc.push(1.0 - r / numRows);

            if (a == "xz")
            {
                norms.push(0, 1, 0);
                tangents.push(1, 0, 0);
                biTangents.push(0, 0, 1);
            }
            else if (a == "xy")
            {
                norms.push(0, 0, 1);
                tangents.push(-1, 0, 0);
                biTangents.push(0, -1, 0);
            }
        }
    }

    for (c = 0; c < numColumns; c++)
    {
        for (r = 0; r < numRows; r++)
        {
            const ind = c + (numColumns + 1) * r;
            const v1 = ind;
            const v2 = ind + 1;
            const v3 = ind + numColumns + 1;
            const v4 = ind + 1 + numColumns + 1;

            indices.push(v1);
            indices.push(v3);
            indices.push(v2);

            indices.push(v2);
            indices.push(v3);
            indices.push(v4);
        }
    }

    geom.clear();
    geom.vertices = verts;
    geom.texCoords = tc;
    geom.verticesIndices = indices;
    geom.vertexNormals = norms;
    geom.tangents = tangents;
    geom.biTangents = biTangents;

    if (numColumns * numRows > 64000)geom.unIndex();

    if (!mesh) mesh = new CGL.Mesh(cgl, geom);
    else mesh.setGeom(geom);

    geomOut.set(null);
    geomOut.set(geom);
    needsRebuild = false;
}

op.onDelete = function ()
{
    if (mesh)mesh.dispose();
};


};

Ops.Gl.Meshes.Rectangle_v2.prototype = new CABLES.Op();
CABLES.OPS["fc5718d6-11a5-496e-8f16-1c78b1a2824c"]={f:Ops.Gl.Meshes.Rectangle_v2,objName:"Ops.Gl.Meshes.Rectangle_v2"};




// **************************************************************
// 
// Ops.Array.ArrayLength
// 
// **************************************************************

Ops.Array.ArrayLength = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    array=op.inArray("array"),
    outLength=op.outValue("length");

outLength.ignoreValueSerialize=true;

function update()
{
    var l=0;
    if(array.get()) l=array.get().length;
    else l=-1;
    outLength.set(l);
}

array.onChange=update;


};

Ops.Array.ArrayLength.prototype = new CABLES.Op();
CABLES.OPS["ea508405-833d-411a-86b4-1a012c135c8a"]={f:Ops.Array.ArrayLength,objName:"Ops.Array.ArrayLength"};




// **************************************************************
// 
// Ops.Gl.TextureArrayLoader
// 
// **************************************************************

Ops.Gl.TextureArrayLoader = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const USE_LEFT_PAD_DEFAULT = false;

// var filename=op.addInPort(new CABLES.Port(op,"file",CABLES.OP_PORT_TYPE_VALUE,{ display:'file',type:'string',filter:'image' } ));
const filename = op.inValueString("url");
const leftPadFilename = op.inValueBool("Left Pad", USE_LEFT_PAD_DEFAULT);
const numberLengthPort = op.inValue("Num Digits", 3);
numberLengthPort.setUiAttribs({ "hidePort": !USE_LEFT_PAD_DEFAULT, "greyout": !USE_LEFT_PAD_DEFAULT });

const indexStart = op.inValueInt("Index Start");
const indexEnd = op.inValueInt("Index End");

const tfilter = op.inValueSelect("filter", ["nearest", "linear", "mipmap"]);
const wrap = op.inValueSelect("wrap", ["repeat", "mirrored repeat", "clamp to edge"], "clamp to edge");
const flip = op.addInPort(new CABLES.Port(op, "flip", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));
const unpackAlpha = op.addInPort(new CABLES.Port(op, "unpackPreMultipliedAlpha", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));

const arrOut = op.outArray("TextureArray");

// var textureOut=op.outTexture("texture");
const width = op.addOutPort(new CABLES.Port(op, "width", CABLES.OP_PORT_TYPE_VALUE));
const height = op.addOutPort(new CABLES.Port(op, "height", CABLES.OP_PORT_TYPE_VALUE));
const loading = op.addOutPort(new CABLES.Port(op, "loading", CABLES.OP_PORT_TYPE_VALUE));
const ratio = op.outValue("Aspect Ratio");

indexEnd.set(10);
flip.set(false);
unpackAlpha.set(false);

const cgl = op.patch.cgl;
let cgl_filter = 0;
let cgl_wrap = 0;

const arr = [];
arrOut.set(arr);

flip.onChange = function () { reload(); };
filename.onChange = reload;

tfilter.onChange = onFilterChange;
wrap.onChange = onWrapChange;
unpackAlpha.onChange = function () { reload(); };

leftPadFilename.onChange = setNumberLengthPortVisibility;

let timedLoader = 0;

function setNumberLengthPortVisibility()
{
    const doLeftPad = leftPadFilename.get();
    numberLengthPort.setUiAttribs({ "hidePort": !doLeftPad, "greyout": !doLeftPad });
}

const setTempTexture = function ()
{
    const t = CGL.Texture.getTempTexture(cgl);
    // textureOut.set(t);
};

function reload(nocache)
{
    clearTimeout(timedLoader);
    timedLoader = setTimeout(function ()
    {
        realReload(nocache);
    }, 30);
}

const REPLACE_CHARACTER = "X";

function pad(value, length)
{
    return (value.toString().length < length) ? pad("0" + value, length) : value;
}

function loadImage(i, nocache)
{
    let url = filename.get();
    if (!url) return;
    const firstXIndex = url.indexOf(REPLACE_CHARACTER);
    const lastXIndex = url.lastIndexOf(REPLACE_CHARACTER);
    if (firstXIndex === -1) { return; }
    const replaceString = url.substring(firstXIndex, lastXIndex + 1);
    let numberString = i;
    if (leftPadFilename.get())
    {
        numberString = pad(i, numberLengthPort.get());
    }
    url = url.replace(replaceString, numberString);
    url = op.patch.getFilePath(url);

    if (nocache)url += "?rnd=" + CABLES.generateUUID();

    if ((filename.get() && filename.get().length > 1))
    {
        loading.set(true);

        var tex = CGL.Texture.load(cgl, url,
            function (err)
            {
                if (err)
                {
                    setTempTexture();
                    op.uiAttr({ "error": "could not load texture \"" + filename.get() + "\"" });
                    return;
                }
                else op.uiAttr({ "error": null });
                // textureOut.set(tex);
                width.set(tex.width);
                height.set(tex.height);
                ratio.set(tex.width / tex.height);

                arr[i - parseInt(indexStart.get())] = tex;
                if (!tex.isPowerOfTwo()) op.uiAttr(
                    {
                        "hint": "texture dimensions not power of two! - texture filtering will not work.",
                        "warning": null
                    });
                else op.uiAttr(
                    {
                        "hint": null,
                        "warning": null
                    });

                // textureOut.set(null);
                // textureOut.set(tex);

                // tex.printInfo();
                arrOut.set(null);
                arrOut.set(arr);
            }, {
                "wrap": cgl_wrap,
                "flip": flip.get(),
                "unpackAlpha": unpackAlpha.get(),
                "filter": cgl_filter
            });

        // textureOut.set(null);
        // textureOut.set(tex);

        // if(!textureOut.get() && nocache)
        // {
        // }
        loading.set(false);
    }
    else
    {
        setTempTexture();
    }
}

function realReload(nocache)
{
    for (var i = 0; i < arr.length; i++)
    {
        if (arr[i])
        {
            arr[i].delete();
        }
    }
    arr.length = 0;
    for (var i = Math.floor(indexStart.get()); i <= Math.floor(indexEnd.get()); i++)
    {
        loadImage(i, nocache);
    }
}

function onFilterChange()
{
    if (tfilter.get() == "nearest") cgl_filter = CGL.Texture.FILTER_NEAREST;
    if (tfilter.get() == "linear") cgl_filter = CGL.Texture.FILTER_LINEAR;
    if (tfilter.get() == "mipmap") cgl_filter = CGL.Texture.FILTER_MIPMAP;

    reload();
}

function onWrapChange()
{
    if (wrap.get() == "repeat") cgl_wrap = CGL.Texture.WRAP_REPEAT;
    if (wrap.get() == "mirrored repeat") cgl_wrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
    if (wrap.get() == "clamp to edge") cgl_wrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reload();
}

op.onFileChanged = function (fn)
{
    // if(filename.get() && filename.get().indexOf(fn)>-1)
    // {
    //     textureOut.set(null);
    //     textureOut.set(CGL.Texture.getTempTexture(cgl));

    //     realReload(true);
    // }
};

tfilter.set("linear");
wrap.set("repeat");


};

Ops.Gl.TextureArrayLoader.prototype = new CABLES.Op();
CABLES.OPS["4ee5bc6d-fd73-4498-8378-6846e57cdd7f"]={f:Ops.Gl.TextureArrayLoader,objName:"Ops.Gl.TextureArrayLoader"};




// **************************************************************
// 
// Ops.Array.ArrayGetTexture
// 
// **************************************************************

Ops.Array.ArrayGetTexture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    array=op.inArray("array"),
    index=op.inValueInt("index"),
    value=op.outObject("value");

var last=null;

array.ignoreValueSerialize=true;
value.ignoreValueSerialize=true;

index.onChange=update;
array.onChange=update;

op.toWorkPortsNeedToBeLinked(array,value);

const emptyTex=CGL.Texture.getEmptyTexture(op.patch.cgl);

function update()
{
    if(index.get()<0)
    {
        value.set( emptyTex);
        return;
    }

    var arr=array.get();
    if(!arr)
    {
        value.set( emptyTex);
        return;
    }

    var ind=index.get();
    if(ind>=arr.length)
    {
        value.set( emptyTex);
        return;
    }
    if(arr[ind])
    {
        value.set(emptyTex);
        value.set(arr[ind]);
        last=arr[ind];
    }
}



};

Ops.Array.ArrayGetTexture.prototype = new CABLES.Op();
CABLES.OPS["afea522b-ab72-4574-b721-5d37f5abaf77"]={f:Ops.Array.ArrayGetTexture,objName:"Ops.Array.ArrayGetTexture"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.ImageCompose_v2
// 
// **************************************************************

Ops.Gl.TextureEffects.ImageCompose_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={imgcomp_frag:"UNI float a;\nvoid main()\n{\n   outColor= vec4(0.0,0.0,0.0,a);\n}\n",};
const
    render = op.inTrigger("Render"),
    useVPSize = op.inBool("Use viewport size", true),
    width = op.inValueInt("Width", 640),
    height = op.inValueInt("Height", 480),
    tfilter = op.inSwitch("Filter", ["nearest", "linear", "mipmap"], "linear"),
    twrap = op.inValueSelect("Wrap", ["clamp to edge", "repeat", "mirrored repeat"], "repeat"),
    fpTexture = op.inValueBool("HDR"),
    inTransp = op.inValueBool("Transparent", false),

    trigger = op.outTrigger("Next"),
    texOut = op.outTexture("texture_out"),
    outRatio = op.outValue("Aspect Ratio");

const cgl = op.patch.cgl;
op.setPortGroup("Texture Size", [useVPSize, width, height]);
op.setPortGroup("Texture Settings", [twrap, tfilter, fpTexture, inTransp]);

texOut.set(CGL.Texture.getEmptyTexture(cgl));
let effect = null;
let tex = null;
let w = 8, h = 8;

const prevViewPort = [0, 0, 0, 0];
let reInitEffect = true;

const bgShader = new CGL.Shader(cgl, "imgcompose bg");
bgShader.setSource(bgShader.getDefaultVertexShader(), attachments.imgcomp_frag);

const uniAlpha = new CGL.Uniform(bgShader, "f", "a", !inTransp.get());

let selectedFilter = CGL.Texture.FILTER_LINEAR;
let selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

const fps = 0;
const fpsStart = 0;

twrap.onChange = onWrapChange;
tfilter.onChange = onFilterChange;

render.onTriggered = op.preRender = doRender;

onFilterChange();
onWrapChange();
updateSizePorts();

inTransp.onChange = () =>
{
    uniAlpha.setValue(!inTransp.get());
};

function initEffect()
{
    if (effect)effect.delete();
    if (tex)tex.delete();

    if (fpTexture.get() && tfilter.get() == "mipmap") op.setUiError("fpmipmap", "Don't use mipmap and HDR at the same time, many systems do not support this.");
    else op.setUiError("fpmipmap", null);

    effect = new CGL.TextureEffect(cgl, { "isFloatingPointTexture": fpTexture.get() });

    tex = new CGL.Texture(cgl,
        {
            "name": "image_compose_v2" + op.id,
            "isFloatingPointTexture": fpTexture.get(),
            "filter": selectedFilter,
            "wrap": selectedWrap,
            "width": Math.ceil(width.get()),
            "height": Math.ceil(height.get()),
        });

    effect.setSourceTexture(tex);
    texOut.set(CGL.Texture.getEmptyTexture(cgl));

    reInitEffect = false;
}

fpTexture.onChange = function ()
{
    reInitEffect = true;
};

function updateResolution()
{
    if (!effect)initEffect();

    if (useVPSize.get())
    {
        w = cgl.getViewPort()[2];
        h = cgl.getViewPort()[3];
    }
    else
    {
        w = Math.ceil(width.get());
        h = Math.ceil(height.get());
    }

    if ((w != tex.width || h != tex.height) && (w !== 0 && h !== 0))
    {
        height.set(h);
        width.set(w);
        tex.setSize(w, h);
        outRatio.set(w / h);
        effect.setSourceTexture(tex);
        texOut.set(CGL.Texture.getEmptyTexture(cgl));
        texOut.set(tex);
    }

    if (texOut.get() && selectedFilter != CGL.Texture.FILTER_NEAREST)
    {
        if (!texOut.get().isPowerOfTwo()) op.setUiError("hintnpot", "texture dimensions not power of two! - texture filtering when scaling will not work on ios devices.", 0);
        else op.setUiError("hintnpot", null, 0);
    }
    else op.setUiError("hintnpot", null, 0);
}

function updateSizePorts()
{
    width.setUiAttribs({ "greyout": useVPSize.get() });
    height.setUiAttribs({ "greyout": useVPSize.get() });
}

useVPSize.onChange = function ()
{
    updateSizePorts();
};

op.preRender = function ()
{
    doRender();
    bgShader.bind();
};

function doRender()
{
    if (!effect || reInitEffect) initEffect();

    const vp = cgl.getViewPort();
    prevViewPort[0] = vp[0];
    prevViewPort[1] = vp[1];
    prevViewPort[2] = vp[2];
    prevViewPort[3] = vp[3];

    cgl.pushBlend(false);

    updateResolution();

    cgl.currentTextureEffect = effect;
    effect.setSourceTexture(tex);

    effect.startEffect();

    cgl.pushShader(bgShader);
    cgl.currentTextureEffect.bind();
    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);
    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();

    texOut.set(effect.getCurrentSourceTexture());

    effect.endEffect();

    cgl.setViewPort(prevViewPort[0], prevViewPort[1], prevViewPort[2], prevViewPort[3]);

    // if(selectedFilter == CGL.Texture.FILTER_MIPMAP)
    // {
    // fps++;

    // if(performance.now()-fpsStart>1000)
    // {
    //     if(fps>10)
    //     {
    //     op.setUiError("manymipmap", "generating mipmaps", 1);
    //     }
    //     else op.setUiError("manymipmap", null, 1);

    //     fps=0;
    //     fpsStart=performance.now();

    // }
    // }

    cgl.popBlend(false);
    cgl.currentTextureEffect = null;
}

function onWrapChange()
{
    if (twrap.get() == "repeat") selectedWrap = CGL.Texture.WRAP_REPEAT;
    if (twrap.get() == "mirrored repeat") selectedWrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
    if (twrap.get() == "clamp to edge") selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reInitEffect = true;
    // updateResolution();
}

function onFilterChange()
{
    if (tfilter.get() == "nearest") selectedFilter = CGL.Texture.FILTER_NEAREST;
    if (tfilter.get() == "linear") selectedFilter = CGL.Texture.FILTER_LINEAR;
    if (tfilter.get() == "mipmap") selectedFilter = CGL.Texture.FILTER_MIPMAP;

    reInitEffect = true;
    // updateResolution();
}


};

Ops.Gl.TextureEffects.ImageCompose_v2.prototype = new CABLES.Op();
CABLES.OPS["a5b43d4c-a9ea-4eaf-9ed0-f257d222659d"]={f:Ops.Gl.TextureEffects.ImageCompose_v2,objName:"Ops.Gl.TextureEffects.ImageCompose_v2"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.DrawImage_v3
// 
// **************************************************************

Ops.Gl.TextureEffects.DrawImage_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={drawimage_frag:"#ifdef HAS_TEXTURES\n    IN vec2 texCoord;\n    UNI sampler2D tex;\n    UNI sampler2D image;\n#endif\n\nIN mat3 transform;\nUNI float rotate;\n\n{{CGL.BLENDMODES}}\n\n#ifdef HAS_TEXTUREALPHA\n   UNI sampler2D imageAlpha;\n#endif\n\nUNI float amount;\n\n#ifdef ASPECT_RATIO\n    UNI float aspectTex;\n    UNI float aspectPos;\n#endif\n\nvoid main()\n{\n    vec4 blendRGBA=vec4(0.0,0.0,0.0,1.0);\n    #ifdef HAS_TEXTURES\n        vec2 tc=texCoord;\n\n        #ifdef TEX_FLIP_X\n            tc.x=1.0-tc.x;\n        #endif\n        #ifdef TEX_FLIP_Y\n            tc.y=1.0-tc.y;\n        #endif\n\n        #ifdef ASPECT_RATIO\n            #ifdef ASPECT_AXIS_X\n                tc.y=(1.0-aspectPos)-(((1.0-aspectPos)-tc.y)*aspectTex);\n            #endif\n            #ifdef ASPECT_AXIS_Y\n                tc.x=(1.0-aspectPos)-(((1.0-aspectPos)-tc.x)/aspectTex);\n            #endif\n        #endif\n\n        #ifdef TEX_TRANSFORM\n            vec3 coordinates=vec3(tc.x, tc.y,1.0);\n            tc=(transform * coordinates ).xy;\n        #endif\n\n        blendRGBA=texture(image,tc);\n\n        vec3 blend=blendRGBA.rgb;\n        vec4 baseRGBA=texture(tex,texCoord);\n        vec3 base=baseRGBA.rgb;\n        vec3 colNew=_blend(base,blend);\n\n        #ifdef REMOVE_ALPHA_SRC\n            blendRGBA.a=1.0;\n        #endif\n\n        #ifdef HAS_TEXTUREALPHA\n            vec4 colImgAlpha=texture(imageAlpha,tc);\n            float colImgAlphaAlpha=colImgAlpha.a;\n\n            #ifdef ALPHA_FROM_LUMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            #ifdef ALPHA_FROM_INV_UMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=1.0-(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            #ifdef INVERT_ALPHA\n                colImgAlphaAlpha=clamp(colImgAlphaAlpha,0.0,1.0);\n                colImgAlphaAlpha=1.0-colImgAlphaAlpha;\n            #endif\n\n            blendRGBA.a=colImgAlphaAlpha*blendRGBA.a;\n        #endif\n    #endif\n\n    float am=amount;\n\n    #ifdef CLIP_REPEAT\n        if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0)\n        {\n            // colNew.rgb=vec3(0.0);\n            am=0.0;\n        }\n    #endif\n\n    #ifdef ASPECT_RATIO\n        #ifdef ASPECT_CROP\n            if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0)\n            {\n                colNew.rgb=base.rgb;\n                am=0.0;\n            }\n\n        #endif\n    #endif\n\n\n\n    // blendRGBA.rgb=mix( colNew, base ,1.0-am);\n\n    // blendRGBA.a=clamp((blendRGBA.a*am),0.,1.);\n\n    blendRGBA.rgb=mix( colNew, base ,1.0-(am*blendRGBA.a));\n    blendRGBA.a=clamp(baseRGBA.a+(blendRGBA.a*am),0.,1.);\n\n\n    outColor= blendRGBA;\n\n}\n\n",drawimage_vert:"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\n\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nUNI float posX;\nUNI float posY;\nUNI float scaleX;\nUNI float scaleY;\nUNI float rotate;\n\nOUT vec2 texCoord;\nOUT vec3 norm;\nOUT mat3 transform;\n\nvoid main()\n{\n   texCoord=attrTexCoord;\n   norm=attrVertNormal;\n\n   #ifdef TEX_TRANSFORM\n        vec3 coordinates=vec3(attrTexCoord.x, attrTexCoord.y,1.0);\n        float angle = radians( rotate );\n        vec2 scale= vec2(scaleX,scaleY);\n        vec2 translate= vec2(posX,posY);\n\n        transform = mat3(   scale.x * cos( angle ), scale.x * sin( angle ), 0.0,\n            - scale.y * sin( angle ), scale.y * cos( angle ), 0.0,\n            - 0.5 * scale.x * cos( angle ) + 0.5 * scale.y * sin( angle ) - 0.5 * translate.x*2.0 + 0.5,  - 0.5 * scale.x * sin( angle ) - 0.5 * scale.y * cos( angle ) - 0.5 * translate.y*2.0 + 0.5, 1.0);\n   #endif\n\n   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);\n}\n",};
const render = op.inTrigger("render");
const blendMode = CGL.TextureEffect.AddBlendSelect(op, "blendMode");
const amount = op.inValueSlider("amount", 1);

const image = op.inTexture("Image");
const removeAlphaSrc = op.inValueBool("removeAlphaSrc", false);

const imageAlpha = op.inTexture("Mask");
const alphaSrc = op.inValueSelect("Mask Src", ["alpha channel", "luminance", "luminance inv"], "luminance");
const invAlphaChannel = op.inValueBool("Invert alpha channel");

const inAspect = op.inValueBool("Aspect Ratio", false);
const inAspectAxis = op.inValueSelect("Stretch Axis", ["X", "Y"], "X");
const inAspectPos = op.inValueSlider("Position", 0.0);
const inAspectCrop = op.inValueBool("Crop", false);

const trigger = op.outTrigger("trigger");

blendMode.set("normal");
const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "drawimage");

imageAlpha.onLinkChanged = updateAlphaPorts;

op.setPortGroup("Mask", [imageAlpha, alphaSrc, invAlphaChannel]);
op.setPortGroup("Aspect Ratio", [inAspect, inAspectPos, inAspectCrop, inAspectAxis]);

removeAlphaSrc.onChange = updateRemoveAlphaSrc;

function updateAlphaPorts()
{
    if (imageAlpha.isLinked())
    {
        removeAlphaSrc.setUiAttribs({ "greyout": true });
        alphaSrc.setUiAttribs({ "greyout": false });
        invAlphaChannel.setUiAttribs({ "greyout": false });
    }
    else
    {
        removeAlphaSrc.setUiAttribs({ "greyout": false });
        alphaSrc.setUiAttribs({ "greyout": true });
        invAlphaChannel.setUiAttribs({ "greyout": true });
    }
}

op.toWorkPortsNeedToBeLinked(image);

shader.setSource(attachments.drawimage_vert, attachments.drawimage_frag);
const textureUniform = new CGL.Uniform(shader, "t", "tex", 0);
const textureImaghe = new CGL.Uniform(shader, "t", "image", 1);
const textureAlpha = new CGL.Uniform(shader, "t", "imageAlpha", 2);

const uniTexAspect = new CGL.Uniform(shader, "f", "aspectTex", 1);
const uniAspectPos = new CGL.Uniform(shader, "f", "aspectPos", inAspectPos);

invAlphaChannel.onChange = function ()
{
    if (invAlphaChannel.get()) shader.define("INVERT_ALPHA");
    else shader.removeDefine("INVERT_ALPHA");
};

inAspect.onChange = updateAspectRatio;
inAspectCrop.onChange = updateAspectRatio;
inAspectAxis.onChange = updateAspectRatio;
function updateAspectRatio()
{
    shader.removeDefine("ASPECT_AXIS_X");
    shader.removeDefine("ASPECT_AXIS_Y");

    if (inAspect.get())
    {
        shader.define("ASPECT_RATIO");

        if (inAspectCrop.get()) shader.define("ASPECT_CROP");
        else shader.removeDefine("ASPECT_CROP");

        if (inAspectAxis.get() == "X") shader.define("ASPECT_AXIS_X");
        if (inAspectAxis.get() == "Y") shader.define("ASPECT_AXIS_Y");

        inAspectPos.setUiAttribs({ "greyout": false });
        inAspectCrop.setUiAttribs({ "greyout": false });
        inAspectAxis.setUiAttribs({ "greyout": false });
    }
    else
    {
        shader.removeDefine("ASPECT_RATIO");
        if (inAspectCrop.get()) shader.define("ASPECT_CROP");
        else shader.removeDefine("ASPECT_CROP");

        if (inAspectAxis.get() == "X") shader.define("ASPECT_AXIS_X");
        if (inAspectAxis.get() == "Y") shader.define("ASPECT_AXIS_Y");

        inAspectPos.setUiAttribs({ "greyout": true });
        inAspectCrop.setUiAttribs({ "greyout": true });
        inAspectAxis.setUiAttribs({ "greyout": true });
    }
}

function updateRemoveAlphaSrc()
{
    if (removeAlphaSrc.get()) shader.define("REMOVE_ALPHA_SRC");
    else shader.removeDefine("REMOVE_ALPHA_SRC");
}

alphaSrc.onChange = function ()
{
    shader.toggleDefine("ALPHA_FROM_LUMINANCE", alphaSrc.get() == "luminance");
    shader.toggleDefine("ALPHA_FROM_INV_UMINANCE", alphaSrc.get() == "luminance_inv");
};

alphaSrc.set("alpha channel");

{
    //
    // texture flip
    //
    const flipX = op.inValueBool("flip x");
    const flipY = op.inValueBool("flip y");

    flipX.onChange = function ()
    {
        if (flipX.get()) shader.define("TEX_FLIP_X");
        else shader.removeDefine("TEX_FLIP_X");
    };

    flipY.onChange = function ()
    {
        if (flipY.get()) shader.define("TEX_FLIP_Y");
        else shader.removeDefine("TEX_FLIP_Y");
    };
}

{
    //
    // texture transform
    //

    var doTransform = op.inValueBool("Transform");

    var scaleX = op.inValueSlider("Scale X", 1);
    var scaleY = op.inValueSlider("Scale Y", 1);

    var posX = op.inValue("Position X", 0);
    var posY = op.inValue("Position Y", 0);

    var rotate = op.inValue("Rotation", 0);

    const inClipRepeat = op.inValueBool("Clip Repeat", false);

    inClipRepeat.onChange = updateClip;
    function updateClip()
    {
        if (inClipRepeat.get()) shader.define("CLIP_REPEAT");
        else shader.removeDefine("CLIP_REPEAT");
    }

    const uniScaleX = new CGL.Uniform(shader, "f", "scaleX", scaleX);
    const uniScaleY = new CGL.Uniform(shader, "f", "scaleY", scaleY);

    const uniPosX = new CGL.Uniform(shader, "f", "posX", posX);
    const uniPosY = new CGL.Uniform(shader, "f", "posY", posY);
    const uniRotate = new CGL.Uniform(shader, "f", "rotate", rotate);

    doTransform.onChange = updateTransformPorts;
}

function updateTransformPorts()
{
    shader.toggleDefine("TEX_TRANSFORM", doTransform.get());
    if (doTransform.get())
    {
        // scaleX.setUiAttribs({hidePort:false});
        // scaleY.setUiAttribs({hidePort:false});
        // posX.setUiAttribs({hidePort:false});
        // posY.setUiAttribs({hidePort:false});
        // rotate.setUiAttribs({hidePort:false});

        scaleX.setUiAttribs({ "greyout": false });
        scaleY.setUiAttribs({ "greyout": false });
        posX.setUiAttribs({ "greyout": false });
        posY.setUiAttribs({ "greyout": false });
        rotate.setUiAttribs({ "greyout": false });
    }
    else
    {
        scaleX.setUiAttribs({ "greyout": true });
        scaleY.setUiAttribs({ "greyout": true });
        posX.setUiAttribs({ "greyout": true });
        posY.setUiAttribs({ "greyout": true });
        rotate.setUiAttribs({ "greyout": true });

        // scaleX.setUiAttribs({"hidePort":true});
        // scaleY.setUiAttribs({"hidePort":true});
        // posX.setUiAttribs({"hidePort":true});
        // posY.setUiAttribs({"hidePort":true});
        // rotate.setUiAttribs({"hidePort":true});
    }

    // op.refreshParams();
}

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount);

const amountUniform = new CGL.Uniform(shader, "f", "amount", amount);

imageAlpha.onChange = function ()
{
    if (imageAlpha.get() && imageAlpha.get().tex)
    {
        shader.define("HAS_TEXTUREALPHA");
    }
    else
    {
        shader.removeDefine("HAS_TEXTUREALPHA");
    }
};

function doRender()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    const tex = image.get();
    if (tex && tex.tex && amount.get() > 0.0)
    {
        cgl.pushShader(shader);
        cgl.currentTextureEffect.bind();

        const imgTex = cgl.currentTextureEffect.getCurrentSourceTexture();
        cgl.setTexture(0, imgTex.tex);

        uniTexAspect.setValue(1 / (tex.height / tex.width * imgTex.width / imgTex.height));

        cgl.setTexture(1, tex.tex);
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, image.get().tex );

        if (imageAlpha.get() && imageAlpha.get().tex)
        {
            cgl.setTexture(2, imageAlpha.get().tex);
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, imageAlpha.get().tex );
        }

        // cgl.pushBlend(false);

        cgl.pushBlendMode(CGL.BLEND_NONE, true);

        cgl.currentTextureEffect.finish();
        cgl.popBlendMode();

        // cgl.popBlend();

        cgl.popShader();
    }

    trigger.trigger();
}

render.onTriggered = doRender;
updateTransformPorts();
updateRemoveAlphaSrc();
updateAlphaPorts();
updateAspectRatio();


};

Ops.Gl.TextureEffects.DrawImage_v3.prototype = new CABLES.Op();
CABLES.OPS["8f6b2f15-fcb0-4597-90c0-e5173f2969fe"]={f:Ops.Gl.TextureEffects.DrawImage_v3,objName:"Ops.Gl.TextureEffects.DrawImage_v3"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Desaturate
// 
// **************************************************************

Ops.Gl.TextureEffects.Desaturate = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={desaturate_frag:"\nIN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\n\n#ifdef MASK\n    UNI sampler2D mask;\n#endif\n\nvec3 desaturate(vec3 color, float amount)\n{\n   vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), color));\n   return vec3(mix(color, gray, amount));\n}\n\nvoid main()\n{\n    vec4 col=texture(tex,texCoord);\n\n    float am=amount;\n    #ifdef MASK\n        am*=1.0-texture(mask,texCoord).r;\n        #ifdef INVERTMASK\n        am=1.0-am;\n        #endif\n    #endif\n\n    col.rgb=desaturate(col.rgb,am);\n    outColor= col;\n}",};
const render=op.inTrigger('render');
const trigger=op.outTrigger('trigger');
const amount=op.inValueSlider("amount",1);
const inMask=op.inTexture("Mask");
const invertMask=op.inValueBool("Invert Mask");

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl);

shader.setSource(shader.getDefaultVertexShader(),attachments.desaturate_frag);
var textureUniform=new CGL.Uniform(shader,'t','tex',0);
var masktextureUniform=new CGL.Uniform(shader,'t','mask',1);
var amountUniform=new CGL.Uniform(shader,'f','amount',amount);


invertMask.onChange=function()
{
    if(invertMask.get())shader.define("INVERTMASK");
        else shader.removeDefine("INVERTMASK");

};

inMask.onChange=function()
{
    if(inMask.get())shader.define("MASK");
        else shader.removeDefine("MASK");
};

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

    if(inMask.get()) cgl.setTexture(1, inMask.get().tex );

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.Desaturate.prototype = new CABLES.Op();
CABLES.OPS["340efbd5-be53-4bd5-92ad-8f38d8eeecf1"]={f:Ops.Gl.TextureEffects.Desaturate,objName:"Ops.Gl.TextureEffects.Desaturate"};




// **************************************************************
// 
// Ops.Gl.Texture_v2
// 
// **************************************************************

Ops.Gl.Texture_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    filename = op.inUrl("File", [".jpg", ".png", ".webp", ".jpeg"]),
    tfilter = op.inSwitch("Filter", ["nearest", "linear", "mipmap"]),
    wrap = op.inValueSelect("Wrap", ["repeat", "mirrored repeat", "clamp to edge"], "clamp to edge"),
    aniso = op.inSwitch("Anisotropic", [0, 1, 2, 4, 8, 16], 0),
    flip = op.inValueBool("Flip", false),
    unpackAlpha = op.inValueBool("Pre Multiplied Alpha", false),
    active = op.inValueBool("Active", true),
    textureOut = op.outTexture("Texture"),
    width = op.outValue("Width"),
    height = op.outValue("Height"),
    ratio = op.outValue("Aspect Ratio"),
    loaded = op.outValue("Loaded");

op.setPortGroup("Size", [width, height]);

unpackAlpha.hidePort();

op.toWorkPortsNeedToBeLinked(textureOut);

const cgl = op.patch.cgl;

let loadedFilename = null;
let loadingId = null;
let tex = null;
let cgl_filter = 0;
let cgl_wrap = 0;
let cgl_aniso = 0;
let timedLoader = 0;

filename.onChange = flip.onChange = function () { reloadSoon(); };
aniso.onChange = tfilter.onChange = onFilterChange;
wrap.onChange = onWrapChange;
unpackAlpha.onChange = function () { reloadSoon(); };

loaded.set(false);

tfilter.set("mipmap");
wrap.set("repeat");

textureOut.set(CGL.Texture.getEmptyTexture(cgl));

active.onChange = function ()
{
    if (active.get())
    {
        if (loadedFilename != filename.get()) realReload();
        else textureOut.set(tex);
    }
    else textureOut.set(CGL.Texture.getEmptyTexture(cgl));
};

const setTempTexture = function ()
{
    const t = CGL.Texture.getTempTexture(cgl);
    textureOut.set(t);
};

function reloadSoon(nocache)
{
    clearTimeout(timedLoader);
    timedLoader = setTimeout(function ()
    {
        realReload(nocache);
    }, 30);
}

function realReload(nocache)
{
    if (!active.get()) return;
    // if (filename.get() === null) return;
    if (!loadingId)loadingId = cgl.patch.loading.start("textureOp", filename.get());

    let url = op.patch.getFilePath(String(filename.get()));

    if (nocache)url += "?rnd=" + CABLES.uuid();

    if (String(filename.get()).indexOf("data:") == 0) url = filename.get();

    loadedFilename = filename.get();

    if ((filename.get() && filename.get().length > 1))
    {
        loaded.set(false);

        op.setUiAttrib({ "extendTitle": CABLES.basename(url) });
        op.refreshParams();

        cgl.patch.loading.addAssetLoadingTask(() =>
        {
            op.setUiError("urlerror", null);
            if (tex)tex.delete();
            tex = CGL.Texture.load(cgl, url,
                function (err)
                {
                    if (err)
                    {
                        setTempTexture();
                        op.error(err);
                        op.setUiError("urlerror", "could not load texture:<br/>\"" + filename.get() + "\"", 2);
                        cgl.patch.loading.finished(loadingId);
                        return;
                    }

                    textureOut.set(tex);
                    width.set(tex.width);
                    height.set(tex.height);
                    ratio.set(tex.width / tex.height);

                    if (!tex.isPowerOfTwo()) op.setUiError("npot", "Texture dimensions not power of two! - Texture filtering will not work in WebGL 1.", 0);
                    else op.setUiError("npot", null);

                    textureOut.set(null);
                    textureOut.set(tex);

                    loaded.set(true);
                    cgl.patch.loading.finished(loadingId);
                }, {
                    "anisotropic": cgl_aniso,
                    "wrap": cgl_wrap,
                    "flip": flip.get(),
                    "unpackAlpha": unpackAlpha.get(),
                    "filter": cgl_filter
                });

            textureOut.set(null);
            textureOut.set(tex);
        });
    }
    else
    {
        cgl.patch.loading.finished(loadingId);
        setTempTexture();
    }
}

function onFilterChange()
{
    if (tfilter.get() == "nearest") cgl_filter = CGL.Texture.FILTER_NEAREST;
    else if (tfilter.get() == "linear") cgl_filter = CGL.Texture.FILTER_LINEAR;
    else if (tfilter.get() == "mipmap") cgl_filter = CGL.Texture.FILTER_MIPMAP;
    else if (tfilter.get() == "Anisotropic") cgl_filter = CGL.Texture.FILTER_ANISOTROPIC;

    cgl_aniso = parseFloat(aniso.get());

    reloadSoon();
}

function onWrapChange()
{
    if (wrap.get() == "repeat") cgl_wrap = CGL.Texture.WRAP_REPEAT;
    if (wrap.get() == "mirrored repeat") cgl_wrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
    if (wrap.get() == "clamp to edge") cgl_wrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reloadSoon();
}

op.onFileChanged = function (fn)
{
    if (filename.get() && filename.get().indexOf(fn) > -1)
    {
        textureOut.set(null);
        textureOut.set(CGL.Texture.getTempTexture(cgl));
        realReload(true);
    }
};


};

Ops.Gl.Texture_v2.prototype = new CABLES.Op();
CABLES.OPS["790f3702-9833-464e-8e37-6f0f813f7e16"]={f:Ops.Gl.Texture_v2,objName:"Ops.Gl.Texture_v2"};




// **************************************************************
// 
// Ops.Gl.Matrix.TransformView
// 
// **************************************************************

Ops.Gl.Matrix.TransformView = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render = op.inTrigger("render"),
    posX = op.inValueFloat("posX"),
    posY = op.inValueFloat("posY"),
    posZ = op.inValueFloat("posZ"),
    scale = op.inValueFloat("scale"),
    rotX = op.inValueFloat("rotX"),
    rotY = op.inValueFloat("rotY"),
    rotZ = op.inValueFloat("rotZ"),
    trigger = op.outTrigger("trigger");

op.setPortGroup("Position", [posX, posY, posZ]);
op.setPortGroup("Scale", [scale]);
op.setPortGroup("Rotation", [rotX, rotZ, rotY]);

const cgl = op.patch.cgl;
const vPos = vec3.create();
const vScale = vec3.create();
const transMatrix = mat4.create();
mat4.identity(transMatrix);

let doScale = false;
let doTranslate = false;

let translationChanged = true;
var scaleChanged = true;
var rotChanged = true;

render.onTriggered = function ()
{
    let updateMatrix = false;
    if (translationChanged)
    {
        updateTranslation();
        updateMatrix = true;
    }
    if (scaleChanged)
    {
        updateScale();
        updateMatrix = true;
    }
    if (rotChanged)
    {
        updateMatrix = true;
    }
    if (updateMatrix)doUpdateMatrix();

    cgl.pushViewMatrix();
    mat4.multiply(cgl.vMatrix, cgl.vMatrix, transMatrix);

    trigger.trigger();
    cgl.popViewMatrix();

    if (op.isCurrentUiOp())
        gui.setTransformGizmo(
            {
                "posX": posX,
                "posY": posY,
                "posZ": posZ,
            });
};

op.transform3d = function ()
{
    return {
        "pos": [posX, posY, posZ]
    };
};

var doUpdateMatrix = function ()
{
    mat4.identity(transMatrix);
    if (doTranslate)mat4.translate(transMatrix, transMatrix, vPos);

    if (rotX.get() !== 0)mat4.rotateX(transMatrix, transMatrix, rotX.get() * CGL.DEG2RAD);
    if (rotY.get() !== 0)mat4.rotateY(transMatrix, transMatrix, rotY.get() * CGL.DEG2RAD);
    if (rotZ.get() !== 0)mat4.rotateZ(transMatrix, transMatrix, rotZ.get() * CGL.DEG2RAD);

    if (doScale)mat4.scale(transMatrix, transMatrix, vScale);
    rotChanged = false;
};

function updateTranslation()
{
    doTranslate = false;
    if (posX.get() !== 0.0 || posY.get() !== 0.0 || posZ.get() !== 0.0) doTranslate = true;
    vec3.set(vPos, posX.get(), posY.get(), posZ.get());
    translationChanged = false;
}

function updateScale()
{
    doScale = false;
    if (scale.get() !== 0.0)doScale = true;
    vec3.set(vScale, scale.get(), scale.get(), scale.get());
    scaleChanged = false;
}

const translateChanged = function ()
{
    translationChanged = true;
};

var scaleChanged = function ()
{
    scaleChanged = true;
};

var rotChanged = function ()
{
    rotChanged = true;
};


rotX.onChange = rotChanged;
rotY.onChange = rotChanged;
rotZ.onChange = rotChanged;

scale.onChange = scaleChanged;

posX.onChange = translateChanged;
posY.onChange = translateChanged;
posZ.onChange = translateChanged;

rotX.set(0.0);
rotY.set(0.0);
rotZ.set(0.0);

scale.set(1.0);

posX.set(0.0);
posY.set(0.0);
posZ.set(0.0);

doUpdateMatrix();


};

Ops.Gl.Matrix.TransformView.prototype = new CABLES.Op();
CABLES.OPS["0b3e04f7-323e-4ac8-8a22-a21e2f36e0e9"]={f:Ops.Gl.Matrix.TransformView,objName:"Ops.Gl.Matrix.TransformView"};




// **************************************************************
// 
// Ops.Gl.Textures.WebcamTexture_v2
// 
// **************************************************************

Ops.Gl.Textures.WebcamTexture_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// todo: https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/facingMode

const
    inFacing = op.inSwitch("Facing", ["environment", "user"], "user"),
    flip = op.inValueBool("flip", true),
    fps = op.inValueInt("fps", 30),
    inActive = op.inValueBool("Genrate Texture", true),

    width = op.inValueInt("Width", 640),
    height = op.inValueInt("Height", 480),

    inAsDOM = op.inValueBool("Show HTML Element", false),
    textureOut = op.outTexture("texture"),
    inCss = op.inStringEditor("CSS", "z-index:99999;position:absolute;"),
    outRatio = op.outValue("Ratio"),
    available = op.outValue("Available"),
    outWidth = op.outNumber("Size Width"),
    outHeight = op.outNumber("Size Height"),
    outError = op.outString("Error"),
    outElement = op.outObject("HTML Element");

op.setPortGroup("Texture", [flip, fps, inActive]);
op.setPortGroup("Video Element", [inAsDOM, inCss]);

width.onChange =
    height.onChange =
    inFacing.onChange = startWebcam;

const cgl = op.patch.cgl;
const videoElement = document.createElement("video");
const eleId = "webcam" + CABLES.uuid();
// videoElement.style.display = "none";
videoElement.setAttribute("id", eleId);
videoElement.setAttribute("autoplay", "");
videoElement.setAttribute("muted", "");
videoElement.setAttribute("playsinline", "");
videoElement.setAttribute("style", inCss.get());
op.patch.cgl.canvas.parentElement.appendChild(videoElement);

const tex = new CGL.Texture(cgl);
tex.setSize(8, 8);
textureOut.set(tex);
let timeout = null;

let canceled = false;

op.onDelete = removeElement;

inAsDOM.onChange =
    inCss.onChange = updateStyle;

updateStyle();

function removeElement()
{
    if (videoElement) videoElement.remove();
    clearTimeout(timeout);
}

function updateStyle()
{
    if (!inAsDOM.get())
        videoElement.setAttribute("style", "display:none;");
    else
        videoElement.setAttribute("style", inCss.get());
}

inActive.onChange = function ()
{
    if (inActive.get())
    {
        canceled = false;
        updateTexture();
    }
    else
    {
        canceled = true;
    }
};

fps.onChange = function ()
{
    if (fps.get() < 1)fps.set(1);
    clearTimeout(timeout);
    timeout = setTimeout(updateTexture, 1000 / fps.get());
};

function updateTexture()
{
    cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, tex.tex);
    cgl.gl.pixelStorei(cgl.gl.UNPACK_FLIP_Y_WEBGL, flip.get());

    cgl.gl.texImage2D(cgl.gl.TEXTURE_2D, 0, cgl.gl.RGBA, cgl.gl.RGBA, cgl.gl.UNSIGNED_BYTE, videoElement);
    cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);

    if (!canceled) timeout = setTimeout(updateTexture, 1000 / fps.get());
}

function camInitComplete(stream)
{
    tex.videoElement = videoElement;
    outElement.set(videoElement);
    // videoElement.src = window.URL.createObjectURL(stream);
    videoElement.srcObject = stream;
    // tex.videoElement=stream;
    videoElement.onloadedmetadata = function (e)
    {
        available.set(true);

        outHeight.set(videoElement.videoHeight);
        outWidth.set(videoElement.videoWidth);

        tex.setSize(videoElement.videoWidth, videoElement.videoHeight);

        outRatio.set(videoElement.videoWidth / videoElement.videoHeight);
        outError.set("");
        videoElement.play();
        updateTexture();
    };
}

function startWebcam()
{
    // removeElement();
    const constraints = { "audio": false, "video": {} };

    constraints.video.facingMode = inFacing.get();
    constraints.video.width = width.get();
    constraints.video.height = height.get();

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    // navigator.mediaDevices.getUserMedia ||

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(camInitComplete)
            .catch(function (error)
            {
                op.error(error.name + ": " + error.message);
                outError.set(error.name + ": " + error.message);
            });
    }
    else
    if (navigator.getUserMedia)
    {
        navigator.getUserMedia(constraints, camInitComplete,
            function ()
            {
                available.set(false);
            });
    }
}

startWebcam();


};

Ops.Gl.Textures.WebcamTexture_v2.prototype = new CABLES.Op();
CABLES.OPS["a448ac68-4edc-4129-aa41-607ed58e5820"]={f:Ops.Gl.Textures.WebcamTexture_v2,objName:"Ops.Gl.Textures.WebcamTexture_v2"};




// **************************************************************
// 
// Ops.Boolean.IfTrueThen_v2
// 
// **************************************************************

Ops.Boolean.IfTrueThen_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe=op.inTrigger("exe"),
    boolean=op.inValueBool("boolean",false),
    triggerThen=op.outTrigger("then"),
    triggerElse=op.outTrigger("else");

exe.onTriggered=exec;

function exec()
{
    if(boolean.get()) triggerThen.trigger();
    else triggerElse.trigger();
}



};

Ops.Boolean.IfTrueThen_v2.prototype = new CABLES.Op();
CABLES.OPS["9549e2ed-a544-4d33-a672-05c7854ccf5d"]={f:Ops.Boolean.IfTrueThen_v2,objName:"Ops.Boolean.IfTrueThen_v2"};




// **************************************************************
// 
// Ops.WebAudio.AudioPlayer_v2
// 
// **************************************************************

Ops.WebAudio.AudioPlayer_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const self = this;
const patch = this.patch;

this.file = op.inUrl("File", "audio");
const play = op.inBool("Play", false);
const autoPlay = op.inBool("Autoplay", false);

const volume = op.inFloatSlider("Volume", 1.0);
const synchronizedPlayer = op.inBool("Synchronized Player", false);

this.audioOut = this.addOutPort(new CABLES.Port(this, "Audio out", CABLES.OP_PORT_TYPE_OBJECT));
const outPlaying = this.addOutPort(new CABLES.Port(this, "Playing", CABLES.OP_PORT_TYPE_VALUE));
const outEnded = this.addOutPort(new CABLES.Port(this, "Ended", CABLES.OP_PORT_TYPE_FUNCTION));

const doLoop = op.inBool("Loop", false);

autoPlay.set(true);

outPlaying.ignoreValueSerialize = true;
outEnded.ignoreValueSerialize = true;

window.AudioContext = window.AudioContext || window.webkitAudioContext;
if (!window.audioContext) window.audioContext = new AudioContext();

if (!window.audioContext)
{
    if (this.patch.config.onError) this.patch.config.onError("sorry, could not initialize WebAudio. Please check if your Browser supports WebAudio");
}

this.filter = audioContext.createGain();
self.audio = null;
let buffer = null;
let playing = false;
outPlaying.set(false);


play.onChange = function ()
{
    if (!self.audio)
    {
        op.uiAttr({ "error": "No audio file selected" });
        return;
    }
    else op.uiAttr({ "error": null });


    if (play.get())
    {
        playing = true;
        const prom = self.audio.play();
        if (prom instanceof Promise)
            prom.then(null, function (e) {});
    }
    else
    {
        playing = false;
        self.audio.pause();
    }
    outPlaying.set(playing);
};


this.onDelete = function ()
{
    if (self.audio) self.audio.pause();
};


doLoop.onChange = function ()
{
    if (self.audio) self.audio.loop = doLoop.get();
    else if (self.media) self.media.loop = doLoop.get();
};

function seek()
{
    // if(!window.gui && CGL.getLoadingStatus()>=1.0)
    // {
    //     console.log('seek canceled',CGL.getLoadingStatus());
    //     return;
    // }

    if (!synchronizedPlayer.get())
    {
        if (!self.audio) return;

        let prom;
        if (self.patch.timer.isPlaying() && self.audio.paused) prom = self.audio.play();
        else if (!self.patch.timer.isPlaying() && !self.audio.paused) prom = self.audio.pause();

        if (prom instanceof Promise)
            prom.then(null, function (e) {});

        self.audio.currentTime = self.patch.timer.getTime();
    }
    else
    {
        if (buffer === null) return;

        const t = self.patch.timer.getTime();
        if (!isFinite(t))
        {
            return;
            // console.log('not finite time...',t);
            // t=0.0;
        }

        playing = false;

        // console.log('seek.....',self.patch.timer.isPlaying());

        if (self.patch.timer.isPlaying())
        {
            console.log("play!");
            outPlaying.set(true);

            self.media.start(t);
            playing = true;
        }
    }
}

function playPause()
{
    if (!self.audio) return;

    let prom;
    if (self.patch.timer.isPlaying()) prom = self.audio.play();
    else prom = self.audio.pause();
    if (prom instanceof Promise)
        prom.then(null, function (e) {});
}

function updateVolume()
{
    // self.filter.gain.value=(volume.get() || 0)*op.patch.config.masterVolume;
    self.filter.gain.setValueAtTime((volume.get() || 0) * op.patch.config.masterVolume, window.audioContext.currentTime);
}

volume.onChange = updateVolume;
op.onMasterVolumeChanged = updateVolume;

const firstTime = true;
let loadingFilename = "";
this.file.onChange = function ()
{
    if (!self.file.get()) return;
    loadingFilename = op.patch.getFilePath(self.file.get());

    const loadingId = patch.loading.start("audioplayer", self.file.get());


    if (!synchronizedPlayer.get())
    {
        if (self.audio)
        {
            self.audio.pause();
            outPlaying.set(false);
        }
        self.audio = new Audio();

        console.log("load audio", self.file.get());

        self.audio.crossOrigin = "anonymous";
        self.audio.src = op.patch.getFilePath(self.file.get());
        self.audio.loop = doLoop.get();
        self.audio.crossOrigin = "anonymous";

        var canplaythrough = function ()
        {
            if (autoPlay.get() || play.get())
            {
                const prom = self.audio.play();
                if (prom instanceof Promise)
                    prom.then(null, function (e) {});
            }
            outPlaying.set(true);
            patch.loading.finished(loadingId);
            self.audio.removeEventListener("canplaythrough", canplaythrough, false);
        };

        self.audio.addEventListener("stalled", (err) => { console.log("mediaplayer stalled...", err); patch.loading.finished(loadingId); });
        self.audio.addEventListener("error", (err) => { console.log("mediaplayer error...", err); patch.loading.finished(loadingId); });
        self.audio.addEventListener("abort", (err) => { console.log("mediaplayer abort...", err); patch.loading.finished(loadingId); });
        self.audio.addEventListener("suspend", (err) => { console.log("mediaplayer suspend...", err); patch.loading.finished(loadingId); });


        self.audio.addEventListener("canplaythrough", canplaythrough, false);

        self.audio.addEventListener("ended", function ()
        {
            // console.log('audio player ended...');
            outPlaying.set(false);
            playing = false;
            outEnded.trigger();
        }, false);


        self.media = audioContext.createMediaElementSource(self.audio);
        self.media.connect(self.filter);
        self.audioOut.val = self.filter;
    }
    else
    {
        self.media = audioContext.createBufferSource();
        self.media.loop = doLoop.get();

        const request = new XMLHttpRequest();

        request.open("GET", op.patch.getFilePath(self.file.get()), true);
        request.responseType = "arraybuffer";

        request.onload = function ()
        {
            const audioData = request.response;

            audioContext.decodeAudioData(audioData, function (res)
            {
                buffer = res;
                // console.log('sound load complete');
                self.media.buffer = res;
                self.media.connect(self.filter);
                self.audioOut.val = self.filter;
                self.media.loop = doLoop.get();

                patch.loading.finished(loadingId);

                // if(!window.gui)
                // {
                //     self.media.start(0);
                //     playing=true;
                // }
            });
        };

        request.send();

        self.patch.timer.onPlayPause(seek);
        self.patch.timer.onTimeChange(seek);
    }
};


};

Ops.WebAudio.AudioPlayer_v2.prototype = new CABLES.Op();
CABLES.OPS["23957c3c-963e-48bb-924e-6957be3da858"]={f:Ops.WebAudio.AudioPlayer_v2,objName:"Ops.WebAudio.AudioPlayer_v2"};




// **************************************************************
// 
// Ops.WebAudio.Output
// 
// **************************************************************

Ops.WebAudio.Output = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
op.requirements=[CABLES.Requirements.WEBAUDIO];

var audioCtx = CABLES.WEBAUDIO.createAudioContext(op);

// constants
var VOLUME_DEFAULT = 1.0;
var VOLUME_MIN = 0;
var VOLUME_MAX = 1;

// vars
var gainNode = audioCtx.createGain();
var destinationNode = audioCtx.destination;
gainNode.connect(destinationNode);
var masterVolume = 1;

// inputs
var audioInPort = CABLES.WEBAUDIO.createAudioInPort(op, "Audio In", gainNode);
var volumePort = op.inValueSlider("Volume", VOLUME_DEFAULT);
var mutePort = op.inValueBool("Mute", false);

// functions
// sets the volume, multiplied by master volume
function setVolume() {
    var volume = volumePort.get() * masterVolume;
    if(volume >= VOLUME_MIN && volume <= VOLUME_MAX) {
        // gainNode.gain.value = volume;
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    } else {
        // gainNode.gain.value = VOLUME_DEFAULT * masterVolume;
        gainNode.gain.setValueAtTime(VOLUME_DEFAULT * masterVolume, audioCtx.currentTime);
    }
}

function mute(b) {
    if(b) {
        // gainNode.gain.value = 0;
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    } else {
        setVolume();
    }
}

// change listeners
mutePort.onChange = function() {
    mute(mutePort.get());
};

volumePort.onChange = function() {
    if(mutePort.get()) {
        return;
    }
    setVolume();
};

op.onMasterVolumeChanged = function(v) {
    masterVolume = v;
    setVolume();
};




};

Ops.WebAudio.Output.prototype = new CABLES.Op();
CABLES.OPS["53fdbf4a-bc8d-4c5d-a698-f34fdeb53827"]={f:Ops.WebAudio.Output,objName:"Ops.WebAudio.Output"};


window.addEventListener('load', function(event) {
CABLES.jsLoaded=new Event('CABLES.jsLoaded');
document.dispatchEvent(CABLES.jsLoaded);
});
