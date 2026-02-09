import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	let response = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
					response = NextResponse.next({ request });
					cookiesToSet.forEach(({ name, value, options }) =>
						response.cookies.set(name, value, options)
					);
				},
			},
		}
	);

	const code = request.nextUrl.searchParams.get("code");
	const next = request.nextUrl.searchParams.get("next") ?? "/player/first-login";

	if (code) {
		await supabase.auth.exchangeCodeForSession(code);
	}

	const redirectUrl = request.nextUrl.clone();
	redirectUrl.pathname = next;
	redirectUrl.search = "";

	const redirectResponse = NextResponse.redirect(redirectUrl);
	response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
	return redirectResponse;
}
