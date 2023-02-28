<template>
    <div>
        <button @click="change()">Start!</button>
        <div id="three" ref="three"></div>
    </div>
</template>

<script>
import * as Three from 'three' 
let camera, scene, renderer; //相机、场景、渲染器

let height = 7; //盒子的高度
let array = []; //存储掉落的盒子所有类型的数组

let geometry1,geometry2; //组成物体的两个几何体
let group; //物体总体

let dropcube; //掉落的新盒子
let currentcube; //物体所在的盒子
let dis = 20; //物体所在盒子和目标盒子之间的距离

let direction = 0; //物体跳的方向，0为向x轴正向，1为z轴负向
let scalex = 1, scaley = 1, scalez = 1; //物体放缩比例
let distance; //物体跳跃的距离
let curve; //物体跳跃曲线
let t = 1; //物体在曲线上的位置比例

let left,right0,right1; //物体跳跃后落点高度的边界判断
let l,r0,r1; //物体掉落的边界判断

let cameraflag = false; //相机是否移动
let dropflag = false; //物体是否掉落
let dir; //物体掉落的方向
let angle = 0; //物体掉落第一阶段的旋转角度
let dropf = false; //物体掉落第二部分
let cubeflag = false; //盒子是否掉落
let shakeflag = 0; //盒子掉落后抖动阶段

let sound; //音频播放
export default {
    data(){
        return{

        }
    },
    mounted(){
        this.init(); //初始化设置
        this.animate(); //动画
    },
    methods:{
        init(){
            //定义相机
            camera = new Three.PerspectiveCamera( 45, 1200/800, 1, 1000);
            camera.position.set(-20, 50, 50);
        
            //定义环境光照和平行光照
            const light = new Three.AmbientLight(0xcccccc);
            const dlight = new Three.DirectionalLight(0xffffff, 0.5);
           
            dlight.castShadow = true;//开启阴影投射
            dlight.position.set(50, 200, 100);

            dlight.shadow.mapSize.width = 1024; // 默认为512，这里增加阴影贴图的清晰度
            dlight.shadow.mapSize.height = 1024;
            dlight.shadow.camera.left = -200; //配置阴影投射范围
            dlight.shadow.camera.right = 200;
            dlight.shadow.camera.top = 200;
            dlight.shadow.camera.bottom = -200;
            dlight.target.position.set(-10, 0, -100);
            //通过相机辅助工具配置阴影范围
            //const cameraHelper = new Three.CameraHelper(dlight.shadow.camera)
            
            //增加音频接收器
            const listener = new Three.AudioListener();
            camera.add(listener);
            
            //加入音频
            sound = new Three.Audio(listener);

            //定义起跳物体各部分 
            geometry1 = new Three.CylinderGeometry( 0.8, 1, 4);
            geometry2 = new Three.SphereGeometry( 0.8 );
            const material = new Three.MeshLambertMaterial( {color: 0x330099} );

            const cylinder = new Three.Mesh( geometry1, material );
            const sphere = new Three.Mesh( geometry2, material );
            
            cylinder.castShadow = true;//开启阴影投影
            sphere.castShadow = true;
           
            cylinder.position.set( 0, 0, 0 );//这里定义各部分在整体里的相对位置
            sphere.position.set( 0, 4.2, 0 );
            //组合成整体的起跳物体
            group = new Three.Group();
            group.add( cylinder );
            group.add( sphere );
            group.position.set(-10, height, 0);
            camera.lookAt( group.position );

            //创建平面接收阴影
            const planeGeometry = new Three.PlaneGeometry( 1000, 1000, 32, 32 );
            const planeMaterial = new Three.MeshStandardMaterial( { color: 0xFFFFCC } )
            const plane = new Three.Mesh( planeGeometry, planeMaterial );
            plane.position.set(0, -3.5, 0)
            plane.rotateOnAxis(new Three.Vector3(1, 0, 0), -Math.PI/2)
            plane.receiveShadow = true;

            //创建三种不同颜色的盒子作为跳跃平台
            const geometry3 = new Three.BoxGeometry( 10, height, 10 );
            const m3 = new Three.MeshPhongMaterial( {color: 0x99CCCC} );
            const m4 = new Three.MeshPhongMaterial( {color: 0xCCBBFF} );
            const m5 = new Three.MeshPhongMaterial( {color: 0xFFB3FF} );
            const cubeA = new Three.Mesh( geometry3, m3 );
            const cubeB = new Three.Mesh( geometry3, m4 );
            const cubeC = new Three.Mesh( geometry3, m5 );
            
            cubeA.castShadow = true;
            cubeB.castShadow = true;
            cubeC.castShadow = true;
            cubeA.receiveShadow = true;
            cubeB.receiveShadow = true;
            cubeC.receiveShadow = true;

            //生成初始化的起跳盒子和目标盒子
            array = [cubeA, cubeB, cubeC];
            currentcube = array[Math.round(Math.random()*2)].clone();
            currentcube.position.set( -10, 0, 0 );
            dropcube = array[Math.round(Math.random()*2)].clone();
            dropcube.position.set(10, 0, 0);

            //创建场景
            scene = new Three.Scene();
            scene.add(light);
            scene.add(dlight);
            scene.add(dlight.target);
            //scene.add(cameraHelper);
            scene.add(group);
            scene.add(plane);
            scene.add(currentcube);
            scene.add(dropcube);        
            
            //渲染
            renderer = new Three.WebGLRenderer();
            renderer.setClearColor(0xffffff, 1);
            renderer.setSize(1200, 800);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = Three.PCFSoftShadowMap;

            document.getElementById("three").appendChild(renderer.domElement);

        },
        animate(){
            //渲染循环
            requestAnimationFrame( this.animate );

            //相机移动动画
            if(cameraflag) {
                if(camera.position.x < currentcube.position.x - 10) {
                    camera.position.x++;
                    camera.lookAt(new Three.Vector3(camera.position.x + 10, camera.position.y - 50, camera.position.z - 50));
                }
                if(camera.position.z > currentcube.position.z + 50) {
                    camera.position.z--;
                    camera.lookAt(new Three.Vector3(camera.position.x + 10, camera.position.y - 50, camera.position.z - 50));
                }
                if(camera.position.x >= currentcube.position.x - 10 && camera.position.z <= currentcube.position.z + 50) {
                    cameraflag = false;
                }
            }

            //物体起跳动画
            if(t < 1) {
                this.moveOnCurve(curve, t);
                t += 0.1;
                if(t >= 1) {
                    this.createNewCube()
                }
            }

            //物体摔倒动画
            if(dropflag) {
                angle += 0.1;
                
                if(!direction) {
                    group.position.x += 0.2*(1 - dir) -0.2 * dir;
                    group.rotateZ( -0.1* (1 - dir) + 0.1 * dir)
                } else {
                    group.position.z -= 0.2*(1 - dir) -0.2 * dir;
                    group.rotateX( -0.1* (1 - dir) + 0.1 * dir)       
                }
                
                if(angle >= Math.PI/2) {
                    dropf = true; 
                    dropflag = false; 
                    angle = 0; 
                }                
            }

            if(dropf) {
                    group.position.y -= 0.2;
                    if(group.position.y <= -2.7) dropf = false;
                }

            //盒子落下动画
            if(cubeflag) {
                
                if(shakeflag == 0) {
                    dropcube.position.y -= 5;
                    if(dropcube.position.y == 0)
                    shakeflag = 1;
                }
                if(shakeflag == 1) {
                    dropcube.position.y += 2;
                    if(dropcube.position.y == 10) {
                        shakeflag = 2;
                    }
                }
                if(shakeflag == 2) {
                    dropcube.position.y -=2;
                    if(dropcube.position.y == 0) {
                        shakeflag = 3;
                    }
                }
                if(shakeflag == 3) {
                    dropcube.position.y += 1.5;
                    if(dropcube.position.y >= 5) {
                        shakeflag = 4;
                    }
                }
                if(shakeflag == 4) {
                    dropcube.position.y -= 1.5;
                    if(dropcube.position.y == 0) {
                        shakeflag = 0;
                        cubeflag = false;
                    }
                }
            }
                
            renderer.render( scene, camera );
        },
        //开始游戏后鼠标操作物体
        change(){
            let interval;
            window.addEventListener('mousedown', (e) => {
                if(sound.isPlaying) sound.stop();//如果有音频播放，则停止
             
                //加载起跳蓄力音频
                const audioLoader = new Three.AudioLoader();
                audioLoader.load('/src/assets/14433.mp3', (buffer) => {
                    sound.setBuffer( buffer );
	                sound.setLoop( false );
	                sound.setVolume( 0.5 );
	                sound.play();
                })
                
                scalex = 1; //物体放缩比例
                scaley = 1; 
                scalez = 1;
                distance = 0; //物体跳的距离

                //物体将会随着鼠标点击而压缩以及增加跳的距离
                interval = setInterval(() => {
                    geometry1.scale(1.05, 0.95, 1.05);
                    geometry2.scale(1.05, 0.95, 1.05);
                    distance += 3;
                    scalex *= 1.05;
                    scaley *= 0.95;
                    scalez *= 1.05; 
                    }, 200);
            })

            window.addEventListener('mouseup', (e) => {
                clearInterval(interval);//清除setInterval
                sound.stop();//停止播放蓄力音乐
                //物体恢复原样
                geometry1.scale(1/scalex, 1/scaley, 1/scalez);
                geometry2.scale(1/scalex, 1/scaley, 1/scalez);
                //这个curve要根据方向来判断是x还是z加distance
             
                //判断物体是否是斜着跳
                let isalpha;
                if(Math.abs(dropcube.position.z - group.position.z) <= 0.001 || Math.abs(dropcube.position.x - group.position.x) <= 0.001) {
                    isalpha = 0;
                } else isalpha = 1;
    
                let cosalpha;//计算斜着跳的角度
                cosalpha = Math.abs(dropcube.position.x - group.position.x)/distance * direction +
                           Math.abs(dropcube.position.z - group.position.z)/distance * (1 - direction);
                
                
                //left,right0,right1分别定义起落边界，在此边界内物体的高度将模拟落在平台上的高度
                //l,r0,r1分别定义物体会从平台摔下来的边界，在此范围内物体虽然落在平台上但最终会摔下来
                if(!isalpha) {
                    left = (currentcube.position.x - group.position.x + 5) * (1 - direction) + (group.position.z - currentcube.position.z + 5) * direction;
                    right0 = dropcube.position.x*(1 - direction) - dropcube.position.z*direction - group.position.x*(1 - direction) + group.position.z*direction - 6;
                    right1 = dropcube.position.x*(1 - direction) - dropcube.position.z*direction + 6 - group.position.x*(1 - direction) + group.position.z*direction;
                    l = left - 1;
                    r0 = right0 + 1;
                    r1 = right1 - 1;

                } else {
                    left = 6/Math.sin(Math.acos(cosalpha));
                    right0 = (dis - 6)/Math.sin(Math.acos(cosalpha));
                    right1 = (dis + 6)/Math.sin(Math.acos(cosalpha));
                    l = 5/Math.sin(Math.acos(cosalpha));
                    r0 = (dis - 5)/Math.sin(Math.acos(cosalpha));
                    r1 = (dis + 5)/Math.sin(Math.acos(cosalpha));
                }
                
                console.log(distance)
                console.log(group.position)
                console.log(dropcube.position)
                console.log(isalpha)
                console.log(r1)
                console.log(right1)
                console.log(left)
                console.log(l)
                console.log(right0)
                console.log(r0)

                //物体的落点不同其高度不同（落在地面和落在平台）
                let positiony;
                if(distance < left || (right0 < distance && right1 > distance)) {
                    positiony = group.position.y;
                    if((distance >= l && distance < left) ||  (distance > left && distance <= r0) || distance >= r1) {
                        setTimeout(()=>{dropflag = true},400) //物体先跳跃再摔倒，因此异步执行摔倒动画
                       
                        if(distance <= r0 && right0 < distance) { //设置摔倒的方向（向前或者向后）
                            dir = 1;
                        } else dir = 0;
                    }

                } else {
                    positiony = 0;
                }  
                    //三维贝塞尔曲线模拟物体跳跃曲线
                    if(isalpha) {
                        curve = new Three.QuadraticBezierCurve3(
                        group.position,
                        new Three.Vector3((group.position.x + distance/2*(1 - direction)), group.position.y + distance, group.position.z - distance/2*direction),
                        new Three.Vector3((group.position.x + distance)*(1 - direction) + dropcube.position.x * direction , positiony, (group.position.z - distance)*direction + dropcube.position.z * (1 - direction))
                        )
                    } else {
                        curve = new Three.QuadraticBezierCurve3(
                        group.position,
                        new Three.Vector3((group.position.x + distance/2*(1 - direction)), group.position.y + distance, group.position.z - distance/2*direction),
                        new Three.Vector3((group.position.x + distance*Math.sin(Math.acos(cosalpha)))*(1 - direction) + dropcube.position.x * direction , positiony, (group.position.z - distance*Math.sin(Math.acos(cosalpha)))*direction + dropcube.position.z * (1 - direction))
                        )
                    }
                    

                t = 0;

            })
        },
        //物体在跳跃曲线上运动
        moveOnCurve(curve, t){
            group.position.copy(curve.getPointAt(t));
        },
        //物体成功落在平台上，会降落新的盒子，否则游戏结束
        createNewCube(){
            if(r0 < distance && r1 > distance ) {
                const audioLoader = new Three.AudioLoader();
                audioLoader.load('/src/assets/14144.mp3', (buffer) => {
                    sound.setBuffer( buffer );
	                sound.setLoop( false );
	                sound.setVolume( 0.5 );
	                sound.play();
                })
                cameraflag = true;
                currentcube = dropcube;
                dropcube = array[Math.round(Math.random()*2)].clone();
                direction = Math.round(Math.random());//随机掉落一个盒子
                dis = Math.random()*10 + 20;//随机赋值盒子
                dropcube.position.set(dis * (1 - direction) + currentcube.position.x, 100, (- dis) * direction + currentcube.position.z);
                scene.add(dropcube);
                cubeflag = true;
                            
            } else{
                const audioLoader = new Three.AudioLoader();
                audioLoader.load('/src/assets/y941.mp3', (buffer) => {
                    sound.setBuffer( buffer );
	                sound.setLoop( false );
	                sound.setVolume( 0.5 );
	                sound.play();
                })
                setTimeout(()=>{
                    let r = window.confirm("Game Over!");
                    if(r) {
                        location.reload()
                    }
                    }, 1500) //等待异步动画执行完之后再弹出
                }
        }

    },

}
</script>

<style>
#three{
    width: 1200px;
    height: 800px;
}
button{
    text-decoration: none;
    color:#255e95;
    padding: 10px 30px;
    display: inline-block;
    border: 1px solid rgba(0,0,0,0.21);
    border-bottom: 4px solid rgba(0,0,0,0.21);
    border-radius: 4px;
    background:#e6e6fa;
}
</style>