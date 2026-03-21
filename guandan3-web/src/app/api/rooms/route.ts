import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select(`
        id,
        name,
        mode,
        type,
        status,
        visibility,
        owner_uid,
        created_at,
        room_members (
          id,
          user_id,
          online,
          joined_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching rooms:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rooms' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rooms: rooms || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
