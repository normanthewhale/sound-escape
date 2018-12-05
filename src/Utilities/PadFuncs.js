import {color} from './Funcs'
const Reflector = require('three-reflector')(THREE)

const globals = {
    isCube: true,
    isFoggy: false,
    isToon: false,
    hasShape: false
}

export default function whichPad(event){
    switch (event.contact.bj.name) {
        case "Pad0Model":
            pad0()
            break;
        case "Pad1Model":
            pad1()
            break;
        case "Pad2Model":
            pad2()
            break;
        case "Pad3Model":
            pad3()
            break;
        case "Pad4Model":
            pad4()
            break;
        case "Pad5Model":
            pad5()
            break;
    }
}

function pad0(){
    game.cube.velocity.y = 50
}


function pad1(){
    if (globals.isCube){
        game.world.bodies[0].shapes[0] = new CANNON.Sphere(2)
        game.scene.children[2].geometry = new THREE.SphereGeometry(2,32,32)
        game.scene.children[2].material = new THREE.MeshToonMaterial({color: 'green', shininess: 32, reflectivity: 10})
        globals.isCube = false
    } else {
        game.world.bodies[0].shapes[0] = new CANNON.Box(new CANNON.Vec3(1.5,1.5,1.5))
        game.scene.children[2].geometry = new THREE.BoxGeometry(3,3,3)
        game.scene.children[2].material = new THREE.MeshPhongMaterial( { color: 0xff0000 } )
        globals.isCube = true
    }
}

function pad2(){
    if (globals.isFoggy){
        for (let i = 0; i < 49; i++) {
            setTimeout(function(){
                game.scene.fog.density = window.game.scene.fog.density - 0.001
            },10 * (i+1))
        }
        globals.isFoggy = false
    } else {
        for (let i = 0; i < 50; i++) {
            setTimeout(function(){
                game.scene.fog.density = window.game.scene.fog.density + 0.001
            },10 * (i+1))
        }
        globals.isFoggy = true
    }
}

function pad3(){
    if (!globals.isToon){
        for (let i = 0; i < game.scene.children[4].children.length; i++) {
            game.scene.children[4].children[i].material = new THREE.MeshToonMaterial({color: 'blue', shininess: 32, reflectivity: 10})
        }
        globals.isToon = true
    } else {
        for (let i = 0; i < game.scene.children[4].children.length; i++) {
            color(game.scene.children[4].children[i])
        }
        globals.isToon = false
    }
}

async function pad4(){
    if (!globals.hasShape){
        globals.hasShape = true
        const mirrorGeometry = new THREE.PlaneGeometry(10,10,1,1)
        const mirror = new Reflector(mirrorGeometry, {color: 0x889999, recursion: 1, clipBias: 0.003, textureWidth: window.innerWidth * window.devicePixelRatio, textureHeight: window.innerHeight * window.devicePixelRatio})
        mirror.applyMatrix( new THREE.Matrix4().makeRotationY( Math.PI / 2 ) );
        mirror.position.set(-5,5,10)
        mirror.name = 'mirror'
        game.scene.add(mirror)
        const random = () => Math.floor(Math.random() * 20 + 1)
        const shapeGeometry = new THREE.TorusKnotGeometry( 2, 0.2, 70, 20, random(), random() )
        const shapeMaterial = new THREE.MeshPhongMaterial( { color: 0xffff00 } )
        const shapeMesh = new THREE.Mesh(shapeGeometry, shapeMaterial)
        shapeMesh.castShadow = true
        shapeMesh.receiveShadow = true
        shapeMesh.position.set(5,8,10)
        shapeMesh.name = 'TorusKnot'
        game.scene.add(shapeMesh)
    } else {
        globals.hasShape = false
        game.scene.traverse(function(obj){
            if (obj.name === 'TorusKnot' || obj.name === 'mirror')
                game.scene.remove(obj)
        })
    }
}

function pad5(){
    console.log("pad 5")
}

