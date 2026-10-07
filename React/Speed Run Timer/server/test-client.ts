import WebSocket from 'ws';

async function runTest() {
  console.log('🧪 Starting SpeedSync Real-Time WebSocket Test...');
  const ws = new WebSocket('ws://localhost:3005/ws');

  let resolveTest: () => void;
  const donePromise = new Promise<void>((resolve) => { resolveTest = resolve; });

  ws.on('open', () => {
    console.log('✅ Connected to WebSocket /ws');

    // 1. NTP Calibration Ping
    console.log('📡 Sending SYNC_PING...');
    ws.send(JSON.stringify({
      type: 'SYNC_PING',
      clientSendTime: 1000,
    }));
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log(`📩 Received [${msg.type}]:`, msg.type === 'ROOM_STATE' ? `Room ${msg.state.roomCode}, ${msg.state.participants.length} racers` : msg.type === 'SYNC_PONG' ? `ServerTime: ${msg.serverTime}` : msg);

    if (msg.type === 'SYNC_PONG') {
      console.log('✅ SYNC_PONG validated! Joining demo room NX9Q as test duelist...');
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: 'NX9Q',
        username: 'TEST_RUNNER_SPEED',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=TestRunner',
      }));
    }

    if (msg.type === 'ROOM_STATE') {
      console.log('✅ Joined Room successfully. Host is:', msg.state.hostPlayerId);
      console.log('🚀 Triggering START_COUNTDOWN...');
      ws.send(JSON.stringify({
        type: 'START_COUNTDOWN',
        roomId: msg.state.roomId,
        playerId: msg.state.hostPlayerId,
      }));
    }

    if (msg.type === 'COUNTDOWN_TICK') {
      console.log(`⏱️ COUNTDOWN TICK: ${msg.remainingMs}ms remaining`);
    }

    if (msg.type === 'RACE_STARTED') {
      console.log('🏁 RACE STARTED! Authoritative timestamp:', msg.serverStartTimestamp);
      console.log('⚡ Submitting Sector 0 split after human delay...');
      setTimeout(() => {
        ws.send(JSON.stringify({
          type: 'SUBMIT_SPLIT',
          roomId: 'room-nx9q',
          playerId: 'runner-kronos',
          splitIndex: 0,
          elapsedClientMs: 95000,
        }));
      }, 500);
    }

    if (msg.type === 'SPLIT_RECORDED') {
      console.log(`✨ SPLIT RECORDED for ${msg.playerId}!`);
      console.log(`   Segment Duration: ${msg.splitRecord.segmentDurationMs}ms`);
      console.log(`   Is Gold Split: ${msg.isGold}`);
      console.log(`   Delta vs Leader: ${msg.splitRecord.deltaVsLeaderMs}ms`);
      console.log(`   Next Split Index: ${msg.nextSplitIndex}`);
      console.log('🎉 Full race synchronization lifecycle verified!');
      ws.close();
      resolveTest();
    }
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err);
  });

  await donePromise;
}

runTest().catch(console.error);
