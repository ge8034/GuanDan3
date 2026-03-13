
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rzzywltxlfgucngfiznx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enl3bHR4bGZndWNuZ2Zpem54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTM1NjksImV4cCI6MjA4NDYyOTU2OX0.Upn1XmBZPQxYPl2UAVpGOtWim3Pf3yeeGNNMQm0idtM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkGame() {
  console.log('Checking latest game state...');

  // 1. Get latest game
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (gameError) {
    console.error('Error fetching game:', gameError);
    return;
  }

  if (!game) {
    console.log('No game found.');
    return;
  }

  console.log('--- GAME STATE ---');
  console.log('ID:', game.id);
  console.log('Room ID:', game.room_id);
  console.log('Status:', game.status);
  console.log('Turn No:', game.turn_no);
  console.log('Current Seat:', game.current_seat);
  console.log('Updated At:', game.updated_at);

  // 2. Get Room Members
  const { data: members, error: memberError } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', game.room_id)
    .order('seat_no');

  if (memberError) {
    console.error('Error fetching members:', memberError);
    return;
  }

  console.log('--- ROOM MEMBERS ---');
  members.forEach(m => {
    const isCurrent = m.seat_no === game.current_seat;
    console.log(`Seat ${m.seat_no}: ${m.member_type} ${m.uid ? '(uid: ' + m.uid.slice(0, 8) + '...)' : '(no uid)'} ${isCurrent ? '<-- CURRENT TURN' : ''}`);
  });
  
  // Check if current seat is AI
  const currentMember = members.find(m => m.seat_no === game.current_seat);
  if (currentMember) {
      if (currentMember.member_type !== 'ai') {
          console.warn('WARNING: Current seat is NOT marked as AI in database!');
      } else {
          console.log('INFO: Current seat IS marked as AI.');
      }
  } else {
      console.error('ERROR: Current seat not found in members!');
  }
}

checkGame();
