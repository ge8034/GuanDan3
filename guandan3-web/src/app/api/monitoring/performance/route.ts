import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const metrics = await request.json()

    const supabase = createClient()

    const { data, error } = await supabase
      .from('performance_metrics')
      .insert({
        page: metrics.page,
        timestamp: new Date(metrics.timestamp).toISOString(),
        fcp: metrics.fcp,
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls,
        ttfb: metrics.ttfb,
        load_time: metrics.loadTime,
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      })
      .select()

    if (error) {
      console.error('Failed to insert performance metrics:', error)
      return NextResponse.json({ error: 'Failed to record metrics' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Performance monitoring error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('performance_metrics')
      .select('id,page,timestamp,fcp,lcp,fid,cls,ttfb,load_time,user_agent,ip_address')
      .order('timestamp', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Performance monitoring GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
