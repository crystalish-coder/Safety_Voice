import { getSupabaseBrowserClient } from "./client";

const LOCAL_STORAGE_ANON_KEY = "safety_voice_anonymous_user_id";

/**
 * 안전한 익명 사용자 ID 획득 함수
 * 1) Supabase Anonymous Auth 세션 확인/발급
 * 2) Supabase Auth 비활성화 시 localStorage 기반 고유 UUID 자동 폴백
 */
export async function getOrCreateAnonymousUserId(): Promise<string> {
  const supabase = getSupabaseBrowserClient();

  if (supabase) {
    try {
      let {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (!error && data?.session) {
          session = data.session;
        }
      }

      if (session?.user?.id) {
        return session.user.id;
      }
    } catch (err) {
      console.warn("Supabase signInAnonymously 대기/폴백 전환:", err);
    }
  }

  // 폴백: 브라우저 로컬 스토리지에 영구 보관되는 고유 익명 UUID 사용
  if (typeof window !== "undefined") {
    let localUid = localStorage.getItem(LOCAL_STORAGE_ANON_KEY);
    if (!localUid) {
      localUid = crypto.randomUUID();
      localStorage.setItem(LOCAL_STORAGE_ANON_KEY, localUid);
    }
    return localUid;
  }

  return "00000000-0000-0000-0000-000000000001";
}
