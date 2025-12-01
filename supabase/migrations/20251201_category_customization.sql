-- Add customization columns to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS bg_color TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS text_color TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_bg_color TEXT;

-- Add comments for documentation
COMMENT ON COLUMN categories.icon IS 'Emoji or icon character for the category';
COMMENT ON COLUMN categories.bg_color IS 'Background color for category card (hex format)';
COMMENT ON COLUMN categories.text_color IS 'Text color for category name (hex format)';
COMMENT ON COLUMN categories.icon_bg_color IS 'Background color for the icon container (hex format)';
