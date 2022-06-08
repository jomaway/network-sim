import { NodeID, NodeType } from "./NetworkComponents";
import { AdressableNode } from "./AddressableNode";
import { ICMPHandler } from "../protocols/ICMP"
import { DHCPClient, DHCPServer } from "../protocols/DHCP";
import { CommandHandler } from "../services/commands";
import { TCPHandler } from "../protocols/TCP";
import { UDPHandler } from "../protocols/UDP";

export class Host extends AdressableNode {
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
}