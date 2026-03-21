-- Add room invitation system
CREATE TABLE IF NOT EXISTS public.room_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  inviter_uid uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_uid uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invite_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_room_invitations_room_id ON public.room_invitations(room_id);
CREATE INDEX IF NOT EXISTS idx_room_invitations_invite_code ON public.room_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_room_invitations_invitee_uid ON public.room_invitations(invitee_uid);
CREATE INDEX IF NOT EXISTS idx_room_invitations_status ON public.room_invitations(status);
CREATE INDEX IF NOT EXISTS idx_room_invitations_expires_at ON public.room_invitations(expires_at);

-- Function to generate invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$;

-- Function to create room invitation
CREATE OR REPLACE FUNCTION create_room_invitation(
  p_room_id uuid,
  p_invitee_uid uuid DEFAULT NULL,
  p_expires_hours int DEFAULT 24
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inviter_uid uuid;
  v_invite_code text;
  v_expires_at timestamptz;
  v_invitation_id uuid;
  v_room_status text;
BEGIN
  -- Get current user
  v_inviter_uid := auth.uid();
  IF v_inviter_uid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check room status
  SELECT status INTO v_room_status
  FROM public.rooms
  WHERE id = p_room_id;

  IF v_room_status IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_room_status != 'open' THEN
    RAISE EXCEPTION 'Room is not open for invitations';
  END IF;

  -- Generate unique invite code
  LOOP
    v_invite_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.room_invitations
      WHERE invite_code = v_invite_code
      AND status = 'pending'
      AND expires_at > now()
    );
  END LOOP;

  -- Set expiration time
  v_expires_at := now() + (p_expires_hours || ' hours')::interval;

  -- Create invitation
  INSERT INTO public.room_invitations (
    room_id,
    inviter_uid,
    invitee_uid,
    invite_code,
    status,
    expires_at
  )
  VALUES (
    p_room_id,
    v_inviter_uid,
    p_invitee_uid,
    v_invite_code,
    'pending',
    v_expires_at
  )
  RETURNING id INTO v_invitation_id;

  -- Notify invitee if specified
  IF p_invitee_uid IS NOT NULL THEN
    PERFORM pg_notify(
      'user:' || p_invitee_uid::text,
      json_build_object(
        'type', 'room_invitation',
        'invitation_id', v_invitation_id,
        'room_id', p_room_id,
        'inviter_uid', v_inviter_uid,
        'invite_code', v_invite_code,
        'expires_at', v_expires_at
      )::text
    );
  END IF;

  RETURN json_build_object(
    'invitation_id', v_invitation_id,
    'invite_code', v_invite_code,
    'expires_at', v_expires_at
  );
END;
$$;

-- Function to accept room invitation
CREATE OR REPLACE FUNCTION accept_room_invitation(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation record;
  v_user_uid uuid;
  v_room_status text;
  v_room_mode text;
  v_current_members int;
BEGIN
  -- Get current user
  v_user_uid := auth.uid();
  IF v_user_uid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Find invitation
  SELECT * INTO v_invitation
  FROM public.room_invitations
  WHERE invite_code = p_invite_code
  AND status = 'pending'
  AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Check if invitation is for specific user
  IF v_invitation.invitee_uid IS NOT NULL AND v_invitation.invitee_uid != v_user_uid THEN
    RAISE EXCEPTION 'This invitation is not for you';
  END IF;

  -- Check room status
  SELECT status, mode INTO v_room_status, v_room_mode
  FROM public.rooms
  WHERE id = v_invitation.room_id;

  IF v_room_status != 'open' THEN
    RAISE EXCEPTION 'Room is no longer open';
  END IF;

  -- Check room capacity
  SELECT COUNT(*) INTO v_current_members
  FROM public.room_members
  WHERE room_id = v_invitation.room_id;

  IF v_room_mode = 'pvp4' AND v_current_members >= 4 THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- Add user to room
  INSERT INTO public.room_members (room_id, uid, seat_no)
  VALUES (
    v_invitation.room_id,
    v_user_uid,
    v_current_members
  );

  -- Update invitation status
  UPDATE public.room_invitations
  SET status = 'accepted',
      updated_at = now()
  WHERE id = v_invitation.id;

  -- Notify room
  PERFORM pg_notify(
    'room:' || v_invitation.room_id::text,
    json_build_object(
      'type', 'member_joined',
      'uid', v_user_uid
    )::text
  );

  RETURN json_build_object(
    'room_id', v_invitation.room_id,
    'invitation_id', v_invitation.id
  );
END;
$$;

-- Function to reject room invitation
CREATE OR REPLACE FUNCTION reject_room_invitation(p_invitation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation record;
  v_user_uid uuid;
BEGIN
  -- Get current user
  v_user_uid := auth.uid();
  IF v_user_uid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Find invitation
  SELECT * INTO v_invitation
  FROM public.room_invitations
  WHERE id = p_invitation_id
  AND invitee_uid = v_user_uid
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  -- Update invitation status
  UPDATE public.room_invitations
  SET status = 'rejected',
      updated_at = now()
  WHERE id = v_invitation.id;

  RETURN true;
END;
$$;

-- Function to get user's invitations
CREATE OR REPLACE FUNCTION get_user_invitations()
RETURNS TABLE (
  invitation_id uuid,
  room_id uuid,
  room_name text,
  room_mode text,
  inviter_nickname text,
  inviter_avatar_url text,
  invite_code text,
  status text,
  expires_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ri.id,
    ri.room_id,
    r.name,
    r.mode,
    p.nickname,
    p.avatar_url,
    ri.invite_code,
    ri.status,
    ri.expires_at,
    ri.created_at
  FROM public.room_invitations ri
  JOIN public.rooms r ON ri.room_id = r.id
  JOIN public.profiles p ON ri.inviter_uid = p.uid
  WHERE ri.invitee_uid = auth.uid()
  AND ri.status = 'pending'
  AND ri.expires_at > now()
  ORDER BY ri.created_at DESC;
END;
$$;

-- Function to get room invitations
CREATE OR REPLACE FUNCTION get_room_invitations(p_room_id uuid)
RETURNS TABLE (
  invitation_id uuid,
  invitee_nickname text,
  invitee_avatar_url text,
  invite_code text,
  status text,
  expires_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_owner_uid uuid;
BEGIN
  -- Get room owner
  SELECT owner_uid INTO v_room_owner_uid
  FROM public.rooms
  WHERE id = p_room_id;

  -- Check if user is room owner
  IF v_room_owner_uid != auth.uid() THEN
    RAISE EXCEPTION 'Only room owner can view invitations';
  END IF;

  RETURN QUERY
  SELECT
    ri.id,
    p.nickname,
    p.avatar_url,
    ri.invite_code,
    ri.status,
    ri.expires_at,
    ri.created_at
  FROM public.room_invitations ri
  LEFT JOIN public.profiles p ON ri.invitee_uid = p.uid
  WHERE ri.room_id = p_room_id
  ORDER BY ri.created_at DESC;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.room_invitations TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invite_code TO authenticated;
GRANT EXECUTE ON FUNCTION create_room_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION accept_room_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION reject_room_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_invitations TO authenticated;
GRANT EXECUTE ON FUNCTION get_room_invitations TO authenticated;

-- Enable RLS
ALTER TABLE public.room_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view invitations sent to them"
ON public.room_invitations
FOR SELECT
USING (
  invitee_uid = auth.uid()
  OR inviter_uid = auth.uid()
);

CREATE POLICY "Users can create invitations"
ON public.room_invitations
FOR INSERT
WITH CHECK (inviter_uid = auth.uid());

CREATE POLICY "Users can update their invitations"
ON public.room_invitations
FOR UPDATE
USING (
  inviter_uid = auth.uid()
  OR invitee_uid = auth.uid()
);

CREATE POLICY "Users can delete their invitations"
ON public.room_invitations
FOR DELETE
USING (inviter_uid = auth.uid());
