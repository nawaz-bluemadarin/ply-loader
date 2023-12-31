import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { useState, useRef, useEffect } from "react";
import './App.css'

function App() {
  const containerRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const mandibularRef = useRef(null);
  const maxillaryRef = useRef(null);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0.15, z: 3 });
  const [currentModel, setCurrentModel] = useState('Mandibular.ply')
  const [showUpper, setShowUpper] = useState(true);
  const [showLower, setShowLower] = useState(true);
  const mandibularModels = ['Mandibular.ply', 'Mandibular2.ply', 'Mandibular3.ply', 'Mandibular4.ply', 'Mandibular5.ply']
  const maxillaryModels = ['Maxillary.ply', 'Maxillary2.ply', 'Maxillary3.ply', 'Maxillary4.ply', 'Maxillary5.ply']
  const init = () => {
    const container = containerRef.current;

    cameraRef.current = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      1,
      15
    );
    cameraRef.current.position.set(0, 0.15, 3);

    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x282828);

    const plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(0.00001, 0.00001),
      new THREE.MeshPhongMaterial({ color: 0x0f0f0f })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.5;
    sceneRef.current.add(plane);

    console.log(currentModel)
    loadPLYModel(`Models/${currentModel}`, 0.02, mandibularRef);
    loadPLYModel("Models/Maxillary.ply", 0.02, maxillaryRef);

    sceneRef.current.add(new THREE.HemisphereLight(0x443333, 0x000));
    addShadowedLight(1, 1, 1, 0xffffff, 1);

    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current.outputEncoding = THREE.sRGBEncoding;
      container.appendChild(rendererRef.current.domElement);
    }

    controlsRef.current = new OrbitControls(
      cameraRef.current,
      rendererRef.current.domElement
    );
    controlsRef.current.minDistance = 2;
    controlsRef.current.maxDistance = 5;

    window.addEventListener("resize", onWindowResize, false);
  };

  const changeModel = (modelIndex) => {
    const mandibularModelPath = `Models/${mandibularModels[modelIndex]}`;
    const maxillaryModelPath = `Models/${maxillaryModels[modelIndex]}`;

    // Remove the current models from the scene
    if (mandibularRef.current) {
      sceneRef.current.remove(mandibularRef.current);
    }
    if (maxillaryRef.current) {
      sceneRef.current.remove(maxillaryRef.current);
    }

    // Load and add the new models
    loadModel(mandibularModelPath);
    loadModel(maxillaryModelPath);

    // Set the current model state
    setCurrentModel(mandibularModels[modelIndex]);
  };

  const loadModel = (modelPath) => {
    const loader = new PLYLoader();
    loader.load(`${modelPath}`, function (geometry) {
      geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({
        vertexColors: THREE.VertexColors
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.multiplyScalar(0.02);
      sceneRef.current.add(mesh);

      // Update the refs
      if (modelPath.includes('Mandibular')) {
        mandibularRef.current = mesh;
      } else if (modelPath.includes('Maxillary')) {
        maxillaryRef.current = mesh;
      }
    });
  };

  const loadPLYModel = (filePath, scale, target) => {
    const loader = new PLYLoader();
    loader.load(filePath, function (geometry) {
      geometry.computeVertexNormals();

      const material = new THREE.MeshStandardMaterial({
        vertexColors: THREE.VertexColors
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.multiplyScalar(scale);
      sceneRef.current.add(mesh);

      if (target === mandibularRef) {
        mandibularRef.current = mesh;
      } else if (target === maxillaryRef) {
        maxillaryRef.current = mesh;
      }
    });
  };

  const addShadowedLight = (x, y, z, color, intensity) => {
    const directionalLight = new THREE.DirectionalLight(color, intensity);
    directionalLight.position.set(x, y, z);
    sceneRef.current.add(directionalLight);
    directionalLight.castShadow = true;
    const d = 1;
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 4;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.bias = -0.001;
  };

  const onWindowResize = () => {
    cameraRef.current.aspect = window.innerWidth / window.innerHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    render();
  };

  const updateCameraPosition = (x, y, z) => {
    setShowUpper(true);
    setShowLower(true);
    setCameraPosition({ x, y, z });
    cameraRef.current.position.set(x, y, z);
    controlsRef.current.target.set(0, 0.15, 0);
    controlsRef.current.update();
    animate();
  };

  const toggleUpper = () => {
    setShowUpper(prev => !prev); // Toggle the value
    setShowLower(false);
  };

  const toggleLower = () => {
    setShowLower(prev => !prev); // Toggle the value
    setShowUpper(false);
  };

  const playAll = () => {
    changeModel(0)
    for (let i = 0; i < mandibularModels.length; i++) {
      setTimeout(()=>{
        changeModel(i)
      },300)
    }
  }

  useEffect(() => {
    if (mandibularRef.current) {
      mandibularRef.current.visible = showLower;
    }
    if (maxillaryRef.current) {
      maxillaryRef.current.visible = showUpper;
    }
  }, [showLower, showUpper]);

  const render = () => {
    rendererRef.current && rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  useEffect(() => {
    cameraRef.current &&
      cameraRef.current.position &&
      cameraRef.current.position.set(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z
      );
  }, [cameraPosition]);

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      init();
      animate();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  return (
    <>
      <div className="App" ref={containerRef}>
        <div
          style={{
            position: "absolute",
            top: "90%",
            left: "80%",
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <button onClick={toggleUpper}>Upper</button>
          <div>
            <button onClick={() => updateCameraPosition(-4, 0.15, 3)}>
              Left
            </button>
            <button onClick={() => updateCameraPosition(0, 0.15, 3)}>
              Center
            </button>
            <button onClick={() => updateCameraPosition(4, 0.15, 3)}>
              Right
            </button>
          </div>
          <button onClick={toggleLower}>Lower</button>
        </div>
        <div
          style={{
            position: "absolute",
            top: "92%",
            right: "75%",
            display: "flex",
            justifyContent: "center",
            flexDirection: "row",
            alignItems: "center",
            gap: '10px'
          }}>
          {mandibularModels.map((model, index) => (
            <button key={model} onClick={() => changeModel(index)}>
              Week {index + 1}
            </button>
          ))}
          <button onClick={() => {
            playAll()
          }}>Play</button>
        </div>
      </div>

    </>
  );
}

export default App;
