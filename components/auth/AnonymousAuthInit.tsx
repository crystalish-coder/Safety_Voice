"use client";

import { useEffect } from "react";
import { getOrCreateAnonymousUserId } from "@/lib/supabase/anonUser";

export default function AnonymousAuthInit() {
  useEffect(() => {
    // 마운트 시 익명 사용자 식별자 사전 초기화
    getOrCreateAnonymousUserId().catch(() => {});
  }, []);

  return null;
}
