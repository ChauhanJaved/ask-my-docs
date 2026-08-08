import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generateEmbedding } from "@/lib/document-processing";

export async function POST(request: Request) {
  try {
    const { query, limit = 5 } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: "Valid query string is required" }, { status: 400 });
    }

    // Get organization ID from authenticated user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Perform vector similarity search using Supabase RPC
    const { data: results, error: searchError } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_count: limit,
        org_id: profile.organization_id
      });

    if (searchError) throw searchError;

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "An unknown error occurred" }, { status: 500 });
  }
}