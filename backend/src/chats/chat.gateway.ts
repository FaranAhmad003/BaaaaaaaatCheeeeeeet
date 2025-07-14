import { WebSocketGateway } from "@nestjs/websockets"; 

@WebSocketGateway(3002,{})
export class ChatGateWay{}