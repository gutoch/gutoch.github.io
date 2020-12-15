this.CGL=this.CGL||{},this.CGL.COREMODULES=this.CGL.COREMODULES||{},this.CGL.COREMODULES.Shadermodifier=function(e){var t={};function r(s){if(t[s])return t[s].exports;var i=t[s]={i:s,l:!1,exports:{}};return e[s].call(i.exports,i,i.exports,r),i.l=!0,i.exports}return r.m=e,r.c=t,r.d=function(e,t,s){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(r.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)r.d(s,i,function(t){return e[t]}.bind(null,i));return s},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=0)}([function(e,t,r){"use strict";r.r(t);CGL.ShaderModifier=class{constructor(e,t,r){this._cgl=e,this._name=t,this._origShaders={},this._uniforms=[],this._structUniforms=[],this._definesToggled={},this._defines={},this._mods=[],this._textures=[],this._boundShader=null,this._changedDefines=!0,this._changedUniforms=!0,this._modulesChanged=!1,this.needsTexturePush=!1,this._lastShader=null,1==this._cgl.glVersion&&(this._cgl.gl.getExtension("OES_texture_float"),this._cgl.gl.getExtension("OES_texture_float_linear"),this._cgl.gl.getExtension("OES_texture_half_float"),this._cgl.gl.getExtension("OES_texture_half_float_linear"))}bind(){const e=this._cgl.getShader();if(!e)return;this._boundShader=this._origShaders[e.id];let t=!1;if(this._boundShader&&this._lastShader!=this._boundShader.shader&&(this._boundShader.shader.hasModule(this._mods[0].id)||(t=!0)),(t||!this._boundShader||e.lastCompile!=this._boundShader.lastCompile||this._modulesChanged||e._needsRecompile)&&(this._boundShader&&this._boundShader.shader.dispose(),e._needsRecompile&&e.compile(),this._boundShader=this._origShaders[e.id]={lastCompile:e.lastCompile,orig:e,shader:e.copy()},1==this._cgl.glVersion&&(this._boundShader.shader.enableExtension("GL_OES_standard_derivatives"),this._boundShader.shader.enableExtension("GL_OES_texture_float"),this._boundShader.shader.enableExtension("GL_OES_texture_float_linear"),this._boundShader.shader.enableExtension("GL_OES_texture_half_float"),this._boundShader.shader.enableExtension("GL_OES_texture_half_float_linear")),this._addModulesToShader(this._boundShader.shader),this._updateDefinesShader(this._boundShader.shader),this._updateUniformsShader(this._boundShader.shader)),this._changedDefines&&this._updateDefines(),this._changedUniforms&&this._updateUniforms(),this._cgl.pushShader(this._boundShader.shader),this._boundShader.shader.copyUniformValues(this._boundShader.orig),this.needsTexturePush){for(let e=0;e<this._textures.length;e+=1){const t=this._textures[e][0],r=this._textures[e][1],s=this._textures[e][2];if(this._getUniform(t)){const e=this.getPrefixedName(t),i=this._boundShader.shader.getUniform(e);i&&this._boundShader.shader.pushTexture(i,r,s)}}this.needsTexturePush=!1,this._textures.length=0}this._modulesChanged=!1}unbind(){this._boundShader&&this._cgl.popShader(),this._boundShader=null}_addModulesToShader(e){let t;this._mods.length>1&&(t=this._mods[0]);for(let r=0;r<this._mods.length;r++)e.addModule(this._mods[r],t)}_removeModulesFromShader(e){for(const t in this._origShaders)this._origShaders[t].shader.removeModule(e)}addModule(e){this._mods.push(e),this._modulesChanged=!0}removeModule(e){const t=[];for(let r=0;r<this._mods.length;r++)this._mods[r].title==e&&(this._removeModulesFromShader(this._mods[r]),t.push(r));for(let e=t.length-1;e>=0;e-=1)this._mods.splice(t[e],1);this._modulesChanged=!0}_updateUniformsShader(e){for(let t=0;t<this._uniforms.length;t++){const r=this._uniforms[t],s=this.getPrefixedName(r.name);if(!e.hasUniform(s)&&!r.structName){let t=null;"both"===r.shaderType?(t=e.addUniformBoth(r.type,s,r.v1,r.v2,r.v3,r.v4),t.comment="mod: "+this._name):"frag"===r.shaderType?(t=e.addUniformFrag(r.type,s,r.v1,r.v2,r.v3,r.v4),t.comment="mod: "+this._name):"vert"===r.shaderType&&(t=e.addUniformVert(r.type,s,r.v1,r.v2,r.v3,r.v4),t.comment="mod: "+this._name)}}for(let t=0;t<this._structUniforms.length;t+=1){const r=this._structUniforms[t];let s=r.uniformName,i=r.structName;const n=r.members;r.propertyName;s=this.getPrefixedName(r.uniformName),i=this.getPrefixedName(r.structName),"frag"===r.shaderType&&e.addUniformStructFrag(i,s,n),"vert"===r.shaderType&&e.addUniformStructVert(i,s,n),"both"===r.shaderType&&e.addUniformStructBoth(i,s,n)}}_updateUniforms(){for(const e in this._origShaders)this._updateUniformsShader(this._origShaders[e].shader);this._changedUniforms=!1}_setUniformValue(e,t,r){const s=e.getUniform(t);s&&s.setValue(r)}setUniformValue(e,t){if(!this._getUniform(e))return;const r=this.getPrefixedName(e);for(const e in this._origShaders)this._setUniformValue(this._origShaders[e].shader,r,t)}hasUniform(e){return this._getUniform(e)}_getUniform(e){for(let t=0;t<this._uniforms.length;t++){if(this._uniforms[t].name==e)return this._uniforms[t];if(this._uniforms[t].structName&&this._uniforms[t].propertyName==e)return this._uniforms[t]}return!1}_getStructUniform(e){for(let t=0;t<this._structUniforms.length;t+=1)if(this._structUniforms[t].uniformName===e)return this._structUniforms[t];return null}_isStructUniform(e){for(let t=0;t<this._uniforms.length;t++){if(this._uniforms[t].name==e)return!1;if(this._uniforms[t].structName&&this._uniforms[t].propertyName==e)return!0}return!1}addUniform(e,t,r,s,i,n,o,h,d,a){if(!this._getUniform(t)){let u="both";a&&(u=a),this._uniforms.push({type:e,name:t,v1:r,v2:s,v3:i,v4:n,structUniformName:o,structName:h,propertyName:d,shaderType:u}),this._changedUniforms=!0}}addUniformFrag(e,t,r,s,i,n){this.addUniform(e,t,r,s,i,n,null,null,null,"frag")}addUniformVert(e,t,r,s,i,n){this.addUniform(e,t,r,s,i,n,null,null,null,"vert")}addUniformBoth(e,t,r,s,i,n){this.addUniform(e,t,r,s,i,n,null,null,null,"both")}addUniformStruct(e,t,r,s){for(let i=0;i<r.length;i+=1){const n=r[i];"2i"!==n.type&&"i"!==n.type&&"3i"!==n.type||"both"!==s||console.error("Adding an integer struct member to both shaders can potentially error. Please use different structs for each shader. Error occured in struct:",e," with member:",n.name," of type:",n.type,"."),this._getUniform(t+"."+n.name)||this.addUniform(n.type,t+"."+n.name,n.v1,n.v2,n.v3,n.v4,t,e,n.name,s)}this._getStructUniform(t)||this._structUniforms.push({structName:e,uniformName:t,members:r,shaderType:s})}addUniformStructVert(e,t,r){this.addUniformStruct(e,t,r,"vert")}addUniformStructFrag(e,t,r){this.addUniformStruct(e,t,r,"frag")}addUniformStructBoth(e,t,r){this.addUniformStruct(e,t,r,"both")}pushTexture(e,t,r){if(!t)throw new Error("no texture given to texturestack");this._textures.push([e,t,r]),this.needsTexturePush=!0}_removeUniformFromShader(e,t){t.hasUniform(e)&&t.removeUniform(e)}removeUniform(e){if(this._getUniform(e)){for(let t=this._uniforms.length-1;t>=0;t-=1){const r=e;if(this._uniforms[t].name==e&&!this._uniforms[t].structName){for(const e in this._origShaders)this._removeUniformFromShader(this.getPrefixedName(r),this._origShaders[e].shader);this._uniforms.splice(t,1)}}this._changedUniforms=!0}}removeUniformStruct(e){if(this._getStructUniform(e)){for(let t=this._structUniforms.length-1;t>=0;t-=1){const r=this._structUniforms[t];if(r.uniformName===e){for(const e in this._origShaders)for(let t=0;t<r.members.length;t+=1){const s=r.members[t];this._removeUniformFromShader(this.getPrefixedName(s.name),this._origShaders[e].shader)}this._structUniforms.splice(t,1)}}this._changedUniforms=!0}}getPrefixedName(e){const t=this._mods[0].group;if(void 0!==t)return 0==e.indexOf("MOD_")&&(e="mod"+t+"_"+(e=e.substr("MOD_".length))),e}_updateDefinesShader(e){for(const t in this._defines){const r=this.getPrefixedName(t);null!==this._defines[t]&&void 0!==this._defines[t]?e.define(r,this._defines[t]):e.removeDefine(r)}for(const t in this._definesToggled){const r=this.getPrefixedName(t);e.toggleDefine(r,this._definesToggled[t])}}_updateDefines(){for(const e in this._origShaders)this._updateDefinesShader(this._origShaders[e].shader);this._changedDefines=!1}define(e,t){this._defines[e]=t,this._changedDefines=!0}removeDefine(e){this._defines[e]=null,this._changedDefines=!0}hasDefine(e){return null!==this._defines[e]&&void 0!==this._defines[e]}toggleDefine(e,t){this._changedDefines=!0,this._definesToggled[e]=t}currentShader(){return this._boundShader.shader}dispose(){}}}]).Shadermodifier;