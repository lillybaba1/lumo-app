-- Migration: Direct Messaging System
-- Description: Customer-to-seller messaging for boutiques

-- Conversations table (links customers and sellers)
CREATE TABLE IF NOT EXISTS seller_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  subject TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  customer_unread_count INT DEFAULT 0,
  seller_unread_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boutique_id, customer_id, order_id)
);

-- Messages within conversations
CREATE TABLE IF NOT EXISTS seller_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES seller_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'seller')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quick reply templates for sellers
CREATE TABLE IF NOT EXISTS seller_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message notification preferences
CREATE TABLE IF NOT EXISTS seller_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  auto_reply_enabled BOOLEAN DEFAULT FALSE,
  auto_reply_message TEXT,
  business_hours_only BOOLEAN DEFAULT FALSE,
  business_hours_start TIME DEFAULT '09:00',
  business_hours_end TIME DEFAULT '17:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boutique_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_boutique ON seller_conversations(boutique_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON seller_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON seller_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON seller_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON seller_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quick_replies_boutique ON seller_quick_replies(boutique_id);

-- Enable RLS
ALTER TABLE seller_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_notification_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (in case they exist from previous migrations)
DROP POLICY IF EXISTS "Sellers can view their boutique conversations" ON seller_conversations;
DROP POLICY IF EXISTS "Customers can view their own conversations" ON seller_conversations;
DROP POLICY IF EXISTS "Customers can create conversations" ON seller_conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON seller_conversations;
DROP POLICY IF EXISTS "Conversation participants can view messages" ON seller_messages;
DROP POLICY IF EXISTS "Conversation participants can send messages" ON seller_messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON seller_messages;
DROP POLICY IF EXISTS "Sellers can manage their quick replies" ON seller_quick_replies;
DROP POLICY IF EXISTS "Sellers can manage their notification settings" ON seller_notification_settings;

-- RLS Policies for seller_conversations
CREATE POLICY "Sellers can view their boutique conversations"
  ON seller_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = seller_conversations.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view their own conversations"
  ON seller_conversations FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can create conversations"
  ON seller_conversations FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Participants can update conversations"
  ON seller_conversations FOR UPDATE
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = seller_conversations.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for seller_messages
CREATE POLICY "Conversation participants can view messages"
  ON seller_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seller_conversations c
      WHERE c.id = seller_messages.conversation_id
      AND (
        c.customer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM boutiques b
          JOIN business_accounts ba ON b.business_account_id = ba.id
          WHERE b.id = c.boutique_id
          AND ba.owner_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Conversation participants can send messages"
  ON seller_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM seller_conversations c
      WHERE c.id = seller_messages.conversation_id
      AND (
        c.customer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM boutiques b
          JOIN business_accounts ba ON b.business_account_id = ba.id
          WHERE b.id = c.boutique_id
          AND ba.owner_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Recipients can mark messages as read"
  ON seller_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seller_conversations c
      WHERE c.id = seller_messages.conversation_id
      AND (
        c.customer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM boutiques b
          JOIN business_accounts ba ON b.business_account_id = ba.id
          WHERE b.id = c.boutique_id
          AND ba.owner_user_id = auth.uid()
        )
      )
    )
  );

-- RLS Policies for seller_quick_replies
CREATE POLICY "Sellers can manage their quick replies"
  ON seller_quick_replies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = seller_quick_replies.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for seller_notification_settings
CREATE POLICY "Sellers can manage their notification settings"
  ON seller_notification_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = seller_notification_settings.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE seller_conversations
  SET 
    last_message_at = NOW(),
    updated_at = NOW(),
    seller_unread_count = CASE 
      WHEN NEW.sender_type = 'customer' THEN seller_unread_count + 1
      ELSE seller_unread_count
    END,
    customer_unread_count = CASE 
      WHEN NEW.sender_type = 'seller' THEN customer_unread_count + 1
      ELSE customer_unread_count
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating conversation on new message
DROP TRIGGER IF EXISTS on_new_message ON seller_messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON seller_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();
