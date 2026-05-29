import { NextResponse } from "next/server";
import { createClient } from "../../lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError =
    searchParams.get("error_description") || searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(oauthError)}`
    );
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(error.message)}`
        );
      }
    } catch (err) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(err.message || "auth_failed")}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/auth/finish`);
}
