import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dwtwebicftpvcthahmpr.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_gzzF72I96mTy2okr2AyZbw_K855_bwF'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)