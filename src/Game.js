import PointerLockControls from './PointerLockControls';
import CannonDebugRenderer from './CannonDebugRenderer';
const Util = require('./Utilities/Funcs');
const TWEEN = require('@tweenjs/tween.js');
import * as TONE from 'tone'

FBXLoader = require('three-fbx-loader');

export default class Game{
    constructor(){
        this.initPhysics()
        this.init()
        this.assLoad()
        setTimeout(this.animate(), 300)
    }

    initPhysics(){
      //Build a Cannon world
      const world = new CANNON.World();
      this.world = world;
      this.world.fixedTimeStep = 1.0/60.0;
      const physicsMaterial = new CANNON.Material("groundMaterial");
      const physicsContactMaterial = new CANNON.ContactMaterial(
                                                              physicsMaterial,
                                                              physicsMaterial,
                                                              { friction:0.9,
                                                                restitution:0.0
                                                              });
      this.world.addContactMaterial(physicsContactMaterial);
      this.world.gravity.set(0, -75, 0);
      this.world.broadphase = new CANNON.NaiveBroadphase();
      this.testMaterial = new CANNON.Material()

      // Cannon Box body
      this.boxx = new CANNON.Box(new CANNON.Vec3(1.5,1.5,1.5))
      this.cube = new CANNON.Body({mass:.3, material: this.testMaterial})
      this.cube.angularDamping = 0.01
      this.cube.linearDamping = 0.01
      this.cube.position.set(-6, 3, -6)
      this.cube.addShape(this.boxx)
      this.world.add(this.cube)

      // Cannon Cam Sphere
      this.sphere = new CANNON.Sphere(2);
      this.camBody = new CANNON.Body({mass: 7, material: physicsMaterial})
      this.camBody.addShape(this.sphere);
      this.camBody.linearDamping = 0.99;
      this.camBody.angularDamping = 0.99;
      this.camBody.position.set(0,5,20)
      this.world.add(this.camBody);

      // Cannon Plane
      this.groundShape = new CANNON.Plane();
      this.groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial });
      this.groundBody.quaternion.setFromAxisAngle( new CANNON.Vec3(1,0,0), -Math.PI/2);
      this.groundBody.addShape(this.groundShape);
      this.groundBody.position.set(0, 0, 0)
      this.groundBody.name = 'ground'
      this.world.add(this.groundBody);
    }

    init(){
      //Initialize a THREE scene with a camera, renderer, and controls
      let blocker = document.getElementById('blocker')
      let instructions = document.getElementById( 'instructions' );
      this.face = document.getElementsByClassName('face fadeIn')
      this.astley = document.getElementsByClassName('astley fadeIn')
      this.winner = document.getElementsByClassName('winner animateWin')
      this.waveform = document.getElementById('waveform')
      this.main = document.getElementById('main')
      this.context = this.waveform.getContext('2d')


      this.scene = new THREE.Scene();
      this.audioLoader = new THREE.AudioLoader()
      this.doorOneIsOpen = false
      this.doorTwoIsOpen = false
      this.noteBlocks = []
      this.scene.background = new THREE.Color(0x282828);
      this.scene.fog = new THREE.FogExp2(0x282828, 0.042)
      this.clock = new THREE.Clock();
      this.camera = new THREE.PerspectiveCamera( 65, window.innerWidth/window.innerHeight, 0.1, 300 );
      this.controls = new PointerLockControls(this.camera, this.camBody);
      instructions.addEventListener( 'click', this.controls.lock, false );
      this.controls.addEventListener( 'lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
      } );
      this.controls.addEventListener( 'unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
      } );
      this.listener = new THREE.AudioListener()
      this.camera.add( this.listener)
      this.scene.add(this.controls.getObject())

      // tone.js oscillator
      this.oscillator = new TONE.Oscillator({type: 'sine', volume: -15}).toMaster()
      this.oscillator.start()
      this.analyser = new TONE.Waveform(256)
      this.oscillator.connect(this.analyser)


      // Hemi Light
      this.hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.5 );
      this.hemiLight.color.setHSL( 0.6, 1, 0.6 );
      this.hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
      this.hemiLight.position.set( 100, 500, 100 );
      this.scene.add( this.hemiLight );

      // Three Box Mesh
      this.boxGeometry = new THREE.BoxGeometry(3,3,3)
      this.material = new THREE.MeshPhongMaterial( { color: 0xff0000 } )
      this.boxMesh = new THREE.Mesh(this.boxGeometry, this.material)
      this.boxMesh.castShadow = true
      this.boxMesh.name = 'box'
      this.boxMesh.isPickedUp = false
      this.scene.add(this.boxMesh)

      // Three Plane Mesh
      this.groundMaterial = new THREE.MeshPhongMaterial({ color: 0x727272, shininess: 0 } );
      this.geometry = new THREE.PlaneGeometry( 10000, 10000, 50, 50 );
      this.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
      this.floor = new THREE.Mesh( this.geometry, this.groundMaterial );
      this.floor.receiveShadow = true;
      this.floor.castShadow = true
      this.scene.add( this.floor );

      // Three Renderer
      this.renderer = new THREE.WebGLRenderer({antialias:true});
      this.renderer.setSize( window.innerWidth, window.innerHeight );
      this.renderer.shadowMap.enabled = true
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
      this.renderer.shadowMap.size = (2048, 2048)

      document.body.appendChild( this.renderer.domElement );

      // waveform visualizer loop

      this.drawLoop = () => {
				let canvasWidth = game.context.canvas.width;
				let canvasHeight = game.context.canvas.height;
				requestAnimationFrame(this.drawLoop);
				game.context.clearRect(0, 0, canvasWidth, canvasHeight);
				let values = game.analyser.getValue();
				game.context.beginPath();
				game.context.lineJoin = "round";
				game.context.lineWidth = 5;
				game.context.strokeStyle = "red";
				game.context.moveTo(0, (values[0] + 1) / 2 * canvasHeight );
				for (var i = 1; i < values.length; i++){
					let val = (values[i] + 1) / 2;
					let x = canvasWidth * (i / (values.length - 1));
					let y = (val + .1) * canvasHeight;
					game.context.lineTo(x, y);
				}
				game.context.stroke();
			}

      // !!!!!---Enable CANNON Debug Renderer---!!!!!
      // this.cannonDebugRenderer = new THREE.CannonDebugRenderer( this.scene, this.world );
    }

    assLoad() {
      const loader = new FBXLoader()
      loader.load( 'https://s3-us-west-2.amazonaws.com/sound-escape/imgs/station.fbx', function ( object ){
        object.traverse( function( children ) {
          Util.color(children)
          if(children.isMesh) {
            children.receiveShadow = true
            children.castShadow = true
          } else if(children.isPointLight) {
            children.castShadow = true
          }
        })

      game.scene.add( object )
      game.object = object
      Util.createColliders()
      game.object.children.push(game.boxMesh)
      })
    }

    animate(){
      const game = this
      // !!!!!---Enable CANNON Debug Renderer---!!!!!
      // game.cannonDebugRenderer.update();

      TWEEN.update()

      game.controls.update(game.clock.getDelta())
      game.renderer.render( game.scene, game.camera );
      if (game.controls.colorChangeMode) {
        game.object.children.forEach((child) => {
          if (child.name.includes('crown')) {
            child.material.color.g = game.camBody.position.x / 6
            child.material.color.r = game.camBody.position.y / 6
            child.material.color.b = game.camBody.position.z / 6
          }
        })
      }


      requestAnimationFrame( function(){
        let intersection, player
        if (game.boxMesh.isPickedUp && game.controls.intersects) {
          game.cube.position.copy(game.boxMesh.position)
          game.cube.quaternion.copy(game.boxMesh.quaternion)
            intersection = game.controls.intersects[0]
            player = game.controls.yawObject.position.x
            if (intersection.point.x > player + 1) {
              game.oscillator.frequency.value = Math.abs((intersection.point.x + intersection.distance / 2) * 60 + 440)
            } else if (intersection.point.x < player - 1) {
              game.oscillator.frequency.value = Math.abs((intersection.point.x - intersection.distance / 2) * 60 + 440)
            } else {
              game.oscillator.frequency.value = Math.abs((intersection.point.x) * 60 + 440)
            }
          } else {
            game.oscillator.frequency.value = Math.abs(game.boxMesh.position.x * 60 + 440)
            game.boxMesh.position.copy(game.cube.position)
            game.boxMesh.quaternion.copy(game.cube.quaternion)
          }
          // console.log(game.oscillator.frequency.value)
        game.world.step(game.world.fixedTimeStep)
        game.animate();
        game.drawLoop()
      } );
    }
  }
