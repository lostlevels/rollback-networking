// Max bits for a number where we can still use bit shift operators.
const MAX_BITS_ACK_MASK = 31;

// Up to MAX_ACK_MASKS * MAX_BITS_ACK_MASK consecutive inputs can be dropped
// before desync happens. Can increase this at the cost of bandwidth.
const MAX_ACK_MASKS = 4;

const PING_PACKET_THRESHOLD = 5; // Number of ping pong packets to send before establishing latency.

const PACKET_TYPE_PING  = 'ping';
const PACKET_TYPE_PONG  = 'pong';
const PACKET_TYPE_READY = 'ready';

class ConnectionHandler {
  constructor({onIdCreated, onRemoteData, onRemoteJoined, onRemoteClosed, log=console.log}) {
    this.peer = new Peer();
    this.remoteConn = null;

    this.acks = new Acks();
    this.latencies = new Latencies();
    this.log = log;

    this.peer.on('open', () => {
      this.log(`Assigned id ${this.peer.id} .`);
      onIdCreated(this.peer.id);
    });

    this.peer.on('connection', (conn) => {
      this.remoteConn = conn;
      conn.on('open', () => {
        this.log(`Peer ${conn.peer} joined.`);
        // Establish latency. This can be done periodically
        // or just once for convenience. This is so both players
        // start the simulation at roughly the same time.
        this.sendPingPacket();
      });

      conn.on('data', (data) => {
        if (data.type == PACKET_TYPE_PONG) {
          this.latencies.end(data.counter);

          // TODO: This does not handle the case where the
          // ready packet does not reach the peer.
          if (this.latencies.count() >= PING_PACKET_THRESHOLD) {
            const medianLatency = this.latencies.median();
            this.log(`Median latency is ${medianLatency} ms.`);

            const packet = {
              latency: medianLatency,
              type: PACKET_TYPE_READY,
            };
            this.sendRaw(packet);

            // In order for both simulations to start at roughly the same
            // time, delay calling the actual onRemoteJoined callback until half
            // the latency has passed to that the PACKET_TYPE_READY message
            // has reached the peer.
            setTimeout(() => {
              onRemoteJoined(conn.peer);
            }, medianLatency/2);
          }
          else {
            // Keep sending ping packets until PING_PACKET_THRESHOLD are
            // established. TODO: This does not handle the case where there is
            // no accompanying PACKET_TYPE_PONG packet.
            this.sendPingPacket();
          }
          return;
        }
        this.handleRemoteData(data);
      });
      conn.on('error', (err) => {
        throw err;
      });
      conn.on('close', onRemoteClosed);
    })

    this.onRemoteData = onRemoteData;
    this.onRemoteClosed = onRemoteClosed;
  }

  sendPingPacket() {
    const packet = {
      counter: this.latencies.start(),
      type: PACKET_TYPE_PING,
    };
    this.sendRaw(packet);
    this.log('ping');
  }

  sendPongPacket(pingPacket) {
    const packet = {
      type: PACKET_TYPE_PONG,
      counter: pingPacket.counter,
    };
    this.sendRaw(packet);
    this.log('pong');
  }

  handleRemoteData(packets) {
    // Remove any out of order / old packets - packets older than the max frame received.
    const {filtered, droppedFrames} = this.acks.filterRemotePackets(packets);
    this.onRemoteData(filtered, droppedFrames);
  }

  // One peer will have to connect to the other using the other's id
  connect(remoteId, onConnectedToRemote) {
    this.remoteConn = this.peer.connect(remoteId);
    this.remoteConn.on('open', Function.prototype);
    this.remoteConn.on('data', (data) => {
      if (data.type == PACKET_TYPE_PING) {
        this.sendPongPacket(data);
        return;
      }
      else if (data.type == PACKET_TYPE_READY) {
        this.log(`Connected to peer with latency ${data.latency} ms.`);
        onConnectedToRemote();
        return;
      }
      this.handleRemoteData(data);
    });
    this.remoteConn.on('close', this.onRemoteClosed);
  }

  sendWithAcks(data) {
    // Add ack mask with every input.
    const ndata = [];
    for (let wrappedInput of data) {
      const obj = {
        ackMasks: this.acks.createAckMasks(wrappedInput.frame),
      };
      ndata.push(Object.assign(obj, wrappedInput));
    }
    this.sendRaw(ndata);
  }

  sendRaw(data) {
    this.remoteConn.send(data);
  }
}

class Latencies {
  constructor() {
    this.latencies = [];
    this.startTimes = {};
    this.counter = 0;
  }

  count() {
    return this.latencies.length;
  }

  start(time=Date.now()) {
    const counter = this.counter++;
    this.startTimes[counter] = time;
    return counter;
  }

  end(counter, time=Date.now()) {
    this.latencies.push(time - this.startTimes[counter]);
  }

  median() {
    if (this.latencies.length) {
      this.latencies.sort();
      return this.latencies[~~(this.latencies.length/2)];
    }
    return NaN;
  }

  avg() {
    if (this.latencies.length) {
      return this.latencies.reduce((accum, latency) => accum + latency, 0);
    }
    return NaN;
  }
}

class Acks {
  constructor() {
    // Frames from remote peer that the local player did not receive (due to
    // out of order or dropped packet, etc)
    this.droppedRemoteFrames = {};

    // Frames from local player to remote peer that peer acknowledges as dropped.
    this.droppedLocalFrames = {};

    // Keep track of max frame received in order to know if a packet
    // is out of order, resent, etc.
    this.maxFrameReceived = -1;

    this.numDroppedFrames = 0;
  }

  // filterRemotePackets will remove old, out of order packets and
  // update the ack masks for any dropped packets.
  filterRemotePackets(packets) {
    const filtered = packets.filter(packet => packet.frame > this.maxFrameReceived);

    for (let i = 0; i < filtered.length; i++) {
      const prevFrame = i == 0 ? this.maxFrameReceived : filtered[i-1].frame;
      const currentFrame = filtered[i].frame;
      for (let frame = prevFrame + 1; frame < currentFrame; frame++) {
        this.droppedRemoteFrames[frame] = true;
      }
    }

    this.maxFrameReceived = Math.max(this.maxFrameReceived, ...filtered.map(packet => packet.frame));

    let newDroppedLocalFrames = {};
    // Go through all packets not just new packets / filtered for
    // the acks.
    for (let packet of packets) {
      const droppedLocalFrames = this.getDroppedFrames(packet.frame, packet.ackMasks);
      for (let frame in droppedLocalFrames) {
        if (!this.droppedLocalFrames[frame]) {
          this.numDroppedFrames++;
          this.droppedLocalFrames[frame] = true;
          newDroppedLocalFrames[frame] = true;
        }
      }
    }

    return {
      filtered,
      droppedFrames: newDroppedLocalFrames,
    };
  }

  createAckMasks(endFrame) {
    const masks = [];
    let frame = endFrame;
    for (let i = 0; i < MAX_ACK_MASKS; i++) {
      let mask = 0;
      for (let bit = 0; bit < MAX_BITS_ACK_MASK && frame >= 0; bit++) {
        if (this.droppedRemoteFrames[frame--]) {
          mask |= (1 << bit);
        }
      }
      masks.push(mask);
    }
    return masks;
  }

  getDroppedFrames(endFrame, ackMasks) {
    const droppedFrames = {};
    let frame = endFrame;
    for (let i = 0; i < Math.min(MAX_ACK_MASKS, ackMasks.length); i++) {
      let mask = ackMasks[i];
      for (let bit = 0; bit < MAX_BITS_ACK_MASK && frame >= 0; bit++, frame--) {
        if (mask & (1 << bit)) {
          droppedFrames[frame] = true;
        }
      }
    }
    return droppedFrames;
  }
}