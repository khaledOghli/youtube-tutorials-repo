import React, { useContext, useRef, useLayoutEffect } from "react";
import { Plane, Vec2, Vec3 } from "curtainsjs";

import "./style.scss";
import { CurtainsContext } from "../store/reduxStore";

// vertex and fragment shaders
const vs = `
          
    #ifdef GL_ES
    precision mediump float;
    #endif
    
    #define PI 3.14159265359
    
    // those are the mandatory attributes that the lib sets
    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;

    // those are mandatory uniforms that the lib sets and that contain our model view and projection matrix
    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    uniform mat4 planeTextureMatrix;

    // if you want to pass your vertex and texture coords to the fragment shader
    varying vec3 vVertexPosition;
    varying vec2 vTextureCoord;

    varying float vDirection;

    uniform float uDirection;

    void main() {
        vec3 position = aVertexPosition;

        float y = sin((position.x * 0.5 - 0.5) * PI) * uDirection;

        position.y -= y;
        
        gl_Position = uPMatrix * uMVMatrix * vec4(position, 1.0);

        // set the varyings
        vTextureCoord = (planeTextureMatrix * vec4(aTextureCoord, 0., 1.)).xy;
        vVertexPosition = position;

        vDirection = uDirection;
    }
    `;

const fs = `
        
    #ifdef GL_ES
    precision mediump float;
    #endif

    #define PI2 6.28318530718
    #define PI 3.14159265359
    #define S(a,b,n) smoothstep(a,b,n)
    
    // get our varyings
    varying vec3 vVertexPosition;
    varying vec2 vTextureCoord;


    // our texture sampler (default name, to use a different name please refer to the documentation)
    uniform sampler2D planeTexture;
    
    varying float vDirection;

    void main(){
        vec2 uv = vTextureCoord;

        float scale = -abs(vDirection) * 0.8;

        uv = (uv - 0.5) * scale + uv;

        float r = texture2D(planeTexture, vec2(uv.x - vDirection * 0.1, uv.y)).r;
        float g = texture2D(planeTexture, vec2(uv.x - vDirection * 0.4, uv.y)).g;
        float b = texture2D(planeTexture, vec2(uv.x - vDirection * 0.4, uv.y)).b;
        
        gl_FragColor = vec4(r, g, b, 1.0);  
    }
    `;

const WebPlane = ({ url }) => {
  const { state, dispatch } = useContext(CurtainsContext);
  const { scrollEffect } = state;
  const [statePlane, setPlane] = React.useState(null);
  const planeEl = useRef();
  const someRef = useRef({ scrollEffect: 0 });

  useLayoutEffect(() => {
    const curtains = state.curtains;
    // curtains container has been set
    console.log("afaf");
    if (state.container) {
      const planeParams = {
        vertexShader: vs,
        fragmentShader: fs,
        widthSegments: 40,
        heightSegments: 40, // we now have 40*40*6 = 9600 vertices !
        uniforms: {
          direction: {
            name: "uDirection",
            type: "1f",
            value: 0,
          },
        },
      };

      const plane = new Plane(curtains, planeEl.current, planeParams);

      plane
        .onReady(() => {
          // apply parallax on load
          // once everything is ready, display everything
        })
        .onAfterResize(() => {
          // apply new parallax values after resize
        })
        .onRender(() => {
         
          plane.uniforms.direction.value = someRef.current.scrollEffect / 800;
        })
        .onReEnterView(() => {});

      dispatch({
        type: "ADD_PLANE",
        payload: plane,
      });

      // remove plane if we're unmounting the component
      return () => {
        plane.remove();
      };
    }
  }, [state.container, state.curtains, dispatch]);

  React.useEffect(() => {
    someRef.current.scrollEffect = scrollEffect;
  }, [scrollEffect]);

  return (
    <div className="Plane" ref={planeEl}>
      <img
        src={url}
        alt=""
        crossOrigin="anonymous"
        data-sampler="planeTexture"
      />
    </div>
  );
};

export default WebPlane;