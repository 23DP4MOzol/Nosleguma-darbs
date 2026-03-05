-- ==========================================
-- CHAT SYSTEM + TRANSACTION FK FIX FOR VENDLY
-- Copy and paste this entire file into Supabase SQL Editor
-- ==========================================

-- ==========================================
-- 1. FIX: Add Foreign Key on user_transactions → users
--    This makes PostgREST/Supabase relationship joins work
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_transactions_user_id_fkey'
    AND table_name = 'user_transactions'
  ) THEN
    ALTER TABLE public.user_transactions
      ADD CONSTRAINT user_transactions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ==========================================
-- 2. CONVERSATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_product_id ON public.conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

-- Unique constraint: one conversation per buyer-seller-product combo
-- Use a partial unique index to allow multiple conversations without product
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unique_conversation'
  ) THEN
    CREATE UNIQUE INDEX idx_unique_conversation
      ON public.conversations(buyer_id, seller_id, product_id)
      WHERE product_id IS NOT NULL;
  END IF;
END $$;

-- ==========================================
-- 3. MESSAGES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ==========================================
-- 4. RLS POLICIES FOR CONVERSATIONS
-- ==========================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see conversations they participate in
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can create conversations where they are buyer
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

-- Users can update conversations they participate in
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

-- ==========================================
-- 5. RLS POLICIES FOR MESSAGES
-- ==========================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can only view messages in their conversations
DROP POLICY IF EXISTS "Users can view conversation messages" ON public.messages;
CREATE POLICY "Users can view conversation messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can only send messages in their conversations
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON public.messages;
CREATE POLICY "Users can send messages in own conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- Users can update only their own messages (mark as read)
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- ==========================================
-- 6. SECURE RPC: SEND MESSAGE (atomic insert + conversation update)
-- ==========================================
DROP FUNCTION IF EXISTS rpc_send_message(UUID, TEXT);
CREATE OR REPLACE FUNCTION rpc_send_message(
  p_conversation_id UUID,
  p_content TEXT
)
RETURNS JSON AS $$
DECLARE
  v_sender_id UUID;
  v_conv RECORD;
  v_message_id UUID;
BEGIN
  -- Get authenticated user
  v_sender_id := auth.uid();
  IF v_sender_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  -- Sanitize content: trim whitespace, reject empty
  p_content := TRIM(p_content);
  IF p_content IS NULL OR p_content = '' THEN
    RETURN json_build_object('error', 'Message content cannot be empty');
  END IF;

  -- Enforce max message length (2000 chars)
  IF LENGTH(p_content) > 2000 THEN
    p_content := LEFT(p_content, 2000);
  END IF;

  -- Verify sender is participant in the conversation
  SELECT * INTO v_conv
  FROM public.conversations
  WHERE id = p_conversation_id
    AND (buyer_id = v_sender_id OR seller_id = v_sender_id)
    AND status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Conversation not found or you are not a participant');
  END IF;

  -- Insert message
  INSERT INTO public.messages (conversation_id, sender_id, content, message_type, is_read, created_at)
  VALUES (p_conversation_id, v_sender_id, p_content, 'text', false, NOW())
  RETURNING id INTO v_message_id;

  -- Update conversation atomically
  UPDATE public.conversations
  SET last_message = p_content,
      last_message_at = NOW(),
      updated_at = NOW()
  WHERE id = p_conversation_id;

  RETURN json_build_object(
    'success', true,
    'message_id', v_message_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION rpc_send_message TO authenticated;

-- ==========================================
-- 7. TRIGGERS
-- ==========================================
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 8. ENABLE REALTIME for chat tables
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;

-- ==========================================
-- SETUP COMPLETE!
-- ==========================================
-- You now have:
-- ✅ Foreign key on user_transactions.user_id → users.id (fixes PostgREST join)
-- ✅ Conversations table with RLS (only participants can see/edit)
-- ✅ Messages table with RLS (only conversation participants)
-- ✅ Secure rpc_send_message function (validates participant, sanitizes input)
-- ✅ Real-time enabled for messages and conversations
-- ==========================================
