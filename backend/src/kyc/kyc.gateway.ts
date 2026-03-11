import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class KycGateway {
  @WebSocketServer()
  server: Server;

  
  @SubscribeMessage('join-kyc-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket, 
    @MessageBody() sessionId: string
  ) {
    client.join(sessionId);
    console.log(`Desktop joined KYC session: ${sessionId}`);
  }

  
  notifyDesktop(sessionId: string, status: string, message: string) {
    this.server.to(sessionId).emit('KYC_PROGRESS', { status, message });
  }
}