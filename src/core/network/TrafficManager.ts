import mitt, {Emitter, WildcardHandler} from "mitt";
import { sleep } from "./Helper";

export enum TrafficEvent {
  Unknown,
  LinkActive,
  HandlePacket,
  BeforeTransmit,
}


export class TrafficManager {
  simulationTimeout: number
  pauseTraffic: boolean
  intervalID: number
  ticks: number
  timers: Array<any>
  logs: Array<string>

  constructor() {
    
    this.simulationTimeout = 1000
    this.pauseTraffic = false;

    this.intervalID = window.setInterval(() => this.tick(), this.simulationTimeout);
    this.ticks = 0;
    this.timers = []

    this.logs = []
  }

  init() {
    this.debug("Init TrafficManager");
    //this.intervalID = window.setInterval(() => this.tick(), this.simulationTimeout)
  }

  async notify(event: TrafficEvent, component?: any ) {
    if (event) {
      const end = this.ticks+1;
      while (this.ticks < end) {
        await sleep(this.simulationTimeout)
      }
    } else {
      this.debug(`Event ${event} not handled`);
    }
  }

  debug(msg: string) {
    console.warn("TM DEBUG: ", msg);
  }

  log(msg:string) {
    this.logs.push(msg)
    console.log("TM LOG: ", msg);
  }
  

  tick() {
    if (!this.pauseTraffic) {
      this.ticks++
    }
    this.timers.forEach((timer) => {
      if (timer.t <= this.ticks) {
        console.log("TM: call CB", timer.id);
        timer.cb()
        this.removeTimer(timer.id)
      }
    })
  }

  setSimulationTimeout(ms:number) {
    this.simulationTimeout = ms;
    clearInterval(this.intervalID)
    this.intervalID = window.setInterval(() => this.tick(), this.simulationTimeout)
  }

  setTimer(cb: Function, ticks: number): number {
    const timerID = Date.now() + Math.random()
    this.debug(`set Timer ${timerID}`);
    this.timers.push({
      id: timerID,
      t: this.ticks + ticks, 
      cb: cb
    })
    return timerID
  }

  removeTimer(timerID: number) {
    this.debug(`remove Timer ${timerID}`);
    const idx = this.timers.findIndex((timer) => timer.id === timerID)
    if (idx > -1) this.timers.splice(idx, 1)
  }

  pause() {
    this.pauseTraffic = true
  }

  play() {
    this.pauseTraffic = false
  }

  isPause() {
    return this.pauseTraffic
  }

  next() {
    this.ticks++;
  }
}

const TM = new TrafficManager()
TM.init()
export default TM