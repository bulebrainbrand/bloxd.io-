
const textWeight = "700"

let playerBuildData = {}

//{dbid,pos,block}
let settingBlock = []

onPlayerJoin = id => {
  if(api.getClientOption(id,"creative"))setBuildData(id)
  }

const toolFuncMap = new Map([
["Wood Sword",(id,x,y,z,block) => {
  const { selectBlockManager } = playerBuildData[id]
  selectBlockManager.add(block)
  }],
["Stone Sword",(id,x,y,z) => {
  const { selectBlockManager } = playerBuildData[id]
  selectBlockManager.undo()
  }],
["Iron Sword",(id,x,y,z) => {
  const { selectBlockManager } = playerBuildData[id]
  selectBlockManager.clear()
  }],
["Wood Axe",(id,x,y,z) => {
  if(x == undefined){
    api.sendMessage(id,"空中ではなくブロックをクリックしてください")
    return;
    }
  const { circleSetter } = playerBuildData[id]
  circleSetter.set([x,y,z])
  }],
["Stone Axe",(id,x,y,z) => {
  const { circleDataManager } = playerBuildData[id]
  if(api.isPlayerCrouching(id)){
    circleDataManager.apply(1)
    }
  else{
    circleDataManager.apply(-1)
    }
  circleDataMessage(id)
  }],
["Iron Axe",(id,x,y,z) => {
  const { circleDataManager } = playerBuildData[id]
  circleDataManager.nextAxis()
  circleDataMessage(id)
  }],
["Wood Spade",(id,x,y,z) => {
  if(x == undefined){
    api.sendMessage(id,"空中ではなくブロックをクリックしてください")
    return;
    }
  const { sphereSetter } = playerBuildData[id]
  sphereSetter.set([x,y,z])
  }],
["Stone Spade",(id,x,y,z) => {
  const { sphereRadiusManager } = playerBuildData[id]
  if(api.isPlayerCrouching(id)){
    sphereRadiusManager.apply(1)
    }
  else{
    sphereRadiusManager.apply(-1)
    }
  sphereDataMessage(id)
  }],
["Wood Hoe",(id,x,y,z) => {
  const { lineManager } = playerBuildData[id]
  lineManager.set()
  }],
["Stone Hoe",(id,x,y,z) => {
  if(x == undefined){
    api.sendMessage(id,"空中ではなくブロックをクリックしてください")
    return;
    }
  const { linePosMarker } = playerBuildData[id]
  linePosMarker.set([x,y,z])
  posMarkerMessage(id,"linePosMarker")
  }],
["Wood Pickaxe",(id,x,y,z) => {
  const { fillManager } = playerBuildData[id]
  fillManager.set()
  }],
["Stone Pickaxe",(id,x,y,z) => {
  if(x == undefined){
    api.sendMessage(id,"空中ではなくブロックをクリックしてください")
    return;
    }
  const { fillPosMarker } = playerBuildData[id]
  fillPosMarker.set([x,y,z])
  posMarkerMessage(id,"fillPosMarker")
  }],
["Stick",(id,x,y,z) => {
  if(x == undefined){
    api.sendMessage(id,"空中ではなくブロックをクリックしてください")
    return;
    }
  const { blockSetter } = playerBuildData[id]
  blockSetter.set([[x,y,z]])
  }],
["Arrow of Instant Damage",(id,x,y,z) => {
  if(x == undefined){
    api.sendMessage(id,"空中ではなくブロックをクリックしてください")
    return;
    }
  setBlocks(id,[[x,y,z]],["Air"])
  }],
["Arrow of Strength",(id,x,y,z) => {
  if(x == undefined){
    api.sendMessage(id,"空中ではなくブロックをクリックしてください")
    return;
    }
  const { checkPosMarker } = playerBuildData[id]
  checkPosMarker.set([x,y,z])
  posMarkerMessage(id,"checkPosMarker")
  }],
["Arrow of Shield",(id) => {
  const { pos1,pos2 } = playerBuildData[id].checkPosMarker.get()
  if(pos1 == null || pos2 == null)throw new Error("石のくわで座標を指定してから使ってください")
  runningFuncs.push(setCheckBlockRect(pos1,pos2,id))
  }]
])

const setBuildData = id => {
  const blockSelector = new BlockSelector
  const selectBlockManager = new SelectBlockManager(id,blockSelector)
  const blockSetter = new BlockSetter(id,blockSelector)
  const sphereRadiusManager = new ShapeRadiusManager
  const sphereSetter = new SphereSetter(sphereRadiusManager,blockSetter)
  const circleDataManager = new CircleDataManager
  const circleSetter = new CircleSetter(circleDataManager,blockSetter)
  const linePosMarker = new PosMarker
  const lineManager = new LineManager(linePosMarker,blockSetter)
  const fillPosMarker = new PosMarker
  const fillManager = new FillManager(fillPosMarker,blockSetter)
  const checkPosMarker = new PosMarker
  playerBuildData[id] = {
    selectBlockManager,
    blockSetter,
    sphereRadiusManager,
    sphereSetter,
    circleDataManager,
    circleSetter,
    linePosMarker,
    lineManager,
    fillPosMarker,
    fillManager,
    checkPosMarker,
    }
  }

let runningFuncs = []

tick = () => {
  for(const a of Array(20)){
    if(settingBlock.length <= 0)break;
    const {dbId,pos,block} = settingBlock[0]
    if(api.isBlockInLoadedChunk(...pos)){
      api.attemptWorldChangeBlock(dbId,...pos,block,undefined)
      settingBlock.shift()
      }
    else{
      api.getBlock(pos)
      }
    }
  for(const a of Array(20)){
    if(runningFuncs.length <= 0)break;
    const { done } = runningFuncs[0].next()
    if(done)runningFuncs.shift()
    }
  }

onPlayerAttemptAltAction = (id,x,y,z,block) => {
  const heldData = api.getHeldItem(id)
  if(toolFuncMap.has(heldData?.name) && api.getClientOption(id,"creative")){
    toolFuncMap.get(heldData.name)(id,x,y,z,block)
    return "preventAction"
    }
  }

const setBlocks = (id,posArr,blockArr) => {
  const dbId = api.getPlayerDbId(id)
  if(blockArr.length <= 0)throw new Error("設定しているブロックがないので配置できません")
  for(const pos of posArr){
    settingBlock.push({dbId,pos,block:blockArr[Math.floor(Math.random() * blockArr.length)]})
    }
  }

const BlockSelector = class{
  #selectBlocks
  constructor(){
    this.#selectBlocks = []
    }
  add(block){
    this.#selectBlocks.push(block)
    }
  undo(){
    this.#selectBlocks.pop()
    }
  clear(){
    this.#selectBlocks = []
    }
  getSelectBlock(){
    return this.#selectBlocks
    }
  }

const BlockSetter = class{
  #myBlockSelector
  #id
  constructor(id,blockSelector){
    this.#myBlockSelector = blockSelector
    this.#id = id
    }
  set(posArr){
    setBlocks(this.#id,posArr,this.#myBlockSelector.getSelectBlock())
    }
  }
const ShapeRadiusManager = class{
  #radius

  constructor(){
    this.#radius = 1
    }
  apply(num){
    this.#radius += num
    if(this.#radius <= 0)this.#radius = 1
    }
  set(num){
    this.#radius = num
    }
  get(){
    return {radius:this.#radius}
    }
  }

const SphereSetter = class{

  #myShapeRadiusManager
  #myBlockSetter

  constructor(shapeRadiusManager,blockSetter){
    this.#myShapeRadiusManager = shapeRadiusManager
    this.#myBlockSetter = blockSetter
    }
  set([x,y,z]){
    runningFuncs.push(setSphere([x,y,z],this.#myShapeRadiusManager,this.#myBlockSetter))
    }
  }

const CircleDataManager = class extends ShapeRadiusManager{
  #axis
  constructor(){
    super()
    this.#axis = 0
    }

  get(){
    return {radius:super.get().radius,axis:this.#axis}
    }

  nextAxis(){
    //0,1,2,0,1,2の順で遷移させる
    this.#axis += 1
    this.#axis %= 3
    }
  }

const CircleSetter =class{
  #myCircleDataManager
  #myBlockSetter

  constructor(circleDataManager,blockSetter){
    this.#myCircleDataManager = circleDataManager
    this.#myBlockSetter = blockSetter
    }

  set([x,y,z]){
    const {radius,axis} = this.#myCircleDataManager.get()
    const posData = circleCoord(radius)
    let setPosData = []
    if(axis === 0){
      setPosData = posData.map(([ax,ay]) => [ax+x,ay+y,z])
      }
    if(axis === 1){
      setPosData = posData.map(([ax,ay]) => [x,ay+y,ax+z])
      }
    if(axis === 2){
      setPosData = posData.map(([ax,ay]) => [ax+x,y,ay+z])
      }
    this.#myBlockSetter.set(setPosData)
    }

}

const PosMarker = class{

  #pos1
  #pos2
  #lastUpdate

  constructor(){
    this.#pos1 = null
    this.#pos2 = null
    this.#lastUpdate = 2
    }

  set(pos){
    if(this.#lastUpdate === 1){
      this.#pos2 = pos
      this.#lastUpdate = 2
      return
      }
    if(this.#lastUpdate === 2){
      this.#pos1 = pos
      this.#lastUpdate = 1
      }
    } 

  clear(){
    this.#pos1 = null
    this.#pos2 = null
    }

  get(){
    return {pos1:this.#pos1,pos2:this.#pos2}
    }

  }

const LineManager = class{
  #myPosMarker
  #myBlockSetter

  constructor(posMarker,blockSetter){
    this.#myPosMarker = posMarker
    this.#myBlockSetter =  blockSetter
    }

  set(){
    const { pos1,pos2 } = this.#myPosMarker.get()
    if(pos1 == null || pos2 == null)throw new Error("石のくわで座標を指定してから使ってください")
    runningFuncs.push((function* (pos1,pos2,blockSetter){
      const runningFunc = lineCoord(pos1,pos2)
      while(1){
        yield;
        const {done,value} = runningFunc.next()
        if(done)break;
        if(value)blockSetter.set([value])
        }
      })(pos1,pos2,this.#myBlockSetter))
    }
  
  }

const FillManager = class{
  #myPosMarker
  #myBlockSetter

  constructor(posMarker,blockSetter){
    this.#myPosMarker = posMarker
    this.#myBlockSetter =  blockSetter
    }

  set(){
    const { pos1,pos2 } = this.#myPosMarker.get()
    if(pos1 == null || pos2 == null)throw new Error("石のつるはしで座標を指定してから使ってください")
    runningFuncs.push((function* (pos1,pos2,blockSetter){
      const [[sx,sy,sz],[mx,my,mz]] = minMaxPoint(pos1,pos2)
      for(let x = sx;x <= mx;x++){
        for(let y = sy;y <= my;y++){
          for(let z = sz;z<= mz;z++){
            yield;
            blockSetter.set([[x,y,z]])
            }
          }
        }
      })(pos1,pos2,this.#myBlockSetter))
    } 
  }


const makeSelectBlockText = (blocks) => {
  let text = []
  let count = {}
  for(const block of blocks){
    count[block] ??= 0
    count[block] += 1
    }
  for(const [name,amount] of Object.entries(count)){
    text.push({icon:name},{str:`${name} *${amount}\n`,style:{color:"orange",fontWeight:textWeight}})
    }
  if(text.length <= 0)text = ["なにも選択していません"]
  return text
  }

const systemMessage = (id,sysName,subStr,text) => {
  let pushText = [text]
  if(Array.isArray(text))pushText = text
  api.sendMessage(
    id,
    [
      {str:`[ ${sysName} ]`,style:{color:"orange",fontWeight:textWeight}},
      {str:`[ ${subStr} ] \n`,style:{color:"lime",fontWeight:textWeight}},
      ...pushText
    ])
  }
const selectBlockMessage = (id,blockSelector) => {
  const blocks = blockSelector.getSelectBlock()
  systemMessage(id,"blockSelector","選択しているブロック",makeSelectBlockText(blocks))
  }
const SelectBlockManager = class{

  #myBlockselector
  #id

  constructor(id,blockSelector){
    this.#myBlockselector = blockSelector
    this.#id = id
    }
  add(block){
    this.#myBlockselector.add(block)
    selectBlockMessage(this.#id,this.#myBlockselector)
    }
  undo(){
    this.#myBlockselector.undo()
    selectBlockMessage(this.#id,this.#myBlockselector)
    } 
  clear(){
    this.#myBlockselector.clear()
    selectBlockMessage(this.#id,this.#myBlockselector)
    }
  }

const circleCoord = (r) => {
  const points = new Set();
  const radius = Math.round(r);
  let x = radius
  let y = 0
  let p = 1 - radius;
  const addStr = (data) => points.add(JSON.stringify(data));
  const plotOctants = (px, py) => {
    addStr([px, py])
    addStr([-px, py])
    addStr([px, -py])
    addStr([-px, -py])
    addStr([py, px])
    addStr([-py, px])
    addStr([py, -px])
    addStr([-py, -px])
    }
  plotOctants(x, y)
  while (x > y) {
    y++;
    if(p <= 0){
      p = p + 2 * y + 1
    } else {
      x--
      p = p + 2 * y + 1 - 2 * x
    }
    if(x < y){
      break
      }
    plotOctants(x, y)
    }
  return Array.from(points).map(pStr => JSON.parse(pStr));
  }
const circleDataMessage = (id) => {
  const { circleDataManager } = playerBuildData[id]
  const axisText = ["xy","yz","zx"]
  const { radius,axis } = circleDataManager.get()
  systemMessage(id,"circleDataManager","現在の設定",`半径:${radius},向き:${axisText[axis]}平面`)
  }
const sphereDataMessage = (id) => {
  const { sphereRadiusManager } = playerBuildData[id]
  const { radius } = sphereRadiusManager.get()
  systemMessage(id,"sphereDataManager","現在の設定",`半径:${radius}`)
  }
const setSphere = function* ([sx,sy,sz],shapeRadiusManager,blockSetter){
  const radius = shapeRadiusManager.get().radius
  if(radius < 1){
    return [];
    }
  const rSquared = radius * radius;
  const innerRSquared = (radius - 1) * (radius - 1);
  const maxCoord = Math.ceil(radius);
  let stopCount = 0
  for(let x = -maxCoord; x <= maxCoord; x++) {
    for(let y = -maxCoord; y <= maxCoord; y++) {
      for(let z = -maxCoord; z <= maxCoord; z++) {
        if((stopCount++) % 10 === 0)yield;
        const distanceSquared = x * x + y * y + z * z;
        if(distanceSquared > innerRSquared && distanceSquared <= rSquared) {
          blockSetter.set([[sx+x,sy+y,sz+z]])
       　 }
    　　}
   　 }
    }
  }
const lineCoord = function* (p1, p2){
  const [ax, ay, az] = p1;
  const [bx, by, bz] = p2;
  const dx = bx - ax;
  const dy = by - ay;
  const dz = bz - az;
  let [x,y,z] = p1.map(num => Math.floor(num))
  const [stepX,stepY,stepZ] = [dx,dy,dz].map(num => Math.sign(num))
  const [endX,endY,endZ] = p2.map(num => Math.floor(num));
  const [tDeltaX,tDeltaY,tDeltaZ] = [dx,dy,dz].map(num => num === 0 ? Infinity : Math.abs(1 / num));
  let tMaxX = tDeltaX * (stepX > 0 ? (x + 1 - ax) : (ax - x));
  let tMaxY = tDeltaY * (stepY > 0 ? (y + 1 - ay) : (ay - y));
  let tMaxZ = tDeltaZ * (stepZ > 0 ? (z + 1 - az) : (az - z));
  dx === 0 && (tMaxX = Infinity);
  dy === 0 && (tMaxY = Infinity);
  dz === 0 && (tMaxZ = Infinity);
  yield [x,y,z]
  while(
    (dx===0?false:Math.sign(endX - x) === stepX) || (dy===0?false:Math.sign(endY - y) === stepY)||(dz===0?false:Math.sign(endZ - z) === stepZ)){
    if(tMaxX <= tMaxY && tMaxX <= tMaxZ){
      x += stepX;
      tMaxX += tDeltaX;
    } else if (tMaxY <= tMaxZ){
      y += stepY;
      tMaxY += tDeltaY;
    } else {
      z += stepZ;
      tMaxZ += tDeltaZ;
      }   
    yield [x, y, z];   
    }
  }
 

const posMarkerMessage = (id,str) => {
  const posMarker = playerBuildData[id][str]
  const { pos1,pos2 } = posMarker.get()
  systemMessage(id,str,"指定した座標",`pos1:${pos1} pos2:${pos2}`)
  }

const setCheckBlockRect = function* (pos1,pos2,id){
  const [[sx,sy,sz],[mx,my,mz]] = minMaxPoint(pos1,pos2)
  for(let x = sx;x <= mx;x++){
    for(let y = sy;y <= my;y++){
      for(let z = sz;z<= mz;z++){
        yield;
        const a = (x+y+z)%2
        setBlocks(id,[[x,y,z]],a?["Sand"]:["Dirt"])
        }
      }
    }
  }

playerCommand = (id,cmd) => {
  if(!Object.hasOwn(playerBuildData,id))return;
  const lowerCmd = cmd.toLowerCase()
  if(lowerCmd === "selectundo" || lowerCmd === "su"){
    const { selectBlockManager } = playerBuildData[id]
    selectBlockManager.undo()
    return true
    }

  if(lowerCmd === "selectclear"|| lowerCmd === "sc"){
    const { selectBlockManager } = playerBuildData[id]
    selectBlockManager.clear()
    return true
    } 

  if(lowerCmd.startsWith("circleradius") || lowerCmd.startsWith("cr")){
    const num = Number(lowerCmd.split(" ")[1])
    isOk(num,cmd)
    const { circleDataManager } = playerBuildData[id]
    circleDataManager.set(num)
    circleDataMessage(id)
    return true
    }
  if(lowerCmd === "circleaxisnext" || lowerCmd === "can"){
    const { circleDataManager } = playerBuildData[id]
    circleDataManager.nextAxis()
    circleDataMessage(id)
    return true
    }
  if(lowerCmd.startsWith("sphereradius") || lowerCmd.startsWith("sr")){
    const num = Number(lowerCmd.split(" ")[1])
    isOk(num,cmd)
    const { sphereRadiusManager } = playerBuildData[id]
    sphereRadiusManager.set(num)
    sphereDataMessage(id)
    return true
    }
  }

const minMaxPoint = ([ax,ay,az],[bx,by,bz]) => {
  const [[sx,mx],[sy,my],[sz,mz]] = [[ax,bx],[ay,by],[az,bz]].map(([a,b]) => [Math.min(a,b),Math.max(a,b)])
  return [[sx,sy,sz],[mx,my,mz]]
  }
const isOk = (num,cmd) => {
  if(Number.isNaN(num) || !Number.isInteger(num) || num < 1)throw new Error(`不明な値です:/${cmd} 正の整数で入力してください!`);
  }
onPlayerChangeBlock = (id,x,y,z,from,to) => {
  if(!api.isPlayerCrouching(id) && api.getMetaInfo(to).halfblockPlacement != null){
    const camInfo = api.getPlayerTargetInfo(id)?.position
    if(camInfo){
      const block = api.getBlock(camInfo)
      const blockData = api.getMetaInfo(block)
      if(blockData.halfblockPlacement != null){
        api.attemptWorldChangeBlock(api.getPlayerDbId(id),x,y,z,block,undefined)
        }
      }
    }
}
