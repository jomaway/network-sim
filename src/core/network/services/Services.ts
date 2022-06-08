import { ApplicationLayer } from "../protocols/networkStack";

export abstract class Service implements ApplicationLayer {
  running: boolean;

  constructor() {
    this.running = false
  }

  abstract receiveData(data:any): void;
  
  start() {
    this.running = true;
  }

  stop() {
    this.running = false;
  }

  isRunning() : boolean {
    return this.running;
  }

}

export enum ServiceState {
  idle, // Initial state
  pending, // Waiting for response
  error, // some error happend
}