"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AnonymousAuthInit() {
  useEffect(() => {
    async function initAuth() {
      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          await supabase.auth.signInAnonymously();
        }
      } catch (err) {
        // Supabase URL/Key 미설정 시 또는 네트워크 일시 장애 시에도 UI 렌더링 유지
        console.warn("익명 인증 초기화 대기:", err);
      }
    }

    initAuth();
  }, []);

  return null;
}
