export class PeerManager {
  private readonly peers = new Map<string, RTCPeerConnection>();

  create(peerId: string, config?: RTCConfiguration): RTCPeerConnection {
    const existing = this.peers.get(peerId);
    if (existing) {
      return existing;
    }

    const connection = new RTCPeerConnection(config);
    this.peers.set(peerId, connection);
    return connection;
  }

  get(peerId: string): RTCPeerConnection | undefined {
    return this.peers.get(peerId);
  }

  close(peerId: string): void {
    const connection = this.peers.get(peerId);
    if (!connection) {
      return;
    }

    connection.onicecandidate = null;
    connection.ontrack = null;
    connection.onconnectionstatechange = null;
    connection.onsignalingstatechange = null;
    connection.oniceconnectionstatechange = null;
    connection.onnegotiationneeded = null;
    connection.ondatachannel = null;
    connection.close();
    this.peers.delete(peerId);
  }

  closeAll(): void {
    for (const connection of this.peers.values()) {
      connection.onicecandidate = null;
      connection.ontrack = null;
      connection.onconnectionstatechange = null;
      connection.onsignalingstatechange = null;
      connection.oniceconnectionstatechange = null;
      connection.onnegotiationneeded = null;
      connection.ondatachannel = null;
      connection.close();
    }
    this.peers.clear();
  }
}