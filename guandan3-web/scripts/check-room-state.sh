#!/bin/bash
cd D:/Learn-Claude/GuanDan3/guandan3-web

source .env.local

echo "=== 检查房间状态 ==="
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rooms?room_type=eq.practice&limit=5" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" | jq '.'

echo ""
echo "=== 检查游戏状态 ==="
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/games?select=*&order=created_at.desc&limit=5" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" | jq '.[] | {id, room_id, status, current_turn}'
