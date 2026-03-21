import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const analyticsData = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        event_name: analyticsData.eventName,
        event_type: analyticsData.eventType,
        page: analyticsData.page,
        user_id: analyticsData.userId,
        session_id: analyticsData.sessionId,
        timestamp: new Date(analyticsData.timestamp).toISOString(),
        properties: analyticsData.properties,
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      })
      .select()

    if (error) {
      console.error('Failed to log analytics event:', error)
      return NextResponse.json(
        { error: 'Failed to log analytics event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error logging analytics event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { searchParams } = new URL(request.url)
    const eventName = searchParams.get('eventName')
    const eventType = searchParams.get('eventType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const aggregate = searchParams.get('aggregate')

    let query = supabase
      .from('analytics_events')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })

    if (eventName) {
      query = query.eq('event_name', eventName)
    }

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    if (startDate) {
      query = query.gte('timestamp', new Date(startDate).toISOString())
    }

    if (endDate) {
      query = query.lte('timestamp', new Date(endDate).toISOString())
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Failed to fetch analytics events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analytics events' },
        { status: 500 }
      )
    }

    if (aggregate === 'daily') {
      const dailyStats = data.reduce((acc: any, event: any) => {
        const date = event.timestamp.split('T')[0]
        if (!acc[date]) {
          acc[date] = { date, count: 0, events: {} }
        }
        acc[date].count++
        if (!acc[date].events[event.event_name]) {
          acc[date].events[event.event_name] = 0
        }
        acc[date].events[event.event_name]++
        return acc
      }, {})

      return NextResponse.json({
        data: Object.values(dailyStats),
        count,
        aggregate: 'daily'
      })
    }

    if (aggregate === 'event_type') {
      const typeStats = data.reduce((acc: any, event: any) => {
        if (!acc[event.event_type]) {
          acc[event.event_type] = { type: event.event_type, count: 0 }
        }
        acc[event.event_type].count++
        return acc
      }, {})

      return NextResponse.json({
        data: Object.values(typeStats),
        count,
        aggregate: 'event_type'
      })
    }

    return NextResponse.json({
      data,
      count
    })
  } catch (error) {
    console.error('Error fetching analytics events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
