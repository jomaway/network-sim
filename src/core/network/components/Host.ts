import { NodeID, NodeType } from "./NetworkComponents";
import { AddressableNode } from "./AddressableNode";
import { ICMPHandler } from "../protocols/ICMP"
import { DHCPClient, DHCPServer } from "../protocols/DHCP";
import { CommandHandler } from "../services/commands";
import { TCPHandler } from "../protocols/TCP";
import { UDPHandler } from "../protocols/UDP";

export class Host extends AddressableNode {
  tcpHandler: TCPHandler;
  udpHandler: UDPHandler;
  dhcpClient: DHCPClient;
  dhcpServer: DHCPServer;
  commandHandler: CommandHandler

  constructor(id: NodeID, name: string = "Host") {
    super(id)
    this.name = name;
    
    this.tcpHandler = new TCPHandler(this)
    this.udpHandler = new UDPHandler(this)

    this.dhcpClient = new DHCPClient(this)
    this.dhcpServer = new DHCPServer(this) // is a service which needs to be started.

    this.commandHandler = new CommandHandler(this)

    this.addInterface("eth 0")

  }
  
  getNodeType(): NodeType {
    return NodeType.Host;
  }

  /* ---------- Handle user interactions  ----------*/

  async runCommand(cmd: string) : Promise<any> {
    return this.commandHandler.run(cmd);
  }

  command() {
    return this.commandHandler
  }

  /* ------------ Serializeable ------------ */
  save() : object {
    let data = super.save()
    data["dhcpServer"] = this.dhcpServer.save()
    return data
  }

  load(data: any): void {
    super.load(data)
    this.dhcpServer.load(data.dhcpServer)
    //if (data.dhcpServer.running === true) this.dhcpServer.start()
  }
}