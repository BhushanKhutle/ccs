import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/orders' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) { console.log(`WS connected: ${client.id}`); }
  handleDisconnect(client: Socket) { console.log(`WS disconnected: ${client.id}`); }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { role: string; userId?: number }, @ConnectedSocket() client: Socket) {
    client.join(`role:${data.role}`);
    if (data.userId) client.join(`user:${data.userId}`);
    client.emit('joined', { room: `role:${data.role}` });
  }

  emitOrderUpdate(order: any) {
    this.server.to('role:admin').emit('order:update', order);
    if (['placed','confirmed','preparing','ready_for_pickup'].includes(order.status))
      this.server.to('role:chef').emit('order:update', order);
    if (['ready_for_pickup','out_for_delivery','delivered'].includes(order.status))
      this.server.to('role:agent').emit('order:update', order);
    if (order.userId) this.server.to(`user:${order.userId}`).emit('order:update', order);
  }

  emitNewOrder(order: any) {
    this.server.to('role:chef').emit('order:new', order);
    this.server.to('role:admin').emit('order:new', order);
  }
}
