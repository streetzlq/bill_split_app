// Placeholder Supabase client - install @supabase/supabase-js after app runs
export const supabase = {
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => ({ error: null, data: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: '' } }),
    }),
  },
  from: (table: string) => ({
    select: () => ({
      order: () => ({ limit: () => ({ data: null, error: null }), data: null, error: null }),
      data: null,
      error: null,
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async () => ({ data: { id: '1' }, error: null }),
        data: null,
        error: null,
      }),
      data: null,
      error: null,
    }),
  }),
} as any;
