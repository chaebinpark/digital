import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js";
import * as CANNON from "https://cdn.skypack.dev/cannon-es";

class App {
    constructor() {
        const divContainer = document.querySelector("#webgl-container");
        this._divContainer = divContainer;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        divContainer.appendChild(renderer.domElement);
        this._renderer = renderer;

        this._scene = new THREE.Scene();

        this.physicsWorld = this.initPhysics(); // 물리 세계 초기화

        this._setupCamera();
        this._setupLight();
        this._setupModel(); // 모델 설정
        this.responses = []; // 응답을 저장할 배열
        this.dominoes = []; // 도미노 정보를 저장할 배열

        window.onresize = this.resize.bind(this);
        this.resize();

        this.questions = this._initializeQuestions();
        this.currentQuestionIndex = 0;
        this.showQuestion();

        requestAnimationFrame(this.render.bind(this));
    }

    initPhysics() {
        const physicsWorld = new CANNON.World({
            gravity: new CANNON.Vec3(0, -1.1, 0), // 지구 중력
        });
        return physicsWorld;
    }

    _initializeQuestions() {
        return [
            {
                question: "1. 평소 가장 자주 이용하는 SNS 플랫폼은 무엇인가요?",
                options: ["인스타그램", "유튜브", "트위터", "페이스북", "틱톡", "기타"]
            },
            {
                question: "2. 선택하신 플랫폼에서 제공하는 '저장'기능을 자주 이용하십니까? ( ex. 스크랩, 북마크, 저장",
                options: ["전혀 그렇지 않다", "대체로 그렇지 않다", "보통이다", "대체로 그렇다", "매우 그렇다"]
            },
            {
                question: "3. 본인의 휴대폰에 저장된 정보의 갯수 중 가장 많다고 생각이 든 것의 갯수는 몇 개인가요?",
                isOpenEnded: true // 주관식 질문
            },
            {
                question: "4. SNS를 이용하고 웹 서핑을 하면서 자의로 정보를 접하고 수집한다고 느끼는 비율은 어느 정도인가요?",
                options: ["전혀 그렇지 않다", "대체로 그렇지 않다", "보통이다", "대체로 그렇다", "매우 그렇다"]
            },
            {
                question: "언젠간 필요하지 않을까? 라며 정보를 쌓아두고 다시 찾지 못하거나, 그대로 잊은 경험이 있나요?",
                options: ["네", "아니오"]
            },
            {
                question: "6. 습관적으로 새로운 정보를 얻기 위해 무의식적인 새로고침을 여러 번 시도한 적이 있나요?",
                options: ["네", "아니오"]
            },
            {
                question: "7. 당신이 겪은 디지털 공간에서의 '상실'은 어떤 것이었나요? ",
                isOpenEnded: true // 주관식 질문
            },
            {
                question: "8. 알고리즘에 대한 거부감을 느끼시나요? ",
                options: ["네", "아니오"]
            },
            {
                question: "9. 디지털 공간에서 알고리즘에 의한 무력감, 거부감을 느낀 경험이 있다면 자세히 서술해 주세요.",
                isOpenEnded: true // 주관식 질문
            },
        ];
    }
    
    showQuestion() {
        const questionContainer = document.getElementById('questionContainer');
        const currentQuestion = this.questions[this.currentQuestionIndex];
        questionContainer.innerHTML = `<h3>${currentQuestion.question}</h3>`;
        
        if (currentQuestion.isOpenEnded) {
            questionContainer.innerHTML += `
                <textarea rows="3" cols="70" id="openEndedResponse" placeholder="답변을 입력하세요"></textarea>
            `;
        } else {
            const optionsHtml = currentQuestion.options.map((option, index) => `
                <div>
                    <input type="radio" id="option${index}" name="options" value="${option}">
                    <label for="option${index}">${option}</label>
                </div>
            `).join('');
            
            questionContainer.innerHTML += optionsHtml;
        }
    }
    
    nextQuestion() {
        const currentQuestion = this.questions[this.currentQuestionIndex];
        let response = null;
    
        if (currentQuestion.isOpenEnded) {
            response = document.getElementById('openEndedResponse').value;
        } else {
            const selectedOption = document.querySelector('input[name="options"]:checked');
            if (selectedOption) {
                response = selectedOption.value;
            }
        }
    
        // 응답이 없는 경우 경고 메시지를 띄우고 함수 종료
        if (!response) {
            alert("응답을 선택하거나 입력해 주세요.");
            return;
        }
    
        fetch('/submit-response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: currentQuestion.question,
                response: response,
            }),
        })
        .then((res) => {
            if (!res.ok) {
                throw new Error('서버에서 오류가 발생했습니다');
            }
            return res.json();
        })
        .then((data) => {
            console.log(data); // 서버 응답 로그
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex < this.questions.length) {
                this.showQuestion();
                this.dropDomino();
            } else {
                const questionContainer = document.getElementById('questionContainer');
                questionContainer.innerHTML = "<h3>알고리즘 데이터 수집 협조문 </h3><p><br> 지금부터 당신이 알고리즘에 대한 거부감을 느낀다는 답변을 당신의 알고리즘이 학습하게 됩니다. 학습한 결과를 토대로 알고리즘은 평소와 동일하게 사용자의 데이터를 수집합니다. <br> 하지만 사용자의 성향에 맞는 컨텐츠를 추천하는 것이 아니라, 의도적으로 사용자가 알고리즘의 영향을 느끼지 못하게끔 당신의 디지털 공간을 조성한다면 동의하시겠습니까?</p>";
                document.getElementById('nextButton').style.display = 'none';
                document.getElementById('submitButton').style.display = 'block';
                document.getElementById('noButton').style.display = 'block';
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
        
    }

    
    dropDomino() {
        const floorSize = 2.5;

        const randomX = (Math.random() - 0.5) * floorSize * 2;
        const randomZ = (Math.random() - 0.5) * floorSize * 2;

        const newDomino = this._createDomino();
        newDomino.position.set(randomX, 5, randomZ);

        newDomino.rotation.x = Math.PI * Math.random();
        newDomino.rotation.y = Math.PI * Math.random();
        newDomino.rotation.z = Math.PI * Math.random();

        this._scene.add(newDomino);

        const dominoBody = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(randomX, 5, randomZ),
        });
        dominoBody.addShape(new CANNON.Box(new CANNON.Vec3(0.1, 0.25, 0.1)));
        dominoBody.restitution = 0.2;
        this.physicsWorld.addBody(dominoBody);

        this.dominoes.push({
            position: newDomino.position.toArray(),
            rotation: newDomino.rotation.toArray()
        });

        const forceX = (Math.random() - 0.2) * 0.2;
        const forceY = (Math.random() - 0.2) * 0.2;
        dominoBody.applyImpulse(new CANNON.Vec3(forceX, forceY, 0), dominoBody.position);

        this.animateDominoFall(newDomino, dominoBody);
    }

    createDomino(position, rotation) {
        const newDomino = this._createDomino();
        newDomino.position.set(...position);
        newDomino.rotation.set(...rotation);
        this._scene.add(newDomino);
    }

    _createDomino() {
        const dominoWidth = 0.1;
        const dominoHeight = 0.5;
        const dominoDepth = 0.2;
        const geometry = new THREE.BoxGeometry(dominoWidth, dominoHeight, dominoDepth);
        const material = new THREE.MeshPhongMaterial({ color:  0x7dffbb });
        return new THREE.Mesh(geometry, material);
    }

    animateDominoFall(dominoMesh, dominoBody) {
        function update() {
            this.physicsWorld.step(1 / 60);
            dominoMesh.position.copy(dominoBody.position);
            dominoMesh.quaternion.copy(dominoBody.quaternion);

            if (dominoMesh.position.y > 0) {
                requestAnimationFrame(update.bind(this));
            } else {
                dominoMesh.position.y = 0;
            }
        }
        update.call(this);
    }

    _setupCamera() {
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;
        const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
        camera.position.set(0, 1, 4);
        camera.lookAt(0, 0, 0);
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
        // 바닥 생성
        const floorGeometry = new THREE.PlaneGeometry(7, 6); // 크기 조정 가능
        const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x323232, side: THREE.DoubleSide });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2; // 바닥을 수평으로 회전
        this._scene.add(floor);
    
        // 바닥의 물리 바디 생성
        const floorBody = new CANNON.Body({
            type: CANNON.Body.STATIC, // 정적 물체
        });
        floorBody.addShape(new CANNON.Plane()); // 바닥 형태
        floorBody.position.copy(floor.position);
        floorBody.quaternion.copy(floor.quaternion);
        this.physicsWorld.addBody(floorBody); // this.physicsWorld가 초기화된 후에 호출
    }

    resize() {
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;

        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(width, height);
    }

    render(time) {
        this.physicsWorld.step(1 / 60); // 물리 세계 업데이트
        this._renderer.render(this._scene, this._camera);
        requestAnimationFrame(this.render.bind(this));
    }
    // 도미노를 생성하는 메서드 추가

}

window.onload = function() {
    const app = new App();

    fetch('/load-dominoes')
    .then(res => {
        if (!res.ok) {
            throw new Error('서버에서 오류가 발생했습니다: ' + res.statusText);
        }
        return res.json();
    })
    .then(dominoes => {
        dominoes.forEach(domino => {
            app.createDomino(domino.position, domino.rotation); // 도미노 생성 메서드 호출
        });
    })
    .catch(error => {
        console.error('Error:', error);
        alert('도미노를 로드하는 중 오류가 발생했습니다.');
    });

    document.getElementById('nextButton').addEventListener('click', function() {
        app.nextQuestion(); // 다음 질문으로 이동
    });

    // 아래의 코드를 수정합니다.
    document.getElementById('submitButton').addEventListener('click', function() {
        const response = '동의'; // 동의 응답
        submitResponse(response);
    });

    document.getElementById('noButton').addEventListener('click', function() {
        const response = '비동의'; // 비동의 응답
        submitResponse(response);
    });

    function submitResponse(response) {
        fetch('/submit-response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: '알고리즘 데이터 수집 협조문', // 질문 내용 추가
                response: response,
            }),
        })
        .then((res) => {
            if (!res.ok) {
                throw new Error('서버에서 오류가 발생했습니다');
            }
            return res.json();
        })
        .then((data) => {
            alert(data.message); // 서버 응답 메시지 표시
            // 항상 index.html로 이동
            window.location.href = '/'; // 처음 화면으로 돌아가기
        })
        .catch((error) => {
            console.error('Error:', error);
            // 오류 발생 시에도 index.html로 이동
            window.location.href = '/'; // 처음 화면으로 돌아가기
        });
    }
};





