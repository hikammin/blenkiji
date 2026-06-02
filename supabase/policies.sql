-- supabase/policies.sql
-- Blender記事市場向け Supabase RLS (Row Level Security) 「ゼロ・トラスト」ポリシー

-- ==========================================
-- テーブル: users
-- ==========================================
-- ユーザーテーブルのRLSを有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 1. 全ユーザーがプロフィール情報を閲覧できる (SELECT)
CREATE POLICY "Users are viewable by everyone." 
  ON public.users FOR SELECT 
  USING (true);

-- 2. ユーザーは自身の情報のみ更新できる (UPDATE)
CREATE POLICY "Users can update their own profile." 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- 3. 管理者(Admin)は全てのユーザー情報を操作できる (ALL)
CREATE POLICY "Admins have full access to users." 
  ON public.users FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- テーブル: articles (posts)
-- ==========================================
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 1. 公開されている記事は誰でも閲覧できる (SELECT)
CREATE POLICY "Public articles are viewable by everyone." 
  ON public.articles FOR SELECT 
  USING (is_public = true);

-- 2. 記事の作成者(本人)は、自身の非公開記事も含めて閲覧できる (SELECT)
CREATE POLICY "Users can view their own articles." 
  ON public.articles FOR SELECT 
  USING (auth.uid() = author_id);

-- 3. 認証済みのユーザーのみ記事を作成できる (INSERT)
CREATE POLICY "Authenticated users can insert articles." 
  ON public.articles FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

-- 4. 記事の作成者(本人)のみ記事を更新・編集できる (UPDATE)
CREATE POLICY "Users can update their own articles." 
  ON public.articles FOR UPDATE 
  USING (auth.uid() = author_id);

-- 5. 記事の作成者(本人)のみ記事を削除できる (DELETE)
CREATE POLICY "Users can delete their own articles." 
  ON public.articles FOR DELETE 
  USING (auth.uid() = author_id);

-- 6. 管理者(Admin)は不適切な記事を非公開・削除など全操作可能 (ALL)
CREATE POLICY "Admins have full access to all articles." 
  ON public.articles FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- テーブル: comments
-- ==========================================
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 1. 記事に紐づくコメントは全員閲覧できる (SELECT)
CREATE POLICY "Comments are viewable by everyone." 
  ON public.comments FOR SELECT 
  USING (true);

-- 2. 認証済みのユーザーのみコメントを作成できる (INSERT)
CREATE POLICY "Authenticated users can insert comments." 
  ON public.comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 3. コメント作成者(本人)のみ更新・削除できる (UPDATE, DELETE)
CREATE POLICY "Users can update/delete their own comments." 
  ON public.comments FOR ALL 
  USING (auth.uid() = user_id);

-- 4. 管理者(Admin)は全てのコメントを操作できる (ALL)
CREATE POLICY "Admins can manage all comments." 
  ON public.comments FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- テーブル: reports (通報)
-- ==========================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 1. 認証済みのユーザーは通報を送信できる (INSERT)
CREATE POLICY "Users can insert reports." 
  ON public.reports FOR INSERT 
  WITH CHECK (auth.uid() = reporter_id);

-- 2. 管理者のみ通報データを閲覧・操作できる (ALL)
CREATE POLICY "Only admins can view and manage reports." 
  ON public.reports FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
