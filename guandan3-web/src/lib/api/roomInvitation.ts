import { supabase } from '../supabase/client'

export interface RoomInvitation {
  invitation_id: string
  room_id: string
  room_name: string
  room_mode: string
  inviter_nickname: string
  inviter_avatar_url: string | null
  invite_code: string
  status: string
  expires_at: string
  created_at: string
}

export interface RoomInvitationCreateResult {
  invitation_id: string
  invite_code: string
  expires_at: string
}

export interface RoomInvitationAcceptResult {
  room_id: string
  invitation_id: string
}

export async function createRoomInvitation(
  roomId: string,
  inviteeUid?: string,
  expiresHours: number = 24
): Promise<{ data: RoomInvitationCreateResult | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('create_room_invitation', {
      p_room_id: roomId,
      p_invitee_uid: inviteeUid || null,
      p_expires_hours: expiresHours
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '创建房间邀请失败' }
  }
}

export async function acceptRoomInvitation(
  inviteCode: string
): Promise<{ data: RoomInvitationAcceptResult | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('accept_room_invitation', {
      p_invite_code: inviteCode
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '接受房间邀请失败' }
  }
}

export async function rejectRoomInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('reject_room_invitation', {
      p_invitation_id: invitationId
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: data }
  } catch (error) {
    return { success: false, error: '拒绝房间邀请失败' }
  }
}

export async function getUserInvitations(): Promise<{ data: RoomInvitation[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_user_invitations')

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '获取房间邀请失败' }
  }
}

export async function getRoomInvitations(
  roomId: string
): Promise<{ data: any[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_room_invitations', {
      p_room_id: roomId
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '获取房间邀请失败' }
  }
}

export async function subscribeToInvitations(
  callback: (invitations: RoomInvitation[]) => void
) {
  const channel = supabase
    .channel('room-invitations-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'room_invitations'
      },
      async () => {
        const { data } = await getUserInvitations()
        if (data) {
          callback(data)
        }
      }
    )
    .subscribe()

  return channel
}

export function generateInviteLink(inviteCode: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/invite/${inviteCode}`
  }
  return `/invite/${inviteCode}`
}

export function generateQRCodeUrl(inviteCode: string): string {
  const inviteLink = generateInviteLink(inviteCode)
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}`
}
