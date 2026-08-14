import React, { useEffect, useRef } from 'react';

export function BackgroundShader() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        function syncSize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
        }
        window.addEventListener('resize', syncSize);
        syncSize();

        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return;

        const vs = `attribute vec2 a_position;
        varying vec2 v_texCoord;
        void main() {
            v_texCoord = a_position * 0.5 + 0.5;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }`;

        const fs = `precision highp float;
        varying vec2 v_texCoord;
        uniform float u_time;
        uniform vec2 u_resolution;

        void main() {
            vec2 uv = v_texCoord;
            vec2 pos = uv * u_resolution / 80.0;
            
            vec2 grid = abs(fract(pos - 0.5) - 0.5) / fwidth(pos);
            float line = min(grid.x, grid.y);
            float gridPattern = 1.0 - min(line, 1.0);
            
            float pulse = 0.5 + 0.5 * sin(u_time * 0.8);
            
            vec3 color = vec3(0.02, 0.04, 0.08);
            color += vec3(0.22, 0.74, 0.97) * gridPattern * 0.06;
            color += vec3(0.22, 0.74, 0.97) * (1.0 - length(uv - 0.5)) * 0.03 * pulse;
            
            gl_FragColor = vec4(color, 1.0);
        }`;

        function compileShader(type, src) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        }

        const prog = gl.createProgram();
        gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vs));
        gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(prog);
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(prog, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const uTime = gl.getUniformLocation(prog, 'u_time');
        const uRes = gl.getUniformLocation(prog, 'u_resolution');

        let animId;
        function render(t) {
            syncSize();
            gl.viewport(0, 0, canvas.width, canvas.height);
            if (uTime) gl.uniform1f(uTime, t * 0.001);
            if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            animId = requestAnimationFrame(render);
        }
        animId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', syncSize);
        };
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full z-0 opacity-40 mix-blend-screen pointer-events-none">
            <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
    );
}
