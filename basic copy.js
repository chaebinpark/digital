import * as THREE from '../build/three.module.js';

class App {
    constructor() {
        const divContainer = document.querySelector("#webgl-container"); // ID를 webg1-container에서 webgl-container로 변경
        this._divContainer = divContainer;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        divContainer.appendChild(renderer.domElement);
        this._renderer = renderer;

        const scene = new THREE.Scene();
        this._scene = scene; // 수정: secne -> scene

        this._setupCamera();
        this._setupLight();
        this._setupModel();

        window.onresize = this.resize.bind(this);
        this.resize();

        requestAnimationFrame(this.render.bind(this));
    }

    _setupCamera() {
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;
        const camera = new THREE.PerspectiveCamera(
            45,
            width / height,
            0.1,
            100
        );
    
        // 카메라 위치 조정
        camera.position.set(0, 1, 3); // y축을 높이고 z축으로 이동
        camera.lookAt(0, 0, 0); // 도미노를 바라보도록 설정
    
        this._camera = camera;
    }
    

    _setupLight() {
        const color = 0xffffff;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        this._scene.add(light);
    }

    _setupModel() {
        const dominoWidth = 0.2;
        const dominoHeight = 0.1;
        const dominoDepth = 0.5;
        const spacing = 0.1; // 도미노 간격
    
        // 바닥 생성
        const floorGeometry = new THREE.PlaneGeometry(5, 5); // 크기 조정 가능
        const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, side: THREE.DoubleSide });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2; // 바닥을 수평으로 회전
        this._scene.add(floor);
    
        // 도미노 생성
        for (let i = 0; i < 5; i++) { // 5개의 도미노 생성
            const geometry = new THREE.BoxGeometry(dominoWidth, dominoHeight, dominoDepth);
            const material = new THREE.MeshPhongMaterial({ color: 0x44a88 });
    
            const domino = new THREE.Mesh(geometry, material);
            
            // 도미노 위치 설정
            domino.position.x = i * (dominoWidth + spacing) - (2.5 * dominoWidth); // 중앙에 배치
            domino.position.y = dominoHeight / 2; // 바닥에 닿게 하기 위해 높이 조정
            domino.position.z = 0; // z축 위치
    
            // 도미노를 90도 회전 (좁은 면이 바닥에 닿도록)
            domino.rotation.x = Math.PI / 2; // z축을 기준으로 90도 회전
            domino.rotation.z = Math.PI / 2; // z축을 기준으로 90도 회전

            this._scene.add(domino);
        }
    }
    
    
    

    resize() {
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;

        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(width, height);
    }

    render(time) {
        this._renderer.render(this._scene, this._camera);
        this.update(time);
        requestAnimationFrame(this.render.bind(this));
    }

    update(time) {
        time *= 0.001;
        this._cube.rotation.x = time;
        this._cube.rotation.y = time;
    }
}

window.onload = function() {
    new App();
}
