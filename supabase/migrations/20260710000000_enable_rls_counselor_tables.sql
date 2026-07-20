-- Enable RLS on all three tables
ALTER TABLE public.counselor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_messages ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════
-- counselor_profiles
-- ═══════════════════════════════════════════════════

-- SELECT: all authenticated users (students browse directory, counselors view their own)
CREATE POLICY "Anyone authenticated can view active counselor profiles"
  ON public.counselor_profiles FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: admin only
CREATE POLICY "Admins can create counselor profiles"
  ON public.counselor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: admin or the counselor themselves
CREATE POLICY "Admins or counselors can update profiles"
  ON public.counselor_profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR id = auth.uid())
  WITH CHECK (public.is_admin() OR id = auth.uid());

-- DELETE: admin only
CREATE POLICY "Admins can delete counselor profiles"
  ON public.counselor_profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════
-- counselor_sessions
-- ═══════════════════════════════════════════════════

-- SELECT: student owner, assigned counselor, or admin
CREATE POLICY "Participants and admins can view sessions"
  ON public.counselor_sessions FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR counselor_id = auth.uid()
    OR public.is_admin()
  );

-- INSERT: service_role only (webhook), no user policy needed
-- UPDATE: admin only
CREATE POLICY "Admins can update sessions"
  ON public.counselor_sessions FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: admin only
CREATE POLICY "Admins can delete sessions"
  ON public.counselor_sessions FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════
-- counselor_messages
-- ═══════════════════════════════════════════════════

-- SELECT: session participants or admin
CREATE POLICY "Session participants and admins can view messages"
  ON public.counselor_messages FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.counselor_sessions cs
      WHERE cs.id = counselor_messages.session_id
        AND (cs.student_id = auth.uid() OR cs.counselor_id = auth.uid())
    )
  );

-- INSERT: session participants sending as themselves
CREATE POLICY "Session participants can send messages"
  ON public.counselor_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.counselor_sessions cs
      WHERE cs.id = session_id
        AND (cs.student_id = auth.uid() OR cs.counselor_id = auth.uid())
    )
  );

-- UPDATE: admin only
CREATE POLICY "Admins can update messages"
  ON public.counselor_messages FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: admin only
CREATE POLICY "Admins can delete messages"
  ON public.counselor_messages FOR DELETE
  TO authenticated
  USING (public.is_admin());
